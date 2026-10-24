-- Procesos (decisión del 29 oct 2026). Después de abrir una conexión el proceso sigue y las dos
-- partes ven en qué va:
--   abierta      → conversación por agendar (en el piloto, el equipo los pone en contacto)
--   conversacion → la organización puso fecha; la persona la confirma o pide otra
--   acuerdo      → la organización propone cómo trabajar; la persona acepta o pide ajustar
--   en_curso     → están trabajando
--   cerrada      → «terminado» (cada parte califica) o «no sigue» (con un motivo)
--
-- Reglas:
--   · Cada paso pasa por avanzar_proceso(), que revisa quién lo pide y desde qué etapa.
--   · Ningún acuerdo sin pago: el valor es obligatorio (brandbook: nunca trabajo no remunerado).
--   · Nadie queda sin respuesta: si la organización no responde a un «Me interesa» en 14 días,
--     las vistas lo muestran como «sin respuesta» y ya no se puede abrir.
--   · El nombre y la foto se revelan solo si la conexión llegó a abrirse (abierta_en), no por
--     cerrarse: una organización que dice «no sigue» antes de abrir no ve a la persona.
--   · La persona no ve el motivo de su propio cierre en la vista de la organización: si ella
--     decide no seguir, la organización solo ve que no sigue.

alter table connections
  add column abierta_en timestamptz,
  add column conversacion_en timestamptz,
  add column conversacion_modo text check (conversacion_modo in ('llamada', 'videollamada', 'presencial')),
  add column conversacion_confirmada boolean not null default false,
  add column acuerdo_forma tipo_oferta,
  add column acuerdo_horas_semana int check (acuerdo_horas_semana between 1 and 60),
  add column acuerdo_valor numeric check (acuerdo_valor > 0),
  add column acuerdo_unidad text check (acuerdo_unidad in ('hora', 'conversacion', 'mes', 'proyecto', 'persona')),
  add column acuerdo_inicio date,
  add column acuerdo_nota text check (length(acuerdo_nota) <= 300),
  add column acuerdo_aceptado_en timestamptz,
  add column cierre_tipo text check (cierre_tipo in ('terminado', 'no_sigue')),
  add column cerrada_por text check (cerrada_por in ('empresa', 'talento', 'equipo')),
  add column motivo_cierre text check (length(motivo_cierre) <= 200);

-- Lo que ya estaba abierto o cerrado se abrió alguna vez y se cerró trabajando.
update connections set abierta_en = actualizado_en where estado::text in ('abierta', 'cerrada');
update connections set cierre_tipo = 'terminado' where estado::text = 'cerrada';

-- Marca cuándo se abrió, venga de donde venga el cambio (función o equipo).
create function public.marcar_apertura() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.estado::text = 'abierta' and new.abierta_en is null then
    new.abierta_en := now();
  end if;
  return new;
end
$$;

create trigger conexion_apertura
  before insert or update on connections
  for each row execute function public.marcar_apertura();

revoke execute on function public.marcar_apertura() from public, anon, authenticated;

-- Un «Me interesa» que la organización no respondió en 14 días ya no se puede abrir.
create function public.sin_respuesta(estado text, desde timestamptz) returns boolean
language sql stable set search_path = public as $$
  select estado = 'visible_empresa' and desde < now() - interval '14 days'
$$;

alter table help_requests drop constraint help_requests_canal_check;
alter table help_requests add constraint help_requests_canal_check check (canal in (
  'chat', 'llamada', 'boton', 'seguimiento_aviso', 'orientacion_tarifa', 'borrar_cuenta',
  'conexion_abierta', 'asesoria_emprende', 'proceso'));

-- ── Pasos del proceso ───────────────────────────────────────────────────────

create function public.avanzar_proceso(conexion uuid, accion text, datos jsonb default '{}'::jsonb)
returns text
language plpgsql security definer set search_path = public as $$
declare
  c public.connections;
  lado text;
  etapa text;
  fecha timestamptz;
  nota int;
  motivo text;
  usuario uuid;
