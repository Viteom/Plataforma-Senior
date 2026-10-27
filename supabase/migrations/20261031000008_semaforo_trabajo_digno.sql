-- Semáforo de trabajo digno: Kánna revisa sola cada reto y cada acuerdo con reglas claras.
--   Verde: cumple todo; se aprueba sin esperar al equipo (y una parte va a una muestra de control).
--   Amarillo: algo necesita una mirada humana; queda pendiente en la cola del equipo.
--   Rojo: incumple algo claro; el reto vuelve a la organización con los motivos.
-- No mira la edad ni la salud de nadie: revisa el pago, la jornada, el texto y la organización.
-- Los umbrales y las expresiones viven en tablas que administración edita sin programar.

create table parametros_trabajo_digno (
  clave text primary key,
  valor numeric not null check (valor >= 0),
  descripcion text not null,
  actualizado_por uuid references auth.users,
  actualizado_en timestamptz not null default now()
);
alter table parametros_trabajo_digno enable row level security;
revoke all on parametros_trabajo_digno from anon;
create policy parametros_leer on parametros_trabajo_digno for select to authenticated using (public.es_equipo());
create policy parametros_editar on parametros_trabajo_digno for update to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- Valores iniciales: confirmarlos con asesoría laboral antes del piloto.
insert into parametros_trabajo_digno (clave, valor, descripcion) values
  ('salario_minimo_mensual', 1423500, 'Salario mínimo mensual legal vigente, en pesos. Actualizar cada año.'),
  ('jornada_maxima_semana', 42, 'Jornada máxima legal en horas a la semana. Más que esto es rojo.'),
  ('jornada_alerta_semana', 40, 'Desde estas horas a la semana el reto pasa a revisión humana.'),
  ('margen_pago_alerta', 1.10, 'Si el pago por hora queda por debajo del mínimo por este factor, pasa a revisión humana.'),
  ('semanas_proyecto', 4, 'Semanas que se suponen para calcular el pago por hora de un proyecto.'),
  ('margen_acuerdo', 0.10, 'Cuánto puede bajar el pago o subir la jornada de un acuerdo frente al reto aprobado (0,10 = 10 %).'),
  ('muestreo_verdes_pct', 10, 'Porcentaje de aprobaciones automáticas que el equipo revisa al azar.'),
  ('version_reglas', 1, 'Versión de las reglas; súbela cuando cambies algo importante.');

create table reglas_texto_digno (
  id serial primary key,
  patron text not null check (length(patron) between 3 and 200),
  color text not null check (color in ('rojo', 'amarillo')),
  motivo text not null check (length(motivo) between 5 and 200),
  activa boolean not null default true
);
alter table reglas_texto_digno enable row level security;
revoke all on reglas_texto_digno from anon;
create policy reglas_leer on reglas_texto_digno for select to authenticated using (public.es_equipo());
create policy reglas_editar on reglas_texto_digno for all to authenticated
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');
grant usage on sequence reglas_texto_digno_id_seq to authenticated;

-- Una expresión mal escrita no puede dejar sin revisar los retos: se valida al guardarla.
create function public.validar_regla_texto() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  begin
    perform '' ~ new.patron;
  exception when others then
    raise exception 'La expresión «%» no es válida', new.patron using errcode = '22023';
  end;
  return new;
end $$;
create trigger regla_texto_valida before insert or update on reglas_texto_digno
  for each row execute function public.validar_regla_texto();
revoke execute on function public.validar_regla_texto() from public, anon, authenticated;

