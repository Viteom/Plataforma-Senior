-- Una respuesta preocupante requiere revisión interna, aunque no autorice una llamada.
-- El permiso de contacto queda separado y visible; nunca se contacta por defecto.
create table wellbeing_cases (
 id uuid primary key default gen_random_uuid(),
 checkin_id uuid not null unique references wellbeing_checkins on delete cascade,
 talent_id uuid not null references talent_profiles on delete cascade,
 prioridad text not null check(prioridad in ('normal','preferente')),
 permite_contacto boolean not null,
 estado text not null default 'abierto' check(estado in ('abierto','en_curso','cerrado')),
 asignado_a uuid references auth.users,
 asignado_en timestamptz,
 creado_en timestamptz not null default now(),
 revision_sugerida_en timestamptz not null default now()+interval '48 hours',
 cerrado_en timestamptz
);
alter table wellbeing_cases enable row level security;
revoke all on wellbeing_cases from anon,authenticated;
grant select on wellbeing_cases to authenticated;
create policy casos_privados on wellbeing_cases for select to authenticated using (
 public.es_equipo() or exists(select 1 from talent_profiles p where p.id=talent_id and p.user_id=auth.uid()));
create index on wellbeing_cases(estado,prioridad,creado_en);
alter table help_requests add column wellbeing_case_id uuid references wellbeing_cases on delete cascade;

create or replace function public.acompanar_bienestar() returns trigger language plpgsql security definer set search_path=public as $$
declare caso uuid;
begin
 if new.quiere_contacto or new.energia in ('ajustar','pausa') or not new.trato_respetuoso or new.pago_a_tiempo=false then
   insert into wellbeing_cases(checkin_id,talent_id,prioridad,permite_contacto)
   values(new.id,new.talent_id,case when new.energia='pausa' or not new.trato_respetuoso or new.pago_a_tiempo=false then 'preferente' else 'normal' end,new.quiere_contacto)
   returning id into caso;
   if new.quiere_contacto then
     insert into help_requests(user_id,canal,motivo,wellbeing_case_id)
     select user_id,'boton','Pidió acompañamiento de bienestar. Revisar el caso privado y su permiso de contacto.',caso
     from talent_profiles where id=new.talent_id;
   end if;
 end if;
 return new;
end $$;
-- Revisión de registros anteriores sin duplicar las solicitudes de ayuda ya creadas.
insert into wellbeing_cases(checkin_id,talent_id,prioridad,permite_contacto,creado_en,revision_sugerida_en)
select id,talent_id,case when energia='pausa' or not trato_respetuoso or pago_a_tiempo=false then 'preferente' else 'normal' end,quiere_contacto,creado_en,now()+interval '48 hours'
from wellbeing_checkins where quiere_contacto or energia in ('ajustar','pausa') or not trato_respetuoso or pago_a_tiempo=false;

create function public.gestionar_caso_bienestar(caso uuid, accion text) returns void
language plpgsql security definer set search_path=public as $$
declare fila public.wellbeing_cases;
begin
 if not public.es_equipo() then raise exception 'sin permiso' using errcode='42501';end if;
 select * into fila from wellbeing_cases where id=caso for update;
 if not found then raise exception 'caso no disponible' using errcode='22023';end if;
 if accion='tomar' and fila.estado='abierto' and fila.asignado_a is null then
   update wellbeing_cases set asignado_a=auth.uid(),asignado_en=now(),estado='en_curso' where id=caso;
   update help_requests set estado='en_curso',atendido_por=auth.uid() where wellbeing_case_id=caso;
 elsif accion='cerrar' and fila.estado='en_curso' and fila.asignado_a=auth.uid() then
   update wellbeing_cases set estado='cerrado',cerrado_en=now() where id=caso;
   update help_requests set estado='cerrada',atendido_por=auth.uid() where wellbeing_case_id=caso;
 else raise exception 'el caso ya cambió o está asignado a otra persona' using errcode='40001';
 end if;
end $$;
revoke execute on function public.gestionar_caso_bienestar(uuid,text) from public,anon;
grant execute on function public.gestionar_caso_bienestar(uuid,text) to authenticated;
-- Una persona no puede adjuntar una solicitud propia al caso privado de otra.
create policy ayuda_caso_propio on help_requests as restrictive for insert to authenticated with check (
 wellbeing_case_id is null or exists(select 1 from wellbeing_cases c join talent_profiles p on p.id=c.talent_id where c.id=wellbeing_case_id and p.user_id=auth.uid()));
