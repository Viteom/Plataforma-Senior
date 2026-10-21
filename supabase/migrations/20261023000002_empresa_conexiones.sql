-- Hito 4: empresas, necesidades (buscar por un problema), conexiones, puntaje, reportes y avisos.
--
-- Principios:
--   · Regla 9: una conexión nunca pasa a "enviada_talento" si la empresa no está verificada y
--     activa. Lo garantiza un trigger, venga de donde venga el cambio.
--   · Empresa y talento no actualizan conexiones directamente: cada paso pasa por una función que
--     revisa quién lo pide y desde qué estado.
--   · La empresa ve conexiones por vista: nunca las propuestas internas del curador ni el puntaje
--     antes del "Me interesa".

-- ── Empresas ────────────────────────────────────────────────────────────────

alter table companies
  add column estado text not null default 'activa' check (estado in ('activa', 'pausada')),
  add constraint una_empresa_por_cuenta unique (owner_id);

create function public.mi_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.companies where owner_id = auth.uid()
$$;

-- La empresa no se verifica ni se reactiva a sí misma (amplía el trigger del hito 2).
create or replace function public.proteger_verificacion() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.es_equipo() and (
    new.verificada_en is distinct from old.verificada_en
    or new.verificada_por is distinct from old.verificada_por
    or new.verificada_fuente is distinct from old.verificada_fuente
    or new.estado is distinct from old.estado
  ) then
    raise exception 'solo el equipo verifica empresas' using errcode = '42501';
  end if;
  return new;
end
$$;

create policy empresa_crear_activa on companies as restrictive for insert
  with check (estado = 'activa' or public.es_equipo());

-- ── Necesidades: "buscar por un problema" ───────────────────────────────────

create table needs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies on delete cascade,
  problema text not null check (length(problema) between 20 and 3000),
  formatos tipo_oferta[] not null default '{}',
  modalidad text check (modalidad in ('presencial', 'remoto', 'mixto')),
  ubicacion text,
  presupuesto numeric check (presupuesto >= 0),
  estado text not null default 'en_curaduria'
    check (estado in ('en_curaduria', 'enviada', 'cerrada')),
  creado_en timestamptz not null default now()
);
create index on needs (company_id);
alter table needs enable row level security;

create policy necesidad_ver on needs for select
  using (company_id = public.mi_empresa() or public.es_equipo());
create policy necesidad_crear on needs for insert
  with check (company_id = public.mi_empresa() and estado = 'en_curaduria');
create policy necesidad_equipo on needs for update
  using (public.es_equipo()) with check (public.es_equipo());

create table need_requirements (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references needs on delete cascade,
  capa capa_huella not null,
  etiqueta text not null,
  taxonomy_id uuid references taxonomy,
  obligatorio boolean not null default false
);
create index on need_requirements (need_id);
alter table need_requirements enable row level security;

create policy requisito_ver on need_requirements for select
  using (public.es_equipo() or exists (
    select 1 from public.needs n where n.id = need_id and n.company_id = public.mi_empresa()));
create policy requisito_crear on need_requirements for insert
  with check (public.es_equipo() or exists (
    select 1 from public.needs n where n.id = need_id and n.company_id = public.mi_empresa()
      and n.estado = 'en_curaduria'));

-- ── Pesos del puntaje v1 (brief, "Matching versión 1") ──────────────────────

create table matching_weights (
  componente text primary key,
  peso numeric not null check (peso >= 0 and peso <= 1)
);
alter table matching_weights enable row level security;
create policy pesos_ver on matching_weights for select using (public.es_equipo());
create policy pesos_admin on matching_weights for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

insert into matching_weights (componente, peso) values
  ('situaciones', 0.30),
  ('oficio_normas', 0.15),
  ('contexto_escala', 0.15),
  ('formato', 0.15),
  ('evidencia', 0.10),
  ('ubicacion', 0.05),
  ('economica', 0.05),
  ('proposito', 0.05);

-- ── Conexiones ──────────────────────────────────────────────────────────────