-- Expresiones sobre el texto sin tildes y en minúscula (ver texto_normalizado).
insert into reglas_texto_digno (patron, color, motivo) values
  ('\mjoven(es)?\M|\mjuvenil\M', 'rojo', 'Pide personas jóvenes: Kánna no permite filtrar por edad.'),
  ('(menor(es)?|maximo|hasta|no mayor(es)?) (de )?[0-9]{2} anos', 'rojo', 'Pone un límite de edad: Kánna no permite filtrar por edad.'),
  ('edad (maxima|limite|entre)', 'rojo', 'Pone un límite de edad: Kánna no permite filtrar por edad.'),
  ('buena presencia', 'rojo', 'Pide «buena presencia»: describe la tarea, no a la persona.'),
  ('recien egresad', 'rojo', 'Pide recién egresados: Kánna no permite filtrar por edad.'),
  ('inscripcion|consign|cuota de ingreso|deposito|pagar (por|para) (participar|el curso|la capacitacion)', 'rojo', 'Pide dinero a la persona: nadie paga por una oportunidad.'),
  ('ad honorem|sin (pago|remuneracion|sueldo)|voluntari|a prueba sin|solo (por )?comision|pago en especie', 'rojo', 'El trabajo no tiene pago en dinero.'),
  ('altura', 'amarillo', 'Incluye trabajo en alturas: revisar seguridad y acompañamiento.'),
  ('carga pesada|cargar (bultos|peso|cajas)', 'amarillo', 'Incluye cargar peso: revisar seguridad y descansos.'),
  ('de pie|turnos? de (12|doce)', 'amarillo', 'Incluye jornadas largas de pie o turnos largos: revisar descansos.'),
  ('nocturn|\mnoche\M', 'amarillo', 'Incluye trabajo de noche: revisar horario y transporte.'),
  ('fines? de semana|\mdomingos?\M|\mfestivos?\M', 'amarillo', 'Incluye fines de semana o festivos: revisar descansos.');

create function public.param_digno(p text) returns numeric
language sql stable security definer set search_path = public as $$
  select valor from parametros_trabajo_digno where clave = p
$$;
revoke execute on function public.param_digno(text) from public, anon;

create function public.texto_normalizado(t text) returns text
language sql immutable set search_path = public as $$
  select translate(lower(coalesce(t, '')), 'áéíóúüñ', 'aeiouun')
$$;

-- Pago por hora equivalente. Null cuando no se puede calcular (unidad sin horas).
create function public.pago_por_hora(valor numeric, unidad text, horas int) returns numeric
language sql stable security definer set search_path = public as $$
  select case
    when valor is null or unidad is null then null
    when unidad in ('hora', 'conversacion') then valor
    when horas is null or horas = 0 then null
    when unidad = 'mes' then valor / (horas * 30.0 / 7)
    when unidad = 'proyecto' then valor / (horas * public.param_digno('semanas_proyecto'))
    else null
  end
$$;

create function public.minimo_por_hora() returns numeric
language sql stable security definer set search_path = public as $$
  select public.param_digno('salario_minimo_mensual') / (public.param_digno('jornada_maxima_semana') * 30.0 / 7)
$$;

-- Reportes de trato o pago de personas que trabajaron con la organización.
create function public.organizacion_con_reportes(empresa uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from wellbeing_checkins w join connections c on c.id = w.connection_id
    where c.company_id = empresa and (w.trato_respetuoso = false or w.pago_a_tiempo = false)
  )
$$;

-- El semáforo de un texto, un pago y una jornada. Devuelve el color y los motivos.
create function public.evaluar_trabajo(
  texto text, valor numeric, unidad text, horas int, empresa uuid,
  out color text, out motivos text[]
)
language plpgsql stable security definer set search_path = public as $$
declare
  limpio text := public.texto_normalizado(texto);
  hora numeric := public.pago_por_hora(valor, unidad, horas);
  minimo numeric := public.minimo_por_hora();
  regla record;
  rojo boolean := false;
  amarillo boolean := false;
begin
  motivos := '{}';
  for regla in select patron, reglas_texto_digno.color as c, motivo from reglas_texto_digno where activa loop
    if limpio ~ regla.patron then
      motivos := motivos || regla.motivo;
      if regla.c = 'rojo' then rojo := true; else amarillo := true; end if;
    end if;
  end loop;

  if horas is not null and horas > public.param_digno('jornada_maxima_semana') then
    rojo := true;
    motivos := motivos || format('La jornada (%s horas) supera el máximo legal de %s horas a la semana.', horas, public.param_digno('jornada_maxima_semana'));
  elsif horas is not null and horas > public.param_digno('jornada_alerta_semana') then
    amarillo := true;
    motivos := motivos || format('La jornada (%s horas) es larga: revisar descansos.', horas);
  end if;

  if hora is not null and hora < minimo then
    -- En un proyecto la duración real no se conoce: no se devuelve, se revisa.
    if unidad = 'proyecto' then
      amarillo := true;
      motivos := array_append(motivos, 'El pago del proyecto parece bajo para la jornada: revisar la duración.'::text);
    else
      rojo := true;
      motivos := motivos || format('El pago por hora (%s) queda por debajo del mínimo legal (%s).', round(hora), round(minimo));
    end if;
  elsif hora is not null and hora < minimo * public.param_digno('margen_pago_alerta') then
    amarillo := true;
    motivos := array_append(motivos, 'El pago por hora queda muy cerca del mínimo legal.'::text);
  end if;

  if empresa is not null and public.organizacion_con_reportes(empresa) then
    amarillo := true;
    motivos := array_append(motivos, 'Hay reportes de trato o pago de personas que trabajaron con esta organización.'::text);
  end if;

  color := case when rojo then 'rojo' when amarillo then 'amarillo' else 'verde' end;
