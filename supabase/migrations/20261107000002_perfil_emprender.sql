-- Perfil de emprender: en la prueba con usuarios, la persona respondía, iba a un curso y al volver
-- encontraba el formulario vacío. El diagnóstico ya se guardaba, pero la pantalla no lo leía.
-- Ahora también se guardan su idea con sus palabras, los pasos que ya hizo y los cursos que abrió.

alter table entrepreneurship_diagnostics
  add column idea text check (char_length(idea) <= 500),
  add column pasos_hechos text[] not null default '{}',
  add column actualizado_en timestamptz not null default now();

-- Cursos que la persona abrió desde Kánna. Solo ella y el equipo lo ven; sirve para que no se
-- pierda y para que el equipo sepa qué cursos sirven.
create table course_views (
  talent_id uuid not null references talent_profiles on delete cascade,
  course_id uuid not null references courses on delete cascade,
  primer_visto_en timestamptz not null default now(),
  ultimo_visto_en timestamptz not null default now(),
  veces int not null default 1 check (veces > 0),
  primary key (talent_id, course_id)
);
alter table course_views enable row level security;
create policy curso_visto_propio on course_views for select
  using (public.es_mi_perfil(talent_id) or public.es_equipo());

-- Registrar una visita: por función, para que nadie anote visitas de otra persona.
create or replace function registrar_curso_visto(curso uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil uuid;
begin
  select id into perfil from talent_profiles where user_id = auth.uid();
  if perfil is null then
    return; -- Sin perfil, el curso se abre igual; solo no se anota.
  end if;
  if not exists (select 1 from courses where id = curso and publicado) then
    raise exception 'curso no disponible' using errcode = '22023';
  end if;
  insert into course_views (talent_id, course_id) values (perfil, curso)
  on conflict (talent_id, course_id)
  do update set ultimo_visto_en = now(), veces = course_views.veces + 1;
end;
$$;
revoke all on function registrar_curso_visto(uuid) from public, anon;
grant execute on function registrar_curso_visto(uuid) to authenticated;

-- Marcar o desmarcar un paso de la ruta como hecho, en el diagnóstico más reciente de la persona.
create or replace function marcar_paso_emprender(paso text, hecho boolean)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil uuid;
  fila uuid;
  resultado text[];
begin
  if paso is null or paso !~ '^[a-z0-9-]{1,40}$' then
    raise exception 'paso no válido' using errcode = '22023';
  end if;
  select id into perfil from talent_profiles where user_id = auth.uid();
  if perfil is null then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  select id into fila from entrepreneurship_diagnostics
    where talent_id = perfil order by creado_en desc limit 1;
  if fila is null then
    raise exception 'sin ruta' using errcode = 'P0002';
  end if;
  update entrepreneurship_diagnostics
    set pasos_hechos = case
          when hecho then (select array_agg(distinct x order by x) from unnest(array_append(pasos_hechos, paso)) x)
          else array_remove(pasos_hechos, paso)
        end,
        actualizado_en = now()
    where id = fila
    returning pasos_hechos into resultado;
  return coalesce(resultado, '{}');
end;
$$;
revoke all on function marcar_paso_emprender(text, boolean) from public, anon;
grant execute on function marcar_paso_emprender(text, boolean) to authenticated;
