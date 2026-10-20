-- Hito 1: tipos y tablas núcleo.
-- RLS queda ACTIVADA en todas las tablas desde ya y sin políticas: nadie con la llave
-- pública lee ni escribe nada hasta que el hito 2 agregue las políticas por rol.

create type rol as enum ('talento', 'empresa', 'curador', 'gestor', 'admin');
create type visibilidad as enum ('reservado', 'visible');
create type tipo_oferta as enum ('horas', 'proyecto', 'mentoria', 'fraccional', 'medio_tiempo', 'experiencia');
create type origen_historia as enum ('escrito', 'dictado', 'llamada', 'gestor');
create type capa_huella as enum ('situaciones', 'contexto', 'escala', 'oficio', 'normas', 'transferir');
create type estado_conexion as enum (
  'propuesta', 'elegida', 'enviada_talento', 'interesa', 'descarta',
  'visible_empresa', 'empresa_quiere_conocer', 'abierta', 'cerrada'
);
create type estado_solicitud as enum ('recibida', 'cotizada', 'confirmada', 'realizada', 'reporte_enviado');

-- Rol de cada usuario. auth.users ya guarda el teléfono o el correo.
create table user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  rol rol not null default 'talento',
  created_at timestamptz not null default now()
);

create table talent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null, -- null mientras el gestor lo registra
  nombre text not null,
  ubicacion text, -- ciudad o vereda
  resumen text,
  visibilidad visibilidad not null default 'reservado',
  foto_path text, -- Storage, bucket privado
  estado text not null default 'borrador' check (estado in ('borrador', 'publicado', 'pausado')),
  registrado_por uuid references auth.users,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Separada a propósito: solo la lee el equipo. Ninguna vista para empresas ni el
-- matching la tocan (regla 1 del CLAUDE.md).
create table talent_private (
  talent_id uuid primary key references talent_profiles on delete cascade,
  fecha_nacimiento date,
  autorizacion_fecha timestamptz,
  autorizacion_version text,
  autorizacion_medio text check (autorizacion_medio in ('pantalla', 'firma', 'audio')),
  pension text
);

create table talent_offers (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  tipo tipo_oferta not null,
  horas_semana int check (horas_semana between 1 and 48),
  modalidad text check (modalidad in ('presencial', 'remoto', 'mixto')),
  tarifa_esperada numeric check (tarifa_esperada >= 0)
);

create table taxonomy (
  id uuid primary key default gen_random_uuid(),
  capa capa_huella not null,
  etiqueta text not null,
  sinonimos text[] not null default '{}',
  sector text,
  unique (capa, etiqueta)
);

create table stories (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  texto text not null,
  origen origen_historia not null,
  created_at timestamptz not null default now()
);

create table footprint_tags (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  story_id uuid references stories on delete set null,
  capa capa_huella not null,
  etiqueta text not null,
  taxonomy_id uuid references taxonomy, -- null = etiqueta nueva, pasa a revisión del equipo
  confirmada boolean not null default false,
  evidencia text
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  nombre text not null,
  nit text,
  sector text,
  tamano text,
  ciudad text,
  contacto text,
  created_at timestamptz not null default now()
);

create index on talent_offers (talent_id);
create index on stories (talent_id);
create index on footprint_tags (talent_id) where confirmada;
create index on companies (owner_id);

alter table user_roles enable row level security;
alter table talent_profiles enable row level security;
alter table talent_private enable row level security;
alter table talent_offers enable row level security;
alter table taxonomy enable row level security;
alter table stories enable row level security;
alter table footprint_tags enable row level security;
alter table companies enable row level security;

-- La taxonomía es pública (brief, "Modelo de datos").
create policy taxonomia_publica on taxonomy for select using (true);
