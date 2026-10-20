# Propuesta para el hito 1 (pendiente de aprobación)

Responde a los puntos 3 y 4 del primer mensaje del brief: estructura de carpetas, migraciones y
preguntas. Nada de esto está construido todavía.

## 1. Stack (sin cambios de fondo frente al brief)

| Capa | Elección concreta | Por qué |
|---|---|---|
| App | Next.js 15 (App Router) + TypeScript estricto | Lo pide el brief; Server Actions para no exponer llaves |
| Estilos | Tailwind CSS v4 con tokens en `app/globals.css` (`@theme`) | El brandbook solo cambia variables |
| Componentes | shadcn/ui sobre Radix + íconos Lucide | Accesibles por defecto; el código queda en el repo y se puede vestir después |
| PWA | Serwist (`@serwist/next`) + `app/manifest.ts` | Mantenido, compatible con App Router; caché para el gestor sin señal (hito 5) |
| Datos | Supabase (`@supabase/ssr`) con migraciones en `supabase/migrations` | RLS versionado en git |
| Pruebas | Vitest (unidad), pgTAP vía `supabase test db` (RLS), Playwright + axe (accesibilidad) | Los tests de "la empresa no lee edad" y "la edad no entra al matching" son obligatorios |
| Gestor de paquetes | npm | Ya está instalado en tu equipo |

Único ajuste que propongo: **Serwist en lugar de `next-pwa`** (este último está abandonado).

## 2. Estructura de carpetas

```
plataforma-senior/
├─ CLAUDE.md
├─ docs/
│  ├─ brief.md
│  ├─ pantallas/                 ← capturas del lienzo y del prototipo
│  └─ propuesta-hito-1.md
├─ design-system/plataforma-senior/
│  ├─ MASTER.md                  ← tokens y reglas de UI
│  └─ pages/                     ← excepciones por pantalla
├─ app/
│  ├─ layout.tsx                 ← fuente, "Saltar al contenido", botón Ayuda global
│  ├─ globals.css                ← tokens (@theme)
│  ├─ manifest.ts · sw.ts
│  ├─ (publico)/                 ← sin sesión
│  │  ├─ page.tsx                ← portada: ¿talento o empresa?
│  │  └─ entrar/ · entrar/codigo/
│  ├─ (talento)/                 ← layout con barra inferior
│  │  ├─ perfil/nuevo/ · huella/ · inicio/ · oportunidades/
│  │  ├─ mi-perfil/ · aprende/ · emprende/
│  ├─ ayuda/                     ← accesible para todos los roles
│  ├─ empresa/                   ← layout con barra superior (escritorio)
│  │  ├─ explorar/ · perfil/[id]/ · experiencias/ · experiencias/[slug]/
│  │  ├─ problema/nuevo/ · problema/[id]/ · procesos/
│  ├─ equipo/                    ← layout con barra lateral
│  │  ├─ page.tsx · problema/[id]/ · experiencias/ · ayuda/
│  └─ gestor/registrar/
├─ components/
│  ├─ ui/                        ← shadcn (Button, Input, Sheet…), ajustados a 56 px / 18 px
│  ├─ layout/                    ← BarraInferior, BarraSuperior, BarraLateral, BotonAyuda
│  └─ huella/ · perfil/ · empresa/ …   ← por dominio, a medida que lleguen los hitos
├─ lib/
│  ├─ supabase/                  ← client.ts, server.ts, middleware.ts
│  ├─ auth/roles.ts              ← rol → rutas permitidas
│  ├─ matching/                  ← puntaje v1 (hito 4), sin acceso a edad por tipo
│  └─ ia/                        ← prompts y esquemas JSON (hito 3)
├─ middleware.ts                 ← sesión + redirección por rol
├─ supabase/
│  ├─ migrations/
│  ├─ seed.sql                   ← taxonomía semilla, Ceremonia del cuidado (borrador)
│  └─ tests/                     ← pgTAP: RLS por rol
└─ tests/
   ├─ unit/                      ← incluye "palabras prohibidas" y "edad fuera del matching"
   └─ e2e/                       ← Playwright + axe a 360 px
```

Rutas en español tal como las define el brief. Cada rol tiene su propio `layout.tsx`, y el
middleware redirige si un rol entra a un área que no le corresponde.

## 3. Migraciones (borrador)

Se aplican por partes: en el hito 1 solo la `0001` (tipos y tablas vacías para que las pantallas
naveguen); RLS completa y `talent_private` se prueban en el hito 2, como pide el brief.

### 0001_base.sql — tipos y tablas núcleo

