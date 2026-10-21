-- Hito 3: perfil, formas de contratar, guía de tarifas, evidencias, solicitudes de ayuda
-- y uso de IA. Sigue los principios de la migración de acceso (hito 2).

-- ── Perfil ──────────────────────────────────────────────────────────────────

alter type tipo_oferta add value if not exists 'conversacion' before 'horas';

alter table talent_profiles add column oficio text;

alter table talent_offers
  add column quiere_orientacion boolean not null default false,
  add constraint una_oferta_por_tipo unique (talent_id, tipo);

-- "Tengo 45 años o más" es un dato de edad: va a talent_private, nunca a talent_profiles.
alter table talent_private
  add column requisito_entrada text check (requisito_entrada in ('edad', 'experiencia'));

drop function public.guardar_datos_privados(uuid, date, text, text, text);

create function public.guardar_datos_privados(
  perfil uuid,
  fecha_nacimiento date,
  autorizacion_version text,
  autorizacion_medio text,
  pension text default null,
  requisito_entrada text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.es_mi_perfil(perfil) or public.es_equipo()) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  insert into public.talent_private as t
    (talent_id, fecha_nacimiento, autorizacion_fecha, autorizacion_version, autorizacion_medio, pension, requisito_entrada)
  values (perfil, fecha_nacimiento, now(), autorizacion_version, autorizacion_medio, pension, requisito_entrada)
  on conflict (talent_id) do update set
    fecha_nacimiento = coalesce(excluded.fecha_nacimiento, t.fecha_nacimiento),
    autorizacion_fecha = excluded.autorizacion_fecha,
    autorizacion_version = excluded.autorizacion_version,
    autorizacion_medio = excluded.autorizacion_medio,
    pension = coalesce(excluded.pension, t.pension),
    requisito_entrada = coalesce(excluded.requisito_entrada, t.requisito_entrada);
end
$$;

revoke execute on function public.guardar_datos_privados(uuid, date, text, text, text, text) from public, anon;
grant execute on function public.guardar_datos_privados(uuid, date, text, text, text, text) to authenticated;

-- ── Guía de tarifas (A5) ────────────────────────────────────────────────────
-- Vacía a propósito: los rangos los define el equipo antes del piloto.

create table rate_guides (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_oferta not null unique,
  unidad text not null check (unidad in ('hora', 'conversacion', 'mes', 'proyecto', 'persona')),
  minimo numeric not null check (minimo >= 0),
  maximo numeric not null check (maximo >= minimo),
  fuente text not null,
  revisado_en date not null default current_date
);
alter table rate_guides enable row level security;

create policy guia_publica on rate_guides for select using (true);
create policy guia_equipo on rate_guides for all
  using (public.es_equipo()) with check (public.es_equipo());

-- ── Solicitudes de ayuda (las usa "Prefiero que el equipo me oriente") ──────

create table help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  canal text not null check (canal in ('chat', 'llamada', 'boton', 'seguimiento_aviso', 'orientacion_tarifa', 'borrar_cuenta')),
  motivo text not null,
  estado text not null default 'abierta' check (estado in ('abierta', 'en_curso', 'cerrada')),
  atendido_por uuid references auth.users,
  creado_en timestamptz not null default now()
);
alter table help_requests enable row level security;

create policy ayuda_crear on help_requests for insert
  with check (user_id = auth.uid() and estado = 'abierta' and atendido_por is null);
create policy ayuda_ver on help_requests for select
  using (user_id = auth.uid() or public.es_equipo());
create policy ayuda_atender on help_requests for update
  using (public.es_equipo()) with check (public.es_equipo());

-- ── Evidencias (A3) ─────────────────────────────────────────────────────────
-- La persona (o su gestor) las agrega; solo el equipo las verifica. Una empresa ve solo las
-- verificadas y autorizadas, por vista, y nunca el nombre ni el teléfono de una referencia.

create table evidence (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  tipo text not null check (tipo in ('referencia', 'archivo', 'evaluacion')),
  descripcion text,
  referencia_nombre text,
  referencia_telefono text,
  archivo_path text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'verificada', 'rechazada')),
  nota_equipo text,
  verificada_por uuid references auth.users,
  autorizada_empresas boolean not null default true,
  creado_en timestamptz not null default now(),
  check (tipo <> 'referencia' or (referencia_nombre is not null and referencia_telefono is not null)),
  check (tipo <> 'archivo' or archivo_path is not null)
);
create index on evidence (talent_id);
alter table evidence enable row level security;

create policy evidencia_ver on evidence for select
  using (public.es_mi_perfil(talent_id) or public.es_equipo());

-- Las evaluaciones salen de conexiones cerradas (hito 4): la persona no las crea.
create policy evidencia_crear on evidence for insert
  with check (
    (public.es_mi_perfil(talent_id) and tipo in ('referencia', 'archivo')
      and estado = 'pendiente' and verificada_por is null and nota_equipo is null)
    or public.es_equipo()
  );

create policy evidencia_editar on evidence for update
  using (public.es_mi_perfil(talent_id) or public.es_equipo())
  with check (public.es_mi_perfil(talent_id) or public.es_equipo());

create policy evidencia_borrar on evidence for delete
  using (public.es_mi_perfil(talent_id) or public.es_equipo());

