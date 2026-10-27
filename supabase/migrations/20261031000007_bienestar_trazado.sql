-- El equipo ya no lee el bienestar directamente: lo hace por una función que deja registro de quién
-- leyó, cuándo y qué. La persona sigue leyendo lo suyo sin intermediarios.
create table wellbeing_access_log (
  id uuid primary key default gen_random_uuid(),
  leido_por uuid not null references auth.users,
  accion text not null check (accion in ('lista', 'tomar', 'cerrar')),
  caso uuid, -- sin referencia: el registro sobrevive aunque la persona borre su seguimiento
  en timestamptz not null default now()
);
alter table wellbeing_access_log enable row level security;
revoke all on wellbeing_access_log from anon, authenticated;
grant select on wellbeing_access_log to authenticated;
-- Solo administración audita; nadie escribe ni borra el registro desde la API.
create policy registro_admin on wellbeing_access_log for select to authenticated using (public.mi_rol() = 'admin');
create index on wellbeing_access_log (en);

drop policy bienestar_leer on wellbeing_checkins;
create policy bienestar_leer on wellbeing_checkins for select to authenticated using (
  exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()));
drop policy casos_privados on wellbeing_cases;
create policy casos_privados on wellbeing_cases for select to authenticated using (
  exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()));

-- La cola del equipo: casos abiertos o en curso, con las respuestas que los abrieron.
create function public.casos_bienestar_equipo() returns table (
  id uuid, prioridad text, permite_contacto boolean, estado text, asignado_a_mi boolean, asignado boolean,
  creado_en timestamptz, revision_sugerida_en timestamptz, nombre text,
  energia text, trato_respetuoso boolean, pago_a_tiempo boolean
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_equipo() then raise exception 'sin permiso' using errcode = '42501'; end if;
  insert into wellbeing_access_log (leido_por, accion) values (auth.uid(), 'lista');
  return query
    select c.id, c.prioridad, c.permite_contacto, c.estado, c.asignado_a = auth.uid(), c.asignado_a is not null,
      c.creado_en, c.revision_sugerida_en, p.nombre, w.energia, w.trato_respetuoso, w.pago_a_tiempo
    from wellbeing_cases c
    join talent_profiles p on p.id = c.talent_id
    join wellbeing_checkins w on w.id = c.checkin_id
    where c.estado in ('abierto', 'en_curso')
    order by c.prioridad desc, c.creado_en
    limit 100;
end $$;
revoke execute on function public.casos_bienestar_equipo() from public, anon;
grant execute on function public.casos_bienestar_equipo() to authenticated;

-- Tomar y cerrar también quedan en el registro.
create or replace function public.gestionar_caso_bienestar(caso uuid, accion text) returns void
language plpgsql security definer set search_path = public as $$
declare fila public.wellbeing_cases;
begin
  if not public.es_equipo() then raise exception 'sin permiso' using errcode = '42501'; end if;
  select * into fila from wellbeing_cases where id = caso for update;
  if not found then raise exception 'caso no disponible' using errcode = '22023'; end if;
  if accion = 'tomar' and fila.estado = 'abierto' and fila.asignado_a is null then
    update wellbeing_cases set asignado_a = auth.uid(), asignado_en = now(), estado = 'en_curso' where id = caso;
    update help_requests set estado = 'en_curso', atendido_por = auth.uid() where wellbeing_case_id = caso;
  elsif accion = 'cerrar' and fila.estado = 'en_curso' and fila.asignado_a = auth.uid() then
    update wellbeing_cases set estado = 'cerrado', cerrado_en = now() where id = caso;
    update help_requests set estado = 'cerrada', atendido_por = auth.uid() where wellbeing_case_id = caso;
  else raise exception 'el caso ya cambió o está asignado a otra persona' using errcode = '40001';
  end if;
  insert into wellbeing_access_log (leido_por, accion, caso) values (auth.uid(), accion, caso);
end $$;

-- Si la persona borra un seguimiento, se borran sus respuestas y el caso, pero la llamada que pidió
-- sigue en la cola de ayuda: quien la atiende no la pierde a mitad de camino.
alter table help_requests drop constraint help_requests_wellbeing_case_id_fkey,
  add constraint help_requests_wellbeing_case_id_fkey foreign key (wellbeing_case_id)
    references wellbeing_cases on delete set null;