create table connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies on delete cascade,
  talent_id uuid not null references talent_profiles on delete cascade,
  need_id uuid references needs on delete cascade,
  origen text not null check (origen in ('exploracion', 'problema')),
  estado estado_conexion not null default 'propuesta',
  puntaje numeric,
  desglose jsonb,
  razon_curador text check (length(razon_curador) <= 200),
  -- Solo para el equipo: qué coincidió y qué obligatorio faltó. No está en la vista de empresas.
  detalle_curador jsonb,
  evaluacion_empresa int check (evaluacion_empresa between 1 and 5),
  evaluacion_talento int check (evaluacion_talento between 1 and 5),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  check (origen <> 'problema' or need_id is not null)
);
create index on connections (company_id);
create index on connections (talent_id);
create index on connections (need_id);
-- Una sola conexión viva por empresa y persona en cada búsqueda.
create unique index una_conexion_viva on connections (company_id, talent_id, coalesce(need_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where estado not in ('descarta', 'cerrada');
alter table connections enable row level security;

-- Solo el equipo lee y escribe la tabla. Empresa y talento usan vistas y funciones.
create policy conexiones_equipo on connections for all
  using (public.es_equipo()) with check (public.es_equipo());

create function public.regla_empresa_verificada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.actualizado_en := now();
  if new.estado::text = 'enviada_talento'
     and (tg_op = 'INSERT' or old.estado::text <> 'enviada_talento') then
    if not exists (
      select 1 from public.companies c
      where c.id = new.company_id and c.verificada_en is not null and c.estado = 'activa'
    ) then
      raise exception 'empresa sin verificar o pausada: no puede llegar al talento' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

create trigger conexion_regla_9
  before insert or update on connections
  for each row execute function public.regla_empresa_verificada();

-- ── Avisos al talento (A1): cola, sin envío mientras no haya proveedor de SMS ──

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  talent_id uuid not null references talent_profiles on delete cascade,
  canal text not null check (canal in ('sms', 'correo')),
  plantilla text not null,
  connection_id uuid references connections on delete set null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'fallido', 'omitido')),
  motivo_omitido text,
  creado_en timestamptz not null default now(),
  enviado_en timestamptz
);
create index on notifications (estado, creado_en);
alter table notifications enable row level security;
create policy avisos_equipo on notifications for all
  using (public.es_equipo()) with check (public.es_equipo());

-- Al llegar una oportunidad, se encola el aviso. Sin cuenta (registrada por un gestor) no hay a
-- quién enviar: queda "omitido" para que el equipo llame.
create function public.encolar_aviso() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  destinatario uuid;
begin
  if new.estado::text = 'enviada_talento'
     and (tg_op = 'INSERT' or old.estado::text <> 'enviada_talento') then
    select user_id into destinatario from public.talent_profiles where id = new.talent_id;
    insert into public.notifications (user_id, talent_id, canal, plantilla, connection_id, estado, motivo_omitido)
    values (destinatario, new.talent_id, 'sms', 'oportunidad_nueva', new.id,
            case when destinatario is null then 'omitido' else 'pendiente' end,
            case when destinatario is null then 'La persona no tiene cuenta propia: llamarla.' end);
  end if;
  return new;
end
$$;

create trigger conexion_aviso
  after insert or update on connections
  for each row execute function public.encolar_aviso();

-- ── Ayuda: nuevos motivos ───────────────────────────────────────────────────

alter table help_requests drop constraint help_requests_canal_check;
alter table help_requests add constraint help_requests_canal_check check (canal in (
  'chat', 'llamada', 'boton', 'seguimiento_aviso', 'orientacion_tarifa', 'borrar_cuenta', 'conexion_abierta'));

-- ── Acciones sobre una conexión ─────────────────────────────────────────────

-- La empresa pide conocer un perfil desde Explorar. Va directo a la persona (regla 9 en el trigger).
create function public.pedir_conexion(talento uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  empresa uuid := public.mi_empresa();
  nueva uuid;
begin
  if empresa is null or public.mi_rol() <> 'empresa' then
    raise exception 'solo una empresa registrada puede pedir conexiones' using errcode = '42501';
  end if;
  if not exists (select 1 from public.talent_profiles p where p.id = talento and p.estado = 'publicado') then
    raise exception 'perfil no disponible' using errcode = '22023';
  end if;
  insert into public.connections (company_id, talent_id, origen, estado)
  values (empresa, talento, 'exploracion', 'enviada_talento')
  returning id into nueva;
  return nueva;
end
$$;

-- Pasos de la persona y de la empresa. El equipo cura con acceso directo a la tabla.
create function public.actuar_conexion(conexion uuid, accion text, evaluacion int default null)
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
    update public.connections set estado = 'abierta' where id = c.id;
  elsif accion = 'cerrar' and (soy_empresa or soy_talento) and c.estado::text = 'abierta' then
    if evaluacion is null or evaluacion not between 1 and 5 then
      raise exception 'evaluación de 1 a 5 obligatoria' using errcode = '22023';
    end if;
    if soy_empresa then
      update public.connections set estado = 'cerrada', evaluacion_empresa = evaluacion where id = c.id;
      -- La evaluación de la empresa es evidencia de confiabilidad (A3).
      insert into public.evidence (talent_id, tipo, descripcion, estado, autorizada_empresas)
      values (c.talent_id, 'evaluacion', 'Evaluación de una empresa: ' || evaluacion || ' de 5', 'verificada', true);
    else
      update public.connections set estado = 'cerrada', evaluacion_talento = evaluacion where id = c.id;
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

-- ── Reportes de empresas (A2) ───────────────────────────────────────────────

create table company_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies on delete cascade,
  connection_id uuid references connections on delete set null,
  reportado_por uuid not null references auth.users,
  motivo text not null check (length(motivo) between 3 and 1000),
  estado text not null default 'abierto' check (estado in ('abierto', 'confirmado', 'descartado')),
  resuelto_por uuid references auth.users,
  creado_en timestamptz not null default now()
);
alter table company_reports enable row level security;
create policy reporte_ver on company_reports for select
  using (reportado_por = auth.uid() or public.es_equipo());
