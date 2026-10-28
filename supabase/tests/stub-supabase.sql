-- Lo mínimo de Supabase para probar migraciones y RLS sin Docker (PGlite en las pruebas):
-- los roles de la API, auth.users y auth.uid() leyendo el "sub" del JWT como lo hace Supabase.

create role anon nologin;
create role authenticated nologin;

create schema auth;
create table auth.users (
  id uuid primary key,
  phone text, -- Supabase lo guarda sin "+": 573001234567
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- Los claims del JWT. Sin claims fijados, las pruebas simulan una sesión que ya pasó el segundo
-- factor (aal2); las pruebas del segundo factor fijan request.jwt.claims con aal1.
create function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{"aal": "aal2"}'::jsonb)
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated;

-- Supabase da estos permisos por defecto en public; RLS y los revoke de las migraciones restringen.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