```sql
create type rol as enum ('talento','empresa','curador','gestor','admin');
create type visibilidad as enum ('reservado','visible');
create type tipo_oferta as enum ('horas','proyecto','mentoria','fraccional','medio_tiempo','experiencia');
create type origen_historia as enum ('escrito','dictado','llamada','gestor');
create type capa_huella as enum ('situaciones','contexto','escala','oficio','normas','transferir');
create type estado_conexion as enum (
  'propuesta','elegida','enviada_talento','interesa','descarta',
  'visible_empresa','empresa_quiere_conocer','abierta','cerrada');
create type estado_solicitud as enum ('recibida','cotizada','confirmada','realizada','reporte_enviado');

-- Rol de cada usuario de Supabase Auth (auth.users ya guarda teléfono o correo)
create table user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  rol rol not null default 'talento',
  created_at timestamptz not null default now()
);

create table talent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null, -- null mientras el gestor lo registra
  nombre text not null,
  ubicacion text,                    -- ciudad o vereda
  resumen text,
  visibilidad visibilidad not null default 'reservado',
  foto_path text,                    -- Storage, bucket privado
  estado text not null default 'borrador',
  registrado_por uuid references auth.users,
  created_at timestamptz not null default now()
);

-- Separada a propósito: solo equipo. Ninguna vista ni función de matching la toca.
create table talent_private (
  talent_id uuid primary key references talent_profiles on delete cascade,
  fecha_nacimiento date,
  autorizacion_fecha timestamptz,
  autorizacion_version text,
  autorizacion_medio text check (autorizacion_medio in ('pantalla','firma','audio')),
  pension text
);

create table talent_offers (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  tipo tipo_oferta not null,
  horas_semana int check (horas_semana between 1 and 48),
  modalidad text check (modalidad in ('presencial','remoto','mixto')),
  tarifa_esperada numeric
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
  taxonomy_id uuid references taxonomy,      -- null = etiqueta nueva, va a revisión
  confirmada boolean not null default false,
  evidencia text
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  nombre text not null, nit text, sector text, tamano text, ciudad text, contacto text
);
```

Las tablas `needs`, `need_requirements`, `connections`, `matching_weights`, `experiences`,
`experience_requests`, `impact_records`, `help_requests`, `call_sessions` y
`entrepreneurship_diagnostics` siguen el modelo del brief y entran en la migración del hito que las
usa (4, 5 y 6), para no cargar RLS que aún no se puede probar.

### 0002_rls.sql — acceso por fila (hito 2)

```sql
alter table talent_profiles enable row level security;
alter table talent_private  enable row level security;
-- … enable en todas las tablas

create function mi_rol() returns rol language sql stable security definer
  set search_path = public as $$ select rol from user_roles where user_id = auth.uid() $$;

create function es_equipo() returns boolean language sql stable as
  $$ select mi_rol() in ('curador','admin') $$;

-- Talento: solo lo suyo. Equipo: todo. Gestor: lo que registró.
create policy talento_propio on talent_profiles for all
  using (user_id = auth.uid() or registrado_por = auth.uid() or es_equipo());

-- Fecha de nacimiento: solo equipo (el talento la escribe pero no hace falta que la relea).
create policy privado_equipo on talent_private for select using (es_equipo());
create policy privado_insert on talent_private for insert with check (
  exists (select 1 from talent_profiles p where p.id = talent_id
          and (p.user_id = auth.uid() or p.registrado_por = auth.uid())));

-- Empresas: nunca leen las tablas; leen esta vista.
create view company_talent_view with (security_barrier) as
select p.id,
       case when p.visibilidad = 'visible' then p.nombre end   as nombre,
       case when p.visibilidad = 'visible' then p.foto_path end as foto_path,
       p.ubicacion, p.visibilidad,
       (select jsonb_agg(jsonb_build_object('capa', t.capa, 'etiqueta', t.etiqueta))
          from footprint_tags t where t.talent_id = p.id and t.confirmada) as huella,
       (select jsonb_agg(to_jsonb(o) - 'tarifa_esperada') from talent_offers o where o.talent_id = p.id) as ofertas
from talent_profiles p
where p.estado = 'publicado';
-- Sin fecha de nacimiento, sin columnas de talent_private. La revelación de nombre/foto
-- para perfiles reservados se agrega en el hito 4, ligada a connections.estado = 'abierta'.
```

Pruebas pgTAP del hito 2: una empresa autenticada obtiene 0 filas de `talent_profiles` y
`talent_private`, y `company_talent_view` no expone `fecha_nacimiento` ni el nombre de un perfil
reservado.

## 4. Qué entrega el hito 1

- Proyecto Next.js con tokens, Atkinson Hyperlegible y componentes base (Botón 56 px, Campo,
  Chip, BotonAyuda, tres navegaciones).
- Todas las rutas del brief como pantallas vacías navegables, con título, una acción principal de
  ejemplo y el botón Ayuda.
- Un selector temporal de rol (solo en desarrollo) para recorrer los tres menús sin login.
- PWA instalable (manifest, íconos provisionales en gris, service worker).
- Proyecto Supabase enlazado con la migración `0001`.
- Despliegue en Vercel y una guía corta de cómo abrirlo y añadirlo a la pantalla de inicio en
  Android y iPhone.

## 5. Preguntas

1. **Capturas de referencia.** `docs/pantallas/` está vacía. ¿Las vas a subir, o diseño las
   pantallas a partir del brief y del sistema de diseño y luego las comparamos con el lienzo?
2. **Nombre provisional.** El brief usa `[MARCA]`. ¿Uso "Plataforma Senior" en título, manifest y
   SMS hasta que llegue el brandbook, o prefieres otro nombre de trabajo?
3. **Región de Supabase.** Para la Ley 1581 propongo São Paulo (`sa-east-1`), la más cercana.
   ¿Lo validas con el abogado o lo dejamos así para el piloto?
4. **Requisito de entrada (45+ o 20+ años de oficio).** Propongo preguntarlo en el paso 1 del
   perfil con dos opciones ("Tengo 45 años o más" / "Tengo más de 20 años de experiencia") y pedir
   la fecha de nacimiento exacta al final, como hace el guion de la llamada. ¿Te sirve?
5. **Cuentas.** Para el hito 1 solo necesito Supabase y Vercel. ¿Ya existen, o arranco con
   Supabase local y despliego cuando las tengas?
6. **Git.** ¿Creo el repositorio en GitHub (público o privado, y en qué cuenta u organización) o
   por ahora solo git local?
