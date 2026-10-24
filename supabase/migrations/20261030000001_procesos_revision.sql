-- Revisión de procesos (hallazgos de la revisión de código del 30 oct 2026):
--   1. actuar_conexion(…, 'cerrar') dejaba terminar y calificar desde «abierta» o «conversación»,
--      sin acuerdo aceptado, y creaba una evidencia verificada. Se retira: terminar solo pasa por
--      avanzar_proceso(), desde «en curso».
--   2. La persona aceptaba el acuerdo vigente, no el que vio: si la organización lo cambiaba con
--      la pantalla abierta, el botón aceptaba el nuevo. Ahora cada propuesta de acuerdo y cada fecha
--      tienen una versión; aceptar, ajustar, confirmar o pedir otra fecha exige la versión vista.
--   3. El valor admitía «NaN» e «Infinity». Ahora debe ser un número finito y positivo, también
--      en la tabla.

alter table connections
  add column acuerdo_version int not null default 0,
  add column conversacion_version int not null default 0,
  add constraint acuerdo_valor_finito check (acuerdo_valor is null or (acuerdo_valor > 0 and acuerdo_valor < 1000000000000));

create or replace function public.avanzar_proceso(conexion uuid, accion text, datos jsonb default '{}'::jsonb)
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
  valor text;
  vista int;
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

  -- La persona responde a la versión que vio. Si cambió mientras tenía la pantalla abierta, que
  -- la revise de nuevo.
  if lado = 'talento' and accion in ('confirmar_fecha', 'otra_fecha', 'aceptar_acuerdo', 'ajustar_acuerdo') then
    vista := case when (datos->>'version') ~ '^\d{1,9}$' then (datos->>'version')::int end;
    if accion in ('confirmar_fecha', 'otra_fecha') and vista is distinct from c.conversacion_version then
      raise exception 'la fecha cambió: revísala de nuevo' using errcode = '40001';
    end if;
    if accion in ('aceptar_acuerdo', 'ajustar_acuerdo') and vista is distinct from c.acuerdo_version then
      raise exception 'el acuerdo cambió: revísalo de nuevo' using errcode = '40001';
    end if;
  end if;

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
           conversacion_confirmada = false, conversacion_version = c.conversacion_version + 1
     where id = c.id;

  elsif accion = 'confirmar_fecha' and lado = 'talento' and etapa = 'conversacion' then
    update public.connections set conversacion_confirmada = true where id = c.id;

  elsif accion = 'otra_fecha' and lado = 'talento' and etapa = 'conversacion' then
    update public.connections
       set estado = 'abierta', conversacion_en = null, conversacion_modo = null, conversacion_confirmada = false,
           conversacion_version = c.conversacion_version + 1
     where id = c.id;
    select user_id into usuario from public.talent_profiles where id = c.talent_id;
    insert into public.help_requests (user_id, canal, motivo)
    values (coalesce(usuario, auth.uid()), 'proceso', 'La persona pide otra fecha para la conversación.');

  elsif accion = 'proponer_acuerdo' and lado = 'empresa' and etapa in ('conversacion', 'acuerdo') then
    if (datos->>'forma') is null then
      raise exception 'elige cómo van a trabajar' using errcode = '22023';
    end if;
    -- Solo cifras (con decimales opcionales): sin «NaN», «Infinity», signos ni notación científica.
    valor := datos->>'valor';
    if valor is null or valor !~ '^\d{1,12}(\.\d{1,2})?$' or valor::numeric <= 0
       or valor::numeric >= 1000000000000 or (datos->>'unidad') is null then
      raise exception 'el acuerdo necesita un valor: el trabajo se paga' using errcode = '22023';
    end if;
    if (datos->>'inicio') is not null and (datos->>'inicio')::date < current_date then
      raise exception 'la fecha de inicio no puede ser pasada' using errcode = '22023';
    end if;
    update public.connections
       set estado = 'acuerdo',
           acuerdo_forma = (datos->>'forma')::tipo_oferta,
           acuerdo_horas_semana = (datos->>'horas')::int,
           acuerdo_valor = valor::numeric,
           acuerdo_unidad = datos->>'unidad',
           acuerdo_inicio = (datos->>'inicio')::date,
           acuerdo_nota = nullif(left(datos->>'nota', 300), ''),
           acuerdo_aceptado_en = null,
           acuerdo_version = c.acuerdo_version + 1
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

-- Los primeros pasos (me interesa, no me interesa, quiero conocer). Sin «cerrar»: terminar y
-- calificar pasan por avanzar_proceso(), que exige el acuerdo aceptado.
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

-- Las vistas suman la versión al final (create or replace solo deja agregar columnas al final).
create or replace view company_connections_view with (security_barrier) as
select
  c.id, c.talent_id, c.need_id, c.origen, c.creado_en, c.actualizado_en,
  case
    when c.estado::text = 'enviada_talento' then 'esperando'
    when c.estado::text = 'descarta' then 'no_disponible'
    when public.sin_respuesta(c.estado::text, c.actualizado_en) then 'sin_respuesta'
    when c.estado::text = 'visible_empresa' then 'le_interesa'
    else c.estado::text
  end as estado,
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
  case when c.cerrada_por = 'empresa' then c.motivo_cierre end as motivo_cierre,
  c.acuerdo_version, c.conversacion_version
from connections c
where c.company_id = public.mi_empresa()
  and c.estado::text not in ('propuesta', 'elegida')
  and not (c.origen = 'problema' and c.estado::text in ('enviada_talento', 'descarta'));

create or replace view talent_opportunities_view with (security_barrier) as
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
  case when c.cerrada_por = 'empresa' then c.motivo_cierre end as motivo_cierre,
  c.acuerdo_version, c.conversacion_version
from connections c
join companies co on co.id = c.company_id
left join needs n on n.id = c.need_id
where public.es_mi_perfil(c.talent_id)
  and c.estado::text not in ('propuesta', 'elegida');