begin
  select * into c from public.connections where id = conexion for update;
  if not found then raise exception 'conexión no encontrada' using errcode = '22023'; end if;
  etapa := c.estado::text;
  if etapa in ('propuesta', 'elegida') then raise exception 'acción no permitida' using errcode = '42501'; end if;
  lado := case
    when c.company_id = public.mi_empresa() then 'empresa'
    when public.es_mi_perfil(c.talent_id) then 'talento'
  end;
  if lado is null then raise exception 'acción no permitida' using errcode = '42501'; end if;
  datos := coalesce(datos, '{}'::jsonb);

  if accion = 'agendar' and lado = 'empresa' and etapa in ('abierta', 'conversacion') then
    fecha := (datos->>'fecha')::timestamptz;
    if fecha is null or fecha <= now() then
      raise exception 'la fecha de la conversación debe ser futura' using errcode = '22023';
    end if;
    if coalesce(datos->>'modo', '') not in ('llamada', 'videollamada', 'presencial') then
      raise exception 'modo de conversación no válido' using errcode = '22023';
    end if;
    update public.connections
       set estado = 'conversacion', conversacion_en = fecha, conversacion_modo = datos->>'modo',
           conversacion_confirmada = false
     where id = c.id;

  elsif accion = 'confirmar_fecha' and lado = 'talento' and etapa = 'conversacion' then
    update public.connections set conversacion_confirmada = true where id = c.id;

  elsif accion = 'otra_fecha' and lado = 'talento' and etapa = 'conversacion' then
    update public.connections
       set estado = 'abierta', conversacion_en = null, conversacion_modo = null, conversacion_confirmada = false
     where id = c.id;
    select user_id into usuario from public.talent_profiles where id = c.talent_id;
    insert into public.help_requests (user_id, canal, motivo)
    values (coalesce(usuario, auth.uid()), 'proceso', 'La persona pide otra fecha para la conversación.');

  elsif accion = 'proponer_acuerdo' and lado = 'empresa' and etapa in ('conversacion', 'acuerdo') then
    if (datos->>'forma') is null then
      raise exception 'elige cómo van a trabajar' using errcode = '22023';
    end if;
    if (datos->>'valor') is null or (datos->>'valor')::numeric <= 0 or (datos->>'unidad') is null then
      raise exception 'el acuerdo necesita un valor: el trabajo se paga' using errcode = '22023';
    end if;
    if (datos->>'inicio') is not null and (datos->>'inicio')::date < current_date then
      raise exception 'la fecha de inicio no puede ser pasada' using errcode = '22023';
    end if;
    update public.connections
       set estado = 'acuerdo',
           acuerdo_forma = (datos->>'forma')::tipo_oferta,
           acuerdo_horas_semana = (datos->>'horas')::int,
           acuerdo_valor = (datos->>'valor')::numeric,
           acuerdo_unidad = datos->>'unidad',
           acuerdo_inicio = (datos->>'inicio')::date,
           acuerdo_nota = nullif(left(datos->>'nota', 300), ''),
           acuerdo_aceptado_en = null
     where id = c.id;

  elsif accion = 'aceptar_acuerdo' and lado = 'talento' and etapa = 'acuerdo' then
    update public.connections set estado = 'en_curso', acuerdo_aceptado_en = now() where id = c.id;

  elsif accion = 'ajustar_acuerdo' and lado = 'talento' and etapa = 'acuerdo' then
    update public.connections set estado = 'conversacion' where id = c.id;
    select user_id into usuario from public.talent_profiles where id = c.talent_id;
    insert into public.help_requests (user_id, canal, motivo)
    values (coalesce(usuario, auth.uid()), 'proceso', 'La persona quiere ajustar el acuerdo antes de aceptarlo.');

  elsif accion in ('terminar', 'calificar') then
    nota := (datos->>'evaluacion')::int;
    if nota is null or nota not between 1 and 5 then
      raise exception 'evaluación de 1 a 5 obligatoria' using errcode = '22023';
    end if;
    if accion = 'terminar' and etapa = 'en_curso' then
      update public.connections set estado = 'cerrada', cierre_tipo = 'terminado', cerrada_por = lado where id = c.id;
    elsif not (accion = 'calificar' and etapa = 'cerrada' and c.cierre_tipo = 'terminado'
               and (case lado when 'empresa' then c.evaluacion_empresa else c.evaluacion_talento end) is null) then
      raise exception 'acción no permitida' using errcode = '42501';
    end if;
    if lado = 'empresa' then
      update public.connections set evaluacion_empresa = nota where id = c.id;
      -- La evaluación de la empresa es evidencia de confiabilidad (A3).
      insert into public.evidence (talent_id, tipo, descripcion, estado, autorizada_empresas)
      values (c.talent_id, 'evaluacion', 'Evaluación de una empresa: ' || nota || ' de 5', 'verificada', true);
    else
      update public.connections set evaluacion_talento = nota where id = c.id;
    end if;

  elsif accion = 'no_seguir' and (
      (lado = 'talento' and etapa in ('abierta', 'conversacion', 'acuerdo', 'en_curso'))
      or (lado = 'empresa' and etapa in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso'))
    ) then
    if public.sin_respuesta(etapa, c.actualizado_en) then
      raise exception 'sin respuesta a tiempo' using errcode = '42501';
    end if;
    motivo := btrim(coalesce(datos->>'motivo', ''));
    if length(motivo) not between 3 and 200 then
      raise exception 'cuéntanos el motivo en pocas palabras' using errcode = '22023';
    end if;
    update public.connections
       set estado = 'cerrada', cierre_tipo = 'no_sigue', cerrada_por = lado, motivo_cierre = motivo
     where id = c.id;

  else
    raise exception 'acción no permitida' using errcode = '42501';
  end if;

  select estado::text into etapa from public.connections where id = c.id;
  return etapa;
end
$$;

revoke execute on function public.avanzar_proceso(uuid, text, jsonb) from public, anon;
grant execute on function public.avanzar_proceso(uuid, text, jsonb) to authenticated;

-- Los primeros pasos siguen en actuar_conexion(). Cambia que un «Me interesa» vencido ya no se
-- abre, y que «cerrar» (terminar con calificación) vale desde cualquier etapa abierta.
create or replace function public.actuar_conexion(conexion uuid, accion text, evaluacion int default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  c public.connections;
  soy_talento boolean;
  soy_empresa boolean;
  usuario uuid;
begin
  select * into c from public.connections where id = conexion for update;
  if not found then raise exception 'conexión no encontrada' using errcode = '22023'; end if;

  soy_talento := public.es_mi_perfil(c.talent_id) and c.estado::text not in ('propuesta', 'elegida');
  soy_empresa := c.company_id = public.mi_empresa();

  if accion = 'me_interesa' and soy_talento and c.estado::text = 'enviada_talento' then
    -- Si la empresa ya lo pidió (Explorar), hay doble aceptación: se abre.
    update public.connections
       set estado = (case when c.origen = 'exploracion' then 'abierta' else 'visible_empresa' end)::estado_conexion
     where id = c.id;
  elsif accion = 'no_me_interesa' and soy_talento and c.estado::text = 'enviada_talento' then
    update public.connections set estado = 'descarta' where id = c.id;
  elsif accion = 'quiero_conocer' and soy_empresa and c.estado::text = 'visible_empresa' then
    if public.sin_respuesta(c.estado::text, c.actualizado_en) then
      raise exception 'sin respuesta a tiempo' using errcode = '42501';
    end if;
    update public.connections set estado = 'abierta' where id = c.id;
  elsif accion = 'cerrar' and (soy_empresa or soy_talento) and c.estado::text in ('abierta', 'conversacion', 'en_curso') then
    if evaluacion is null or evaluacion not between 1 and 5 then
      raise exception 'evaluación de 1 a 5 obligatoria' using errcode = '22023';
    end if;
    if soy_empresa then
      update public.connections
         set estado = 'cerrada', cierre_tipo = 'terminado', cerrada_por = 'empresa', evaluacion_empresa = evaluacion
       where id = c.id;
      insert into public.evidence (talent_id, tipo, descripcion, estado, autorizada_empresas)
      values (c.talent_id, 'evaluacion', 'Evaluación de una empresa: ' || evaluacion || ' de 5', 'verificada', true);
    else
      update public.connections
         set estado = 'cerrada', cierre_tipo = 'terminado', cerrada_por = 'talento', evaluacion_talento = evaluacion
       where id = c.id;
    end if;
  else
    raise exception 'acción no permitida' using errcode = '42501';
  end if;

  select estado::text into accion from public.connections where id = c.id;
  if accion = 'abierta' then
    -- En el piloto, el equipo pone en contacto a las partes: no se entrega el celular.
    select user_id into usuario from public.talent_profiles where id = c.talent_id;
    insert into public.help_requests (user_id, canal, motivo)
    values (coalesce(usuario, auth.uid()), 'conexion_abierta',
            'Conexión abierta: poner en contacto a la empresa con la persona.');
  end if;
  return accion;
end
$$;

-- ── Avisos a la persona en cada paso que la necesita ────────────────────────

create or replace function public.encolar_aviso() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  destinatario uuid;
  plantilla text;
begin
  plantilla := case
    when new.estado::text = 'enviada_talento'
         and (tg_op = 'INSERT' or old.estado::text <> 'enviada_talento') then 'oportunidad_nueva'
    when tg_op = 'INSERT' then null
    when new.estado::text = 'conversacion'
         and (old.estado::text <> 'conversacion' or new.conversacion_en is distinct from old.conversacion_en)
         and new.conversacion_en is not null then 'conversacion_agendada'
    when new.estado::text = 'acuerdo'
         and (old.estado::text <> 'acuerdo' or new.acuerdo_valor is distinct from old.acuerdo_valor
              or new.acuerdo_forma is distinct from old.acuerdo_forma
              or new.acuerdo_horas_semana is distinct from old.acuerdo_horas_semana
              or new.acuerdo_inicio is distinct from old.acuerdo_inicio) then 'acuerdo_propuesto'
    when new.estado::text = 'cerrada' and old.estado::text <> 'cerrada' and new.cerrada_por = 'empresa'
         and new.cierre_tipo = 'no_sigue' then 'proceso_cerrado'
  end;
  if plantilla is not null then
    select user_id into destinatario from public.talent_profiles where id = new.talent_id;
    insert into public.notifications (user_id, talent_id, canal, plantilla, connection_id, estado, motivo_omitido)
    values (destinatario, new.talent_id, 'sms', plantilla, new.id,
            case when destinatario is null then 'omitido' else 'pendiente' end,
            case when destinatario is null then 'La persona no tiene cuenta propia: llamarla.' end);
  end if;
  return new;
end
$$;

-- ── Vistas ──────────────────────────────────────────────────────────────────

-- Igual que antes; cambia solo qué revela el nombre: haber llegado a abrirse.
create or replace view company_talent_view with (security_barrier) as
with revelado as (
  select distinct talent_id from public.connections
  where company_id = public.mi_empresa() and abierta_en is not null and estado::text <> 'pausada'
)
select
  p.id,
  p.visibilidad,
  (p.visibilidad = 'visible' or r.talent_id is not null) as identidad_visible,
  case when p.visibilidad = 'visible' or r.talent_id is not null then p.nombre end as nombre,
  case when p.visibilidad = 'visible' or r.talent_id is not null then p.foto_path end as foto_path,
  case when p.visibilidad = 'visible' or r.talent_id is not null then p.resumen end as resumen,
  p.oficio,
  p.ubicacion,
  coalesce(
    (select jsonb_agg(jsonb_build_object('capa', t.capa, 'etiqueta', t.etiqueta) order by t.capa, t.etiqueta)
       from footprint_tags t
      where t.talent_id = p.id and t.confirmada and (t.taxonomy_id is not null or t.aprobada_en is not null)),
    '[]'::jsonb
  ) as huella,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
        'tipo', o.tipo, 'horas_semana', o.horas_semana, 'modalidad', o.modalidad,
        -- Rango alrededor de la tarifa, redondeado a miles: la empresa nunca ve el número exacto.
        'rango_min', case when o.tarifa_esperada > 0 then floor(o.tarifa_esperada * 0.85 / 1000) * 1000 end,
        'rango_max', case when o.tarifa_esperada > 0 then ceil(o.tarifa_esperada * 1.15 / 1000) * 1000 end))
       from talent_offers o where o.talent_id = p.id),
    '[]'::jsonb
  ) as ofertas,
  (select count(*) from evidence e where e.talent_id = p.id and e.estado = 'verificada' and e.autorizada_empresas) as evidencias