end $$;
revoke execute on function public.evaluar_trabajo(text, numeric, text, int, uuid) from public, anon;

-- ── Retos ────────────────────────────────────────────────────────────────────────────────────
alter table needs
  add column semaforo text check (semaforo in ('verde', 'amarillo', 'rojo')),
  add column semaforo_motivos text[] not null default '{}',
  add column semaforo_en timestamptz,
  add column semaforo_reglas int,
  add column dignidad_automatica boolean not null default false,
  add column en_muestra boolean not null default false;

-- Igual que antes, más: la aprobación automática no tiene persona, y nadie de fuera la escribe.
create or replace function public.proteger_revision_reto() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.es_equipo() then
    if new.dignidad_estado <> 'pendiente' or new.dignidad_por is not null or new.dignidad_en is not null
       or new.dignidad_automatica or new.semaforo is not null or new.en_muestra then
      raise exception 'solo Kánna autoriza las condiciones del reto' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'UPDATE' and (new.company_id, new.problema, new.jornada_horas, new.remuneracion, new.remuneracion_unidad,
      new.condiciones, new.formatos, new.modalidad, new.ubicacion) is distinct from
     (old.company_id, old.problema, old.jornada_horas, old.remuneracion, old.remuneracion_unidad,
      old.condiciones, old.formatos, old.modalidad, old.ubicacion) then
    new.revision_version := old.revision_version + 1;
    new.dignidad_estado := 'pendiente'; new.dignidad_por := null; new.dignidad_en := null;
    new.dignidad_automatica := false; new.en_muestra := false;
  end if;
  if new.dignidad_estado = 'aprobado' and (new.jornada_horas is null or new.remuneracion is null
     or new.remuneracion_unidad is null or new.condiciones is null or new.dignidad_en is null
     or (new.dignidad_por is null and not new.dignidad_automatica)) then
    raise exception 'faltan las condiciones y la revisión del reto' using errcode = '22023';
  end if;
  return new;
end $$;

-- Corre después de revision_reto (los disparadores van en orden alfabético).
create function public.semaforo_reto() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r record;
  texto text;
  faltan text[] := '{}';
begin
  if new.dignidad_estado <> 'pendiente' or (tg_op = 'UPDATE' and new.revision_version = old.revision_version
     and old.semaforo is not null) then
    return new;
  end if;
  texto := coalesce(new.problema, '') || ' ' || coalesce(new.condiciones, '');
  select * into r from public.evaluar_trabajo(texto, new.remuneracion, new.remuneracion_unidad, new.jornada_horas, new.company_id);

  if new.jornada_horas is null or new.remuneracion is null or new.remuneracion_unidad is null or new.condiciones is null then
    faltan := array_append(faltan, 'Faltan la jornada, el pago o las condiciones.'::text);
  else
    if public.texto_normalizado(new.condiciones) !~ '(descans|pausa)' then
      faltan := array_append(faltan, 'No dice cuándo descansa la persona.'::text);
    end if;
    if public.texto_normalizado(new.condiciones) !~ '(acompan|responsable|apoyo|lider|jefe|coordin|supervis)' then
      faltan := array_append(faltan, 'No dice quién acompaña a la persona.'::text);
    end if;
  end if;
  if not exists (select 1 from needs n where n.company_id = new.company_id and n.id <> new.id and n.dignidad_estado = 'aprobado') then
    faltan := array_append(faltan, 'Es el primer reto de esta organización: lo revisa una persona.'::text);
  end if;

  new.semaforo_motivos := r.motivos || faltan;
  new.semaforo := case when r.color = 'rojo' then 'rojo' when r.color = 'amarillo' or cardinality(faltan) > 0 then 'amarillo' else 'verde' end;
  new.semaforo_en := now();
  new.semaforo_reglas := public.param_digno('version_reglas')::int;

  if new.semaforo = 'verde' then
    new.dignidad_estado := 'aprobado'; new.dignidad_automatica := true; new.dignidad_en := now(); new.dignidad_por := null;
    -- La muestra se decide por el id y la versión: es estable y reproducible, no al azar en cada lectura.
    new.en_muestra := ((hashtext(new.id::text || new.revision_version::text)::bigint % 100) + 100) % 100
      < public.param_digno('muestreo_verdes_pct');
  elsif new.semaforo = 'rojo' then
    new.dignidad_estado := 'ajustes'; new.dignidad_automatica := true; new.dignidad_en := now(); new.dignidad_por := null;
  end if;
  return new;
