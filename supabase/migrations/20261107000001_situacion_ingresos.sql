-- Situación de ingresos de la persona: si recibe una pensión o un subsidio como Colombia Mayor.
-- Solo sirve para avisarle a ELLA cuando un acuerdo puede hacerle perder el subsidio o pide otra
-- forma de contrato. Nunca la ven las organizaciones ni entra al emparejamiento (regla 1): vive en
-- talent_private, que no tiene lectura directa por la API.
--
-- Valores de talent_private.pension (la columna ya existía, sin uso):
--   vejez_invalidez · sobrevivencia · colombia_mayor · ninguno · no_dice
-- hogar: si vive sola o con su familia; cambia el tope de ingresos de Colombia Mayor.

alter table talent_private
  add constraint situacion_ingresos_valida
    check (pension in ('vejez_invalidez', 'sobrevivencia', 'colombia_mayor', 'ninguno', 'no_dice')) not valid,
  add column hogar text check (hogar in ('sola', 'familia'));

-- Si la organización es pública: con una entidad pública, quien recibe una pensión no puede tener
-- un segundo pago del Estado como salario (Constitución, art. 128); sí por prestación de servicios.
alter table companies
  add column naturaleza text check (naturaleza in ('privada', 'publica'));

-- La persona guarda (o cambia) su situación. Solo la suya.
create function public.guardar_situacion_ingresos(situacion text, hogar text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  perfil uuid;
begin
  select id into perfil from talent_profiles where user_id = auth.uid();
  if perfil is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if situacion is not null
     and situacion not in ('vejez_invalidez', 'sobrevivencia', 'colombia_mayor', 'ninguno', 'no_dice') then
    raise exception 'situación no válida' using errcode = '22023';
  end if;
  if hogar is not null and hogar not in ('sola', 'familia') then
    raise exception 'hogar no válido' using errcode = '22023';
  end if;
  insert into talent_private as t (talent_id, pension, hogar)
  values (perfil, situacion, case when situacion = 'colombia_mayor' then hogar end)
  on conflict (talent_id) do update set
    pension = excluded.pension,
    hogar = excluded.hogar;
end
$$;

-- La persona puede ver lo que ella misma contó (para cambiarlo). Nadie más por la API.
create function public.mi_situacion_ingresos()
returns table (situacion text, hogar text)
language sql stable security definer set search_path = public as $$
  select t.pension, t.hogar
  from talent_private t
  join talent_profiles p on p.id = t.talent_id
  where p.user_id = auth.uid()
$$;

-- Ingreso mensual aproximado de un acuerdo. Las conversaciones y los acuerdos por persona no
-- tienen un mensual que se pueda calcular.
create function public.ingreso_mensual(valor numeric, unidad text, horas int) returns numeric
language sql stable security definer set search_path = public as $$
  select case
    when valor is null then null
    when unidad = 'mes' then valor
    when unidad = 'hora' and horas is not null then valor * horas * 30.0 / 7
    when unidad = 'proyecto' then valor / public.param_digno('semanas_proyecto') * 30.0 / 7
    else null
  end
$$;
revoke execute on function public.ingreso_mensual(numeric, text, int) from public, anon;

-- Avisos para la persona antes de aceptar un acuerdo. Devuelve solo avisos, no el dato guardado.
--   colombia_mayor: el total al mes (este acuerdo + los que tiene en curso) frente al tope.
--   entidad_publica: recibe una pensión y la organización es pública.
--   aportes: recibe una pensión de vejez o invalidez (no cotiza pensión; sí salud y riesgos).
create function public.avisos_ingresos(conexion uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  c connections;
  situacion text;
  vive text;
  minimo numeric := public.param_digno('salario_minimo_mensual');
  mensual numeric;
  otros numeric;
  tope numeric;
  naturaleza_org text;
  avisos jsonb := '[]'::jsonb;
begin
  select * into c from connections where id = conexion;
  if not found or not public.es_mi_perfil(c.talent_id) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  select t.pension, t.hogar into situacion, vive from talent_private t where t.talent_id = c.talent_id;
  if situacion is null or situacion in ('ninguno', 'no_dice') then return avisos; end if;

  if situacion = 'colombia_mayor' then
    mensual := public.ingreso_mensual(c.acuerdo_valor, c.acuerdo_unidad, c.acuerdo_horas_semana);
    select coalesce(sum(public.ingreso_mensual(o.acuerdo_valor, o.acuerdo_unidad, o.acuerdo_horas_semana)), 0)
      into otros
    from connections o
    where o.talent_id = c.talent_id and o.id <> c.id and o.estado::text = 'en_curso';
    -- Sin saber si vive sola, se usa el tope más bajo: es el que protege.
    tope := minimo * case when vive = 'familia' then 1 else 0.5 end;
    if mensual is not null then
      avisos := avisos || jsonb_build_array(jsonb_build_object(
        'codigo', 'colombia_mayor',
        'mensual', round(mensual),
        'total', round(mensual + otros),
        'tope', round(tope),
        'hogar', vive,
        'supera', (mensual + otros) > tope
      ));
    end if;
  end if;

  if situacion in ('vejez_invalidez', 'sobrevivencia') then
    select co.naturaleza into naturaleza_org from companies co where co.id = c.company_id;
    if naturaleza_org = 'publica' then
      avisos := avisos || jsonb_build_array(jsonb_build_object('codigo', 'entidad_publica'));
    end if;
  end if;

  if situacion = 'vejez_invalidez' then
    avisos := avisos || jsonb_build_array(jsonb_build_object('codigo', 'aportes'));
  end if;

  return avisos;
end
$$;

revoke execute on function public.guardar_situacion_ingresos(text, text) from public, anon;
grant execute on function public.guardar_situacion_ingresos(text, text) to authenticated;
revoke execute on function public.mi_situacion_ingresos() from public, anon;
grant execute on function public.mi_situacion_ingresos() to authenticated;
revoke execute on function public.avisos_ingresos(uuid) from public, anon;
grant execute on function public.avisos_ingresos(uuid) to authenticated;
