-- Hito 2: roles, acceso por fila y vista anónima para empresas.
--
-- Principios (CLAUDE.md):
--   · La edad nunca llega a una empresa: talent_private no tiene NINGUNA política; se escribe y se
--     lee solo con funciones, y cada lectura del equipo queda registrada.
--   · Las empresas no leen tablas de talento: solo company_talent_view.
--   · Curador, gestor y admin los asigna un admin; desde el registro solo se llega a talento o empresa.

-- ── Funciones de apoyo ──────────────────────────────────────────────────────
-- security definer: las políticas pueden consultar user_roles y talent_profiles sin recursión.

create function public.mi_rol() returns rol
language sql stable security definer set search_path = public as $$
  select rol from public.user_roles where user_id = auth.uid()
$$;

create function public.es_equipo() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('curador', 'admin'), false)
$$;

-- El perfil es "mío" si soy la persona, o el gestor que lo registró mientras ella no tenga cuenta.
create function public.es_mi_perfil(perfil uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.talent_profiles p
    where p.id = perfil
      and (p.user_id = auth.uid() or (p.registrado_por = auth.uid() and p.user_id is null))
  )
$$;

-- ── Rol inicial al registrarse ──────────────────────────────────────────────

create function public.asignar_rol_inicial() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, rol)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'rol' = 'empresa' then 'empresa'::rol else 'talento'::rol end
  );
  return new;
end
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.asignar_rol_inicial();

-- ── user_roles ──────────────────────────────────────────────────────────────

create policy rol_propio on user_roles for select
  using (user_id = auth.uid() or public.es_equipo());

create policy roles_solo_admin on user_roles for all
  using (public.mi_rol() = 'admin')
  with check (public.mi_rol() = 'admin');

-- ── talent_profiles ─────────────────────────────────────────────────────────

-- En esta tabla se comparan las columnas directamente (no con es_mi_perfil): una función estable
-- no ve la fila recién insertada y el insert ... returning fallaría.
create policy perfil_ver on talent_profiles for select
  using (
    user_id = auth.uid()
    or (registrado_por = auth.uid() and user_id is null)
    or public.es_equipo()
  );

create policy perfil_crear on talent_profiles for insert
  with check (
    (user_id = auth.uid() and registrado_por is null and public.mi_rol() = 'talento')
    or (user_id is null and registrado_por = auth.uid() and public.mi_rol() = 'gestor')
    or public.es_equipo()
  );

create policy perfil_editar on talent_profiles for update
  using (
    user_id = auth.uid()
    or (registrado_por = auth.uid() and user_id is null)
    or public.es_equipo()
  )
  with check (
    user_id = auth.uid()
    or (registrado_por = auth.uid() and user_id is null)
    or public.es_equipo()
  );

-- Borrar los propios datos desde /mi-perfil (Ley 1581).
create policy perfil_borrar on talent_profiles for delete
  using (user_id = auth.uid() or public.es_equipo());

-- ── Datos privados: solo por funciones ─────────────────────────────────────

revoke all on talent_private from anon, authenticated;

create table private_access_log (
  id bigint generated always as identity primary key,
  talent_id uuid not null references talent_profiles on delete cascade,
  visto_por uuid not null references auth.users,
  motivo text not null,
  visto_en timestamptz not null default now()
);
alter table private_access_log enable row level security;
revoke all on private_access_log from anon, authenticated;

-- La persona (o su gestor) guarda fecha de nacimiento y autorización. No puede leerlas de vuelta
-- por la API: no hace falta, y así la tabla no tiene ningún camino de lectura fuera del equipo.
create function public.guardar_datos_privados(
  perfil uuid,
  fecha_nacimiento date,
  autorizacion_version text,
  autorizacion_medio text,
  pension text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.es_mi_perfil(perfil) or public.es_equipo()) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  insert into public.talent_private as t
    (talent_id, fecha_nacimiento, autorizacion_fecha, autorizacion_version, autorizacion_medio, pension)
  values (perfil, fecha_nacimiento, now(), autorizacion_version, autorizacion_medio, pension)
  on conflict (talent_id) do update set
    fecha_nacimiento = coalesce(excluded.fecha_nacimiento, t.fecha_nacimiento),
    autorizacion_fecha = excluded.autorizacion_fecha,
    autorizacion_version = excluded.autorizacion_version,
    autorizacion_medio = excluded.autorizacion_medio,
    pension = coalesce(excluded.pension, t.pension);
end
$$;

-- Solo curador y admin, y siempre con un motivo que queda registrado.
create function public.ver_datos_privados(perfil uuid, motivo text)
returns setof talent_private
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_equipo() then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if coalesce(trim(motivo), '') = '' then
    raise exception 'motivo obligatorio' using errcode = '22023';
  end if;
  insert into public.private_access_log (talent_id, visto_por, motivo) values (perfil, auth.uid(), motivo);
  return query select * from public.talent_private where talent_id = perfil;
end
$$;

