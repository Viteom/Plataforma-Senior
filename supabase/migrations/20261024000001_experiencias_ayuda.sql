-- Hito 5: experiencias con saberes, impacto, ayuda (Llámeme sin cuenta), registro asistido del
-- gestor, Aprende y Emprende. Sin servicios de pago: lo que necesitaría SMS o correo queda en el
-- panel del equipo.

-- ── Experiencias con saberes ────────────────────────────────────────────────

create table experiences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,80}$'),
  talent_id uuid references talent_profiles on delete set null,
  -- Cómo aparece la sabedora: lo escribe el equipo con su aprobación, sin depender de la
  -- visibilidad de su perfil.
  sabedora_nombre text,
  sabedora_pueblo text,
  nombre text not null,
  proposito text not null,
  temas text[] not null default '{}',
  para_quien text,
  beneficios text[] not null default '{}',
  momentos jsonb not null default '[]'::jsonb, -- [{ "titulo": "...", "descripcion": "..." }]
  formatos text[] not null default '{territorio,sede}' check (formatos <@ array['territorio', 'sede']),
  lugar text,
  duracion text,
  grupo_min int check (grupo_min > 0),
  grupo_max int check (grupo_max >= grupo_min),
  precio_desde numeric check (precio_desde >= 0),
  porcentaje_sabedora numeric check (porcentaje_sabedora between 0 and 100),
  fotos text[] not null default '{}',
  testimonio text,
  estado text not null default 'borrador' check (estado in ('borrador', 'publicada', 'pausada')),
  aprobada_por_sabedora_en timestamptz,
  creado_en timestamptz not null default now(),
  -- Brief: se publica solo cuando la persona aprobó cómo aparece.
  check (estado <> 'publicada' or aprobada_por_sabedora_en is not null)
);
alter table experiences enable row level security;

create policy experiencia_publica on experiences for select
  using (estado = 'publicada' or public.es_equipo());
create policy experiencia_equipo on experiences for all
  using (public.es_equipo()) with check (public.es_equipo());

-- Primera experiencia del brief, como borrador hasta que el equipo complete los datos.
insert into experiences (slug, nombre, proposito, temas, para_quien, beneficios, formatos)
values (
  'ceremonia-del-cuidado',
  'Ceremonia del cuidado',
  'A través del tejido, encarna el cuidado y abre la conversación sobre cómo esa labor ha recaído históricamente en las mujeres y sobre la importancia de que quienes cuidan también sean cuidadas.',
  '{Cuidado,Tejido,"Bienestar de equipos"}',
  'Equipos de enfermería y cuidado',
  '{"Conversación sobre el cuidado de quienes cuidan","Un espacio de pausa para el equipo"}',
  '{territorio,sede}'
);

create table experience_requests (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experiences on delete cascade,
  company_id uuid not null references companies on delete cascade,
  formato text not null check (formato in ('territorio', 'sede')),
  personas int not null check (personas between 1 and 500),
  mes text not null,
  nota text check (length(nota) <= 1000),
  estado estado_solicitud not null default 'recibida',
  valor_cotizado numeric check (valor_cotizado >= 0),
  creado_en timestamptz not null default now()
);
create index on experience_requests (company_id);
alter table experience_requests enable row level security;

create policy solicitud_ver on experience_requests for select
  using (company_id = public.mi_empresa() or public.es_equipo());
create policy solicitud_crear on experience_requests for insert
  with check (company_id = public.mi_empresa() and estado = 'recibida' and valor_cotizado is null);
create policy solicitud_equipo on experience_requests for update
  using (public.es_equipo()) with check (public.es_equipo());

create table impact_records (
  id uuid primary key default gen_random_uuid(),
  experience_request_id uuid references experience_requests on delete cascade,
  connection_id uuid references connections on delete cascade,
  personas_impactadas int not null check (personas_impactadas >= 0),
  horas numeric not null check (horas >= 0),
  pago_persona numeric not null check (pago_persona >= 0),
  notas text,
  creado_en timestamptz not null default now(),
  check (experience_request_id is not null or connection_id is not null)
);
alter table impact_records enable row level security;