from talent_profiles p
left join revelado r on r.talent_id = p.id
where p.estado = 'publicado'
  and public.mi_rol() in ('empresa', 'curador', 'admin');

revoke all on company_talent_view from anon, authenticated;
grant select on company_talent_view to authenticated;

drop view company_connections_view;
create view company_connections_view with (security_barrier) as
select
  c.id, c.talent_id, c.need_id, c.origen, c.creado_en, c.actualizado_en,
  case
    when c.estado::text = 'enviada_talento' then 'esperando'
    when c.estado::text = 'descarta' then 'no_disponible'
    when public.sin_respuesta(c.estado::text, c.actualizado_en) then 'sin_respuesta'
    when c.estado::text = 'visible_empresa' then 'le_interesa'
    else c.estado::text
  end as estado,
  -- Días que la persona lleva esperando la respuesta de la organización.
  case when c.estado::text = 'visible_empresa'
    then (now()::date - c.actualizado_en::date) end as dias_esperando,
  case when c.estado::text in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso', 'cerrada')
    then c.puntaje end as puntaje,
  case when c.estado::text in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso', 'cerrada')
    then c.desglose end as desglose,
  case when c.estado::text in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso', 'cerrada')
    then c.razon_curador end as razon_curador,
  c.evaluacion_empresa,
  c.conversacion_en, c.conversacion_modo, c.conversacion_confirmada,
  c.acuerdo_forma, c.acuerdo_horas_semana, c.acuerdo_valor, c.acuerdo_unidad, c.acuerdo_inicio, c.acuerdo_nota,
  c.acuerdo_aceptado_en,
  c.cierre_tipo, c.cerrada_por,
  case when c.cerrada_por = 'empresa' then c.motivo_cierre end as motivo_cierre