create policy reporte_equipo on company_reports for update
  using (public.es_equipo()) with check (public.es_equipo());

-- La persona reporta desde una oportunidad: se pausan sus conexiones con esa empresa.
create function public.reportar_empresa(conexion uuid, motivo text) returns void
language plpgsql security definer set search_path = public as $$
declare
  c public.connections;
begin
  select * into c from public.connections where id = conexion;
  if not found or not public.es_mi_perfil(c.talent_id) or c.estado::text in ('propuesta', 'elegida') then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  insert into public.company_reports (company_id, connection_id, reportado_por, motivo)
  values (c.company_id, c.id, auth.uid(), motivo);
  update public.connections set estado = 'pausada'
   where company_id = c.company_id and talent_id = c.talent_id and estado::text not in ('cerrada', 'descarta');
end
$$;

-- Dos reportes confirmados pausan a la empresa para todo el talento.
create function public.pausar_empresa_reportada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'confirmado' and old.estado <> 'confirmado' and (
    select count(*) from public.company_reports where company_id = new.company_id and estado = 'confirmado'
  ) >= 2 then
    update public.companies set estado = 'pausada' where id = new.company_id;
    update public.connections set estado = 'pausada'
     where company_id = new.company_id and estado::text not in ('cerrada', 'descarta', 'propuesta', 'elegida');
  end if;
  return new;
end
$$;

create trigger reporte_confirmado
  after update on company_reports
  for each row execute function public.pausar_empresa_reportada();

revoke execute on function public.pedir_conexion(uuid) from public, anon;
revoke execute on function public.actuar_conexion(uuid, text, int) from public, anon;
revoke execute on function public.reportar_empresa(uuid, text) from public, anon;
grant execute on function public.pedir_conexion(uuid) to authenticated;
grant execute on function public.actuar_conexion(uuid, text, int) to authenticated;
grant execute on function public.reportar_empresa(uuid, text) to authenticated;

-- ── Vistas ──────────────────────────────────────────────────────────────────

-- Perfiles para empresas: igual que en el hito 2, más el oficio, el rango de tarifa (nunca el
-- número exacto) y la revelación de nombre y foto cuando hay una conexión abierta o cerrada.
drop view company_talent_view;

create view company_talent_view with (security_barrier) as
with revelado as (
  select distinct talent_id from public.connections
  where company_id = public.mi_empresa() and estado::text in ('abierta', 'cerrada')
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
       from footprint_tags t where t.talent_id = p.id and t.confirmada),
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

-- Conexiones de mi empresa. Sin propuestas internas; el puntaje y la razón del curador solo
-- después del "Me interesa"; un "no" en una búsqueda por problema no se muestra.
create view company_connections_view with (security_barrier) as
select
  c.id, c.talent_id, c.need_id, c.origen, c.creado_en, c.actualizado_en,
  case c.estado::text
    when 'enviada_talento' then 'esperando'
    when 'descarta' then 'no_disponible'
    when 'visible_empresa' then 'le_interesa'
    else c.estado::text
  end as estado,
  case when c.estado::text in ('visible_empresa', 'abierta', 'cerrada') then c.puntaje end as puntaje,
  case when c.estado::text in ('visible_empresa', 'abierta', 'cerrada') then c.desglose end as desglose,
  case when c.estado::text in ('visible_empresa', 'abierta', 'cerrada') then c.razon_curador end as razon_curador,
  c.evaluacion_empresa
from connections c
where c.company_id = public.mi_empresa()
  and c.estado::text not in ('propuesta', 'elegida')
  and not (c.origen = 'problema' and c.estado::text in ('enviada_talento', 'descarta'));

revoke all on company_connections_view from anon, authenticated;
grant select on company_connections_view to authenticated;

-- Oportunidades de la persona: con el nombre de la empresa y si está verificada.
create view talent_opportunities_view with (security_barrier) as
select
  c.id, c.origen, c.estado::text as estado, c.creado_en, c.actualizado_en, c.evaluacion_talento,
  co.nombre as empresa, co.sector, co.ciudad,
  (co.verificada_en is not null) as empresa_verificada,
  n.problema, n.formatos, n.modalidad
from connections c
join companies co on co.id = c.company_id
left join needs n on n.id = c.need_id
where public.es_mi_perfil(c.talent_id)
  and c.estado::text not in ('propuesta', 'elegida');

revoke all on talent_opportunities_view from anon, authenticated;
grant select on talent_opportunities_view to authenticated;