create policy impacto_equipo on impact_records for all
  using (public.es_equipo()) with check (public.es_equipo());
-- La empresa ve el reporte de sus propias solicitudes.
create policy impacto_empresa on impact_records for select
  using (exists (
    select 1 from public.experience_requests r
    where r.id = experience_request_id and r.company_id = public.mi_empresa()));

-- ── Ayuda: "Llámeme" también sin cuenta ─────────────────────────────────────
-- Quien no logra entrar es justo quien más necesita que le llamen.

alter table help_requests
  alter column user_id drop not null,
  add column telefono text,
  add column franja text check (franja in ('manana', 'tarde'));

alter table help_requests drop constraint help_requests_canal_check;
alter table help_requests add constraint help_requests_canal_check check (canal in (
  'chat', 'llamada', 'boton', 'seguimiento_aviso', 'orientacion_tarifa', 'borrar_cuenta',
  'conexion_abierta', 'asesoria_emprende'));

create function public.pedir_llamada(telefono text, franja text, motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  digitos text := regexp_replace(coalesce(telefono, ''), '\D', '', 'g');
begin
  if length(digitos) = 12 and left(digitos, 2) = '57' then digitos := substr(digitos, 3); end if;
  if digitos !~ '^3\d{9}$' then
    raise exception 'celular inválido' using errcode = '22023';
  end if;
  if franja not in ('manana', 'tarde') then
    raise exception 'franja inválida' using errcode = '22023';
  end if;
  -- Máximo 3 pedidos al día por número: evita abuso sin pedir cuenta.
  if (select count(*) from public.help_requests h
       where h.canal = 'llamada' and h.telefono = digitos and h.creado_en > now() - interval '1 day') >= 3 then
    raise exception 'ya pidió que le llamemos' using errcode = '22023';
  end if;
  insert into public.help_requests (user_id, canal, motivo, telefono, franja)
  values (auth.uid(), 'llamada', coalesce(nullif(trim(motivo), ''), 'Pidió que le llamemos.'), digitos, franja);
end
$$;

-- Sin cuenta solo se pide la llamada con la función; la tabla no se toca.
revoke all on help_requests from anon;

revoke execute on function public.pedir_llamada(text, text, text) from public;
grant execute on function public.pedir_llamada(text, text, text) to anon, authenticated;

-- ── Registro asistido del gestor ────────────────────────────────────────────

-- Historia grabada en campo: el audio queda guardado y el equipo la transcribe (sin IA de pago).
alter table stories add column audio_path text;

-- Celular de la persona (lo anota el gestor): solo equipo. Sirve para que, cuando ella entre con
-- su celular, reciba el perfil que se creó en su nombre.
alter table talent_private
  add column celular text check (celular ~ '^3\d{9}$'),
  add column autorizacion_archivo text; -- firma o audio de aceptación en Storage

create function public.guardar_registro_gestor(perfil uuid, celular text, autorizacion_medio text, autorizacion_archivo text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not ((public.es_mi_perfil(perfil) and public.mi_rol() = 'gestor') or public.es_equipo()) then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if autorizacion_medio not in ('firma', 'audio') then
    raise exception 'medio inválido' using errcode = '22023';
  end if;
  insert into public.talent_private as t (talent_id, celular, autorizacion_fecha, autorizacion_version, autorizacion_medio, autorizacion_archivo)
  values (perfil, nullif(celular, ''), now(), 'v0-borrador-2026-10', autorizacion_medio, autorizacion_archivo)
  on conflict (talent_id) do update set
    celular = coalesce(excluded.celular, t.celular),
    autorizacion_fecha = excluded.autorizacion_fecha,
    autorizacion_version = excluded.autorizacion_version,
    autorizacion_medio = excluded.autorizacion_medio,
    autorizacion_archivo = excluded.autorizacion_archivo;
end
$$;

-- Al entrar por primera vez, la persona recibe el perfil que un gestor creó con su celular.
create function public.reclamar_perfil() returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare
  mi_celular text;
  perfil uuid;
begin
  if auth.uid() is null or public.mi_rol() <> 'talento' then return null; end if;
  if exists (select 1 from public.talent_profiles where user_id = auth.uid()) then return null; end if;
  select regexp_replace(coalesce(phone, ''), '^57', '') into mi_celular from auth.users where id = auth.uid();
  if mi_celular is null or mi_celular !~ '^3\d{9}$' then return null; end if;
  select p.id into perfil
    from public.talent_profiles p join public.talent_private t on t.talent_id = p.id
   where p.user_id is null and t.celular = mi_celular
   order by p.created_at
   limit 1;
  if perfil is not null then
    update public.talent_profiles set user_id = auth.uid() where id = perfil;
  end if;
  return perfil;
end
$$;

revoke execute on function public.guardar_registro_gestor(uuid, text, text, text) from public, anon;
revoke execute on function public.reclamar_perfil() from public, anon;
grant execute on function public.guardar_registro_gestor(uuid, text, text, text) to authenticated;
grant execute on function public.reclamar_perfil() to authenticated;

-- ── Aprende: catálogo enlazado ──────────────────────────────────────────────

create table courses (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  entidad text not null,
  url text not null check (url ~ '^https://'),
  tema text not null check (tema in ('digital', 'cobrar', 'mentoria', 'negocio', 'oficio')),
  modalidad text check (modalidad in ('virtual', 'presencial', 'mixta')),
  gratuito boolean not null default true,
  descripcion text,
  publicado boolean not null default false,
  creado_en timestamptz not null default now()
);
alter table courses enable row level security;
create policy curso_publico on courses for select using (publicado or public.es_equipo());
create policy curso_equipo on courses for all using (public.es_equipo()) with check (public.es_equipo());

-- Punto de partida: la oferta del SENA. El equipo revisa y agrega cursos concretos.
insert into courses (titulo, entidad, url, tema, modalidad, descripcion, publicado) values
  ('Cursos cortos gratuitos del SENA', 'SENA (Sofía Plus)', 'https://oferta.senasofiaplus.edu.co/', 'digital', 'virtual',
   'Busque cursos de herramientas digitales, emprendimiento y oficios. Se inscribe con su documento.', true);

-- ── Emprende: diagnóstico ───────────────────────────────────────────────────

create table entrepreneurship_diagnostics (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  etapa text not null check (etapa in ('idea', 'vendiendo', 'creciendo')),
  necesidades text[] not null default '{}',
  quiere_asesoria boolean not null default false,
  creado_en timestamptz not null default now()
);
alter table entrepreneurship_diagnostics enable row level security;
create policy diagnostico_propio on entrepreneurship_diagnostics for all
  using (public.es_mi_perfil(talent_id) or public.es_equipo())
  with check (public.es_mi_perfil(talent_id) or public.es_equipo());

-- ── Archivos del registro asistido (Supabase Storage) ───────────────────────
-- Buckets privados. Ruta: <talent_id>/<archivo>. Se salta donde no existe storage (pruebas).

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
      ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
      ('autorizaciones', 'autorizaciones', false, 5242880, array['image/png', 'audio/webm', 'audio/ogg', 'audio/mp4']),
      ('historias', 'historias', false, 20971520, array['audio/webm', 'audio/ogg', 'audio/mp4'])
    on conflict (id) do nothing;

    execute $p$
      create policy registro_subir on storage.objects for insert to authenticated
      with check (bucket_id in ('fotos', 'autorizaciones', 'historias')
        and public.es_mi_perfil(((storage.foldername(name))[1])::uuid))
    $p$;
    execute $p$
      create policy registro_ver on storage.objects for select to authenticated
      using (bucket_id in ('fotos', 'autorizaciones', 'historias')
        and (public.es_mi_perfil(((storage.foldername(name))[1])::uuid) or public.es_equipo()))
    $p$;
  end if;
end
$$;