-- security invoker a propósito: current_user es el rol real. Solo se frena a los roles de la API
-- (anon, authenticated) que no son del equipo; la consola y la llave de servicio sí pueden.
create function public.proteger_verificacion_evidencia() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.es_equipo() and (
    new.estado is distinct from old.estado
    or new.verificada_por is distinct from old.verificada_por
    or new.nota_equipo is distinct from old.nota_equipo
    or new.tipo is distinct from old.tipo
  ) then
    raise exception 'solo el equipo verifica evidencias' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger evidencia_solo_equipo
  before update on evidence
  for each row execute function public.proteger_verificacion_evidencia();

create view company_evidence_view with (security_barrier) as
select e.id, e.talent_id, e.tipo, e.descripcion, e.nota_equipo,
       case when e.tipo = 'archivo' then e.archivo_path end as archivo_path
from evidence e
join talent_profiles p on p.id = e.talent_id
where e.estado = 'verificada'
  and e.autorizada_empresas
  and p.estado = 'publicado'
  and public.mi_rol() in ('empresa', 'curador', 'admin');

revoke all on company_evidence_view from anon, authenticated;
grant select on company_evidence_view to authenticated;

-- ── Uso de IA: cuota y registro (docs/ia-desde-moai.md, sección 4) ─────────
-- Sin texto enviado ni respuesta: solo el uso. Se escribe únicamente con estas funciones.

create table ia_topes (
  tarea text primary key check (tarea in ('huella', 'problema', 'chat')),
  por_persona int not null check (por_persona >= 0),
  global int not null check (global >= 0)
);
alter table ia_topes enable row level security;
create policy topes_equipo on ia_topes for all
  using (public.es_equipo()) with check (public.es_equipo());

insert into ia_topes (tarea, por_persona, global) values
  ('huella', 10, 500),
  ('problema', 20, 300),
  ('chat', 80, 3000);

create table ia_usos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tarea text not null references ia_topes (tarea),
  modelo text not null,
  creado_en timestamptz not null default now(),
  terminado_en timestamptz,
  resultado text not null default 'pendiente'
    check (resultado in ('pendiente', 'correcto', 'error', 'rechazado'))
);
create index on ia_usos (tarea, creado_en);
create index on ia_usos (user_id, tarea, creado_en);
alter table ia_usos enable row level security;
revoke all on ia_usos from anon, authenticated;

-- Devuelve el id del uso reservado, o null si se superó la cuota por persona o la global.
create function public.reservar_uso_ia(tarea text, modelo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  tope public.ia_topes;
  propios int;
  todos int;
  nuevo uuid;
begin
  if auth.uid() is null then
    raise exception 'sin sesión' using errcode = '42501';
  end if;
  select * into tope from public.ia_topes t where t.tarea = reservar_uso_ia.tarea;
  if not found then
    raise exception 'tarea desconocida' using errcode = '22023';
  end if;

  -- Candado corto por tarea: dos pedidos simultáneos no pasan ambos el último cupo.
  perform pg_advisory_xact_lock(hashtext('ia-' || reservar_uso_ia.tarea));

  select count(*) filter (where u.user_id = auth.uid()), count(*)
    into propios, todos
    from public.ia_usos u
   where u.tarea = reservar_uso_ia.tarea and u.creado_en > now() - interval '24 hours';

  if propios >= tope.por_persona or todos >= tope.global then
    return null;
  end if;

  insert into public.ia_usos (user_id, tarea, modelo)
  values (auth.uid(), reservar_uso_ia.tarea, reservar_uso_ia.modelo)
  returning id into nuevo;
  return nuevo;
end
$$;

create function public.cerrar_uso_ia(uso uuid, resultado text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if resultado not in ('correcto', 'error', 'rechazado') then
    raise exception 'resultado inválido' using errcode = '22023';
  end if;
  update public.ia_usos u
     set resultado = cerrar_uso_ia.resultado, terminado_en = now()
   where u.id = uso and u.user_id = auth.uid() and u.resultado = 'pendiente';
end
$$;

revoke execute on function public.reservar_uso_ia(text, text) from public, anon;
revoke execute on function public.cerrar_uso_ia(uuid, text) from public, anon;
grant execute on function public.reservar_uso_ia(text, text) to authenticated;
grant execute on function public.cerrar_uso_ia(uuid, text) to authenticated;

-- Mismo ajuste para la verificación de empresas (hito 2): antes era security definer y también
-- bloqueaba a la consola y a la llave de servicio.
create or replace function public.proteger_verificacion() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.es_equipo() and (
    new.verificada_en is distinct from old.verificada_en
    or new.verificada_por is distinct from old.verificada_por
    or new.verificada_fuente is distinct from old.verificada_fuente
  ) then
    raise exception 'solo el equipo verifica empresas' using errcode = '42501';
  end if;
  return new;
end
$$;

-- ── Archivos de evidencia (Supabase Storage) ───────────────────────────────
-- Bucket privado. Ruta: <talent_id>/<archivo>. Se salta donde no existe el esquema storage
-- (las pruebas con PGlite).

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('evidencias', 'evidencias', false, 10485760,
            array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
    on conflict (id) do nothing;

    execute $p$
      create policy evidencias_subir on storage.objects for insert to authenticated
      with check (bucket_id = 'evidencias'
        and public.es_mi_perfil(((storage.foldername(name))[1])::uuid))
    $p$;
    execute $p$
      create policy evidencias_ver on storage.objects for select to authenticated
      using (bucket_id = 'evidencias'
        and (public.es_mi_perfil(((storage.foldername(name))[1])::uuid) or public.es_equipo()))
    $p$;
    execute $p$
      create policy evidencias_borrar on storage.objects for delete to authenticated
      using (bucket_id = 'evidencias'
        and public.es_mi_perfil(((storage.foldername(name))[1])::uuid))
    $p$;
  end if;
end
$$;