end $$;
create trigger semaforo_reto before insert or update on needs
  for each row execute function public.semaforo_reto();
revoke execute on function public.semaforo_reto() from public, anon, authenticated;

-- Lo que decide una persona del equipo deja de contar como automático.
create or replace function public.autorizar_reto(reto uuid, aprobado boolean, version bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_equipo() then raise exception 'sin permiso' using errcode = '42501'; end if;
  update needs set dignidad_estado = case when aprobado then 'aprobado' else 'ajustes' end,
    dignidad_por = auth.uid(), dignidad_en = now(), dignidad_automatica = false, en_muestra = false
  where id = reto and revision_version = version;
  if not found then raise exception 'el reto cambió: vuelve a revisarlo' using errcode = '22023'; end if;
end $$;

-- La muestra de control: el equipo confirma que una aprobación automática estuvo bien.
create function public.revisar_muestra(reto uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_equipo() then raise exception 'sin permiso' using errcode = '42501'; end if;
  update needs set en_muestra = false where id = reto and en_muestra;
  if not found then raise exception 'el reto ya no está en la muestra' using errcode = '22023'; end if;
end $$;
revoke execute on function public.revisar_muestra(uuid) from public, anon;
grant execute on function public.revisar_muestra(uuid) to authenticated;

-- Reevalúa los retos que esperaban revisión (incluidos los que la migración 2 dejó pendientes).
-- (Como todavía no tienen semáforo, el disparador los evalúa al tocarlos.)
update needs set semaforo_en = now() where dignidad_estado = 'pendiente' and semaforo is null;

-- ── Acuerdos ─────────────────────────────────────────────────────────────────────────────────
alter table connections
  add column acuerdo_semaforo text check (acuerdo_semaforo in ('verde', 'amarillo', 'rojo')),
  add column acuerdo_semaforo_motivos text[] not null default '{}',
  add column acuerdo_revision_automatica boolean not null default false;

create or replace function public.exigir_acuerdo_revisado() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.acuerdo_version, new.acuerdo_forma, new.acuerdo_horas_semana, new.acuerdo_valor,
      new.acuerdo_unidad, new.acuerdo_inicio, new.acuerdo_nota) is distinct from
     (old.acuerdo_version, old.acuerdo_forma, old.acuerdo_horas_semana, old.acuerdo_valor,
      old.acuerdo_unidad, old.acuerdo_inicio, old.acuerdo_nota) then
    new.acuerdo_revisado_version := null; new.acuerdo_revisado_por := null; new.acuerdo_revisado_en := null;
    new.acuerdo_revision_automatica := false; new.acuerdo_semaforo := null;
  end if;
  if new.estado::text = 'en_curso' and (tg_op = 'INSERT' or old.estado::text <> 'en_curso') then
    if new.acuerdo_revisado_version is distinct from new.acuerdo_version or new.acuerdo_revisado_en is null
       or (new.acuerdo_revisado_por is null and not new.acuerdo_revision_automatica) then
      raise exception 'Kánna debe revisar las condiciones antes de empezar' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

-- Corre después de conexion_revision_acuerdo, que borra la revisión cuando el acuerdo cambia.
create function public.semaforo_acuerdo() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r record;
  reto public.needs;
  hora numeric;
  hora_reto numeric;
  margen numeric := public.param_digno('margen_acuerdo');
  extra text[] := '{}';
begin
  if new.estado::text <> 'acuerdo' or new.acuerdo_revisado_version is not null or new.acuerdo_semaforo is not null then
    return new;
  end if;
  select * into r from public.evaluar_trabajo(new.acuerdo_nota, new.acuerdo_valor, new.acuerdo_unidad,
    new.acuerdo_horas_semana, new.company_id);
  hora := public.pago_por_hora(new.acuerdo_valor, new.acuerdo_unidad, new.acuerdo_horas_semana);

  if new.acuerdo_horas_semana is null and new.acuerdo_unidad not in ('conversacion') then
    extra := array_append(extra, 'Las horas a la semana no están definidas.'::text);
  end if;
  if hora is null and new.acuerdo_unidad not in ('conversacion') then
    extra := array_append(extra, 'No se puede calcular el pago por hora de este acuerdo.'::text);
  end if;
  if new.need_id is not null then
    select * into reto from needs where id = new.need_id;
    hora_reto := public.pago_por_hora(reto.remuneracion, reto.remuneracion_unidad, reto.jornada_horas);
    if reto.dignidad_estado is distinct from 'aprobado' then
      extra := array_append(extra, 'El reto de origen no tiene las condiciones aprobadas.'::text);
    end if;
    if hora is not null and hora_reto is not null and hora < hora_reto * (1 - margen) then
      extra := array_append(extra, 'El pago quedó por debajo del que se aprobó en el reto.'::text);
    end if;
    if new.acuerdo_horas_semana is not null and reto.jornada_horas is not null
       and new.acuerdo_horas_semana > reto.jornada_horas * (1 + margen) then
      extra := array_append(extra, 'La jornada quedó por encima de la que se aprobó en el reto.'::text);
    end if;
  end if;

  new.acuerdo_semaforo_motivos := r.motivos || extra;
  new.acuerdo_semaforo := case when r.color = 'rojo' then 'rojo' when r.color = 'amarillo' or cardinality(extra) > 0 then 'amarillo' else 'verde' end;
  if new.acuerdo_semaforo = 'verde' then
    new.acuerdo_revisado_version := new.acuerdo_version; new.acuerdo_revisado_en := now();
    new.acuerdo_revisado_por := null; new.acuerdo_revision_automatica := true;
  end if;
  return new;
end $$;
create trigger conexion_semaforo_acuerdo before update on connections
  for each row execute function public.semaforo_acuerdo();
revoke execute on function public.semaforo_acuerdo() from public, anon, authenticated;

create or replace function public.autorizar_acuerdo(conexion uuid, version int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_equipo() then raise exception 'sin permiso' using errcode = '42501'; end if;
  update connections set acuerdo_revisado_version = acuerdo_version, acuerdo_revisado_por = auth.uid(),
    acuerdo_revisado_en = now(), acuerdo_revision_automatica = false
  where id = conexion and estado::text = 'acuerdo' and acuerdo_version = version;
  if not found then raise exception 'el acuerdo cambió: vuelve a revisarlo' using errcode = '22023'; end if;
end $$;

-- Si el acuerdo se aprueba solo al proponerlo, el aviso de la propuesta basta: un solo SMS.
create or replace function public.avisar_acuerdo_autorizado() returns trigger
language plpgsql security definer set search_path = public as $$
declare usuario uuid;
begin
  if new.estado::text = 'acuerdo' and new.acuerdo_revisado_en is not null and not new.acuerdo_revision_automatica
     and new.acuerdo_revisado_version = new.acuerdo_version
     and (old.acuerdo_revisado_en is null or old.acuerdo_revisado_version is distinct from new.acuerdo_revisado_version) then
    select user_id into usuario from talent_profiles where id = new.talent_id;
    insert into notifications (user_id, talent_id, canal, plantilla, connection_id, estado, motivo_omitido)
    values (usuario, new.talent_id, 'sms', 'acuerdo_autorizado', new.id,
      case when usuario is null then 'omitido' else 'pendiente' end,
      case when usuario is null then 'La persona no tiene cuenta propia: llamarla.' end);
  end if;
  return new;
end $$;