from connections c
where c.company_id = public.mi_empresa()
  and c.estado::text not in ('propuesta', 'elegida')
  and not (c.origen = 'problema' and c.estado::text in ('enviada_talento', 'descarta'));

revoke all on company_connections_view from anon, authenticated;
grant select on company_connections_view to authenticated;

drop view talent_opportunities_view;
create view talent_opportunities_view with (security_barrier) as
select
  c.id, c.origen,
  case when public.sin_respuesta(c.estado::text, c.actualizado_en) then 'sin_respuesta' else c.estado::text end as estado,
  c.creado_en, c.actualizado_en, c.evaluacion_talento,
  co.nombre as empresa, co.sector, co.ciudad,
  (co.verificada_en is not null) as empresa_verificada,
  n.problema, n.formatos, n.modalidad,
  c.conversacion_en, c.conversacion_modo, c.conversacion_confirmada,
  c.acuerdo_forma, c.acuerdo_horas_semana, c.acuerdo_valor, c.acuerdo_unidad, c.acuerdo_inicio, c.acuerdo_nota,
  c.acuerdo_aceptado_en,
  c.cierre_tipo, c.cerrada_por,
  case when c.cerrada_por = 'empresa' then c.motivo_cierre end as motivo_cierre
from connections c
join companies co on co.id = c.company_id
left join needs n on n.id = c.need_id
where public.es_mi_perfil(c.talent_id)
  and c.estado::text not in ('propuesta', 'elegida');

revoke all on talent_opportunities_view from anon, authenticated;
grant select on talent_opportunities_view to authenticated;