revoke execute on function public.guardar_datos_privados(uuid, date, text, text, text) from public, anon;
revoke execute on function public.ver_datos_privados(uuid, text) from public, anon;
grant execute on function public.guardar_datos_privados(uuid, date, text, text, text) to authenticated;
grant execute on function public.ver_datos_privados(uuid, text) to authenticated;

-- ── Tablas hijas del perfil ─────────────────────────────────────────────────

create policy ofertas_propias on talent_offers for all
  using (public.es_mi_perfil(talent_id) or public.es_equipo())
  with check (public.es_mi_perfil(talent_id) or public.es_equipo());

create policy historias_propias on stories for all
  using (public.es_mi_perfil(talent_id) or public.es_equipo())
  with check (public.es_mi_perfil(talent_id) or public.es_equipo());

create policy huella_propia on footprint_tags for all
  using (public.es_mi_perfil(talent_id) or public.es_equipo())
  with check (public.es_mi_perfil(talent_id) or public.es_equipo());

create policy taxonomia_equipo on taxonomy for all
  using (public.es_equipo())
  with check (public.es_equipo());

-- ── Empresas ────────────────────────────────────────────────────────────────
-- La verificación (regla 9) la marca solo el equipo: una empresa no puede verificarse a sí misma.

alter table companies
  add column verificada_en timestamptz,
  add column verificada_por uuid references auth.users,
  add column verificada_fuente text;

create function public.proteger_verificacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_equipo() and (
    new.verificada_en is distinct from old.verificada_en
    or new.verificada_por is distinct from old.verificada_por
    or new.verificada_fuente is distinct from old.verificada_fuente
  ) then
    raise exception 'solo el equipo verifica empresas' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger verificacion_solo_equipo
  before update on companies
  for each row execute function public.proteger_verificacion();

create policy empresa_ver on companies for select
  using (owner_id = auth.uid() or public.es_equipo());

create policy empresa_crear on companies for insert
  with check (
    owner_id = auth.uid() and public.mi_rol() = 'empresa'
    and verificada_en is null and verificada_por is null and verificada_fuente is null
  );

create policy empresa_editar on companies for update
  using (owner_id = auth.uid() or public.es_equipo())
  with check (owner_id = auth.uid() or public.es_equipo());

-- ── Vista anónima para empresas ─────────────────────────────────────────────
-- Corre con los permisos de su dueño (salta RLS a propósito) y filtra ella misma:
-- solo perfiles publicados, solo para empresa y equipo, y sin ningún dato de talent_private.
-- Nombre, foto y resumen solo si la persona eligió "visible". La revelación para perfiles
-- reservados se agrega en el hito 4, atada a connections.estado = 'abierta'.

create view company_talent_view with (security_barrier) as
select
  p.id,
  p.visibilidad,
  case when p.visibilidad = 'visible' then p.nombre end as nombre,
  case when p.visibilidad = 'visible' then p.foto_path end as foto_path,
  case when p.visibilidad = 'visible' then p.resumen end as resumen,
  p.ubicacion,
  coalesce(
    (select jsonb_agg(jsonb_build_object('capa', t.capa, 'etiqueta', t.etiqueta) order by t.capa, t.etiqueta)
       from footprint_tags t where t.talent_id = p.id and t.confirmada),
    '[]'::jsonb
  ) as huella,
  coalesce(
    (select jsonb_agg(jsonb_build_object('tipo', o.tipo, 'horas_semana', o.horas_semana, 'modalidad', o.modalidad))
       from talent_offers o where o.talent_id = p.id),
    '[]'::jsonb
  ) as ofertas
from talent_profiles p
where p.estado = 'publicado'
  and public.mi_rol() in ('empresa', 'curador', 'admin');

revoke all on company_talent_view from anon, authenticated;
grant select on company_talent_view to authenticated;

-- ── Límite de códigos: 5 por hora por número o correo ──────────────────────
-- Se guarda un hash, no el número. Lo llama el servidor de Next con la llave pública.

create table otp_attempts (
  id bigint generated always as identity primary key,
  destino_hash text not null,
  creado_en timestamptz not null default now()
);
create index on otp_attempts (destino_hash, creado_en);
alter table otp_attempts enable row level security;
revoke all on otp_attempts from anon, authenticated;

create function public.registrar_intento_codigo(destino_hash text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  recientes int;
begin
  if length(destino_hash) <> 64 then
    raise exception 'hash inválido' using errcode = '22023';
  end if;
  delete from public.otp_attempts where creado_en < now() - interval '1 day';
  select count(*) into recientes from public.otp_attempts a
    where a.destino_hash = registrar_intento_codigo.destino_hash
      and a.creado_en > now() - interval '1 hour';
  if recientes >= 5 then
    return false;
  end if;
  insert into public.otp_attempts (destino_hash) values (registrar_intento_codigo.destino_hash);
  return true;
end
$$;

revoke execute on function public.registrar_intento_codigo(text) from public;
grant execute on function public.registrar_intento_codigo(text) to anon, authenticated;
