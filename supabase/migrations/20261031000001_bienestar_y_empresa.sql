-- Bienestar voluntario, separado del perfil y excluido de las vistas de empresas y matching.
create table wellbeing_preferences (
  talent_id uuid primary key references talent_profiles on delete cascade,
  horas_meta int not null check (horas_meta between 0 and 48),
  ingreso_meta numeric check (ingreso_meta between 0 and 1000000000),
  consentimiento_en timestamptz not null default now()
);
alter table wellbeing_preferences enable row level security;
revoke all on wellbeing_preferences from anon;
create policy bienestar_propio on wellbeing_preferences for all to authenticated
 using (exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()))
 with check (exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()));

create table wellbeing_checkins (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references talent_profiles on delete cascade,
  connection_id uuid references connections on delete set null,
  energia text not null check (energia in ('bien', 'ajustar', 'pausa')),
  trato_respetuoso boolean not null,
  pago_a_tiempo boolean, -- null: aún no corresponde pagar
  quiere_contacto boolean not null default false,
  creado_en timestamptz not null default now()
);
alter table wellbeing_checkins enable row level security;
revoke all on wellbeing_checkins from anon;
create policy bienestar_registrar on wellbeing_checkins for insert to authenticated with check (
 exists (select 1 from talent_profiles p where p.id=talent_id and p.user_id=auth.uid())
 and exists (select 1 from wellbeing_preferences w where w.talent_id=wellbeing_checkins.talent_id)
 and (connection_id is null or exists (select 1 from talent_opportunities_view v where v.id=connection_id))
);
create policy bienestar_leer on wellbeing_checkins for select to authenticated using (
 exists (select 1 from talent_profiles p where p.id=talent_id and p.user_id=auth.uid()) or public.es_equipo());
create policy bienestar_borrar on wellbeing_checkins for delete to authenticated using (
 exists (select 1 from talent_profiles p where p.id=talent_id and p.user_id=auth.uid()));

-- Un pedido de acompañamiento llega a la cola humana en la misma transacción.
create function public.acompanar_bienestar() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.quiere_contacto then
   insert into help_requests(user_id,canal,motivo)
   select user_id,'boton','Pidió acompañamiento de bienestar. Revisar el seguimiento privado.'
   from talent_profiles where id=new.talent_id;
 end if;
 return new;
end $$;
create trigger bienestar_contacto after insert on wellbeing_checkins for each row execute function public.acompanar_bienestar();
revoke execute on function public.acompanar_bienestar() from public,anon,authenticated;

alter table talent_profiles add column zona_local text check (length(zona_local)<=100);
-- La zona local no se añade a ninguna vista para empresas.
alter table companies
 add column correo_contacto text check (length(correo_contacto)<=254),
 add column telefono_contacto text check (length(telefono_contacto)<=20),
 add column cargo_contacto text check (length(cargo_contacto)<=100),
 add column sitio_web text check (length(sitio_web)<=500 and sitio_web ~ '^https://'),
 add column descripcion text check (length(descripcion)<=1000),
 add column brandbook_url text check (length(brandbook_url)<=500 and brandbook_url ~ '^https://'),
 add column zona_local text check (length(zona_local)<=100),
 add column compromiso_bienestar boolean not null default false;
