-- Segunda revisión de seguridad. No cambia las migraciones ya aplicadas.

-- S01: son auxiliares internos de los triggers, no RPC para consultar bienestar.
-- También se cierra el evaluador: revocar solo el auxiliar dejaría el mismo dato en sus motivos.
revoke execute on function public.organizacion_con_reportes(uuid) from public, anon, authenticated;
revoke execute on function public.evaluar_trabajo(text,numeric,text,int,uuid) from public, anon, authenticated;

-- S02: toda aceptación comprueba el correo confirmado en Auth, incluso fuera de Next.
create or replace function public.aceptar_invitacion() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  correo_cuenta text;
  rol_cuenta public.rol;
  inv public.company_invitations;
begin
  if auth.uid() is null then return null; end if;
  perform pg_advisory_xact_lock(hashtext('aceptar-invitacion'), hashtext(auth.uid()::text));
  if public.mi_empresa() is not null then return null; end if;
  select lower(u.email) into correo_cuenta from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null;
  if correo_cuenta is null then return null; end if;
  select r.rol into rol_cuenta from public.user_roles r where r.user_id = auth.uid() for update;
  if rol_cuenta is null or rol_cuenta not in ('empresa', 'talento') then return null; end if;
  if exists (select 1 from public.talent_profiles p where p.user_id = auth.uid()) then return null; end if;

  select * into inv from public.company_invitations i
    where i.correo = correo_cuenta and i.aceptada_en is null and i.cancelada_en is null and i.vence_en > now()
    order by i.creado_en desc, i.id limit 1;
  if not found then return null; end if;
  -- Mismo orden que administración: organización primero, invitación después.
  perform 1 from public.companies where id = inv.company_id for update;
  select * into inv from public.company_invitations i
    where i.id = inv.id and i.correo = correo_cuenta and i.aceptada_en is null
      and i.cancelada_en is null and i.vence_en > now() for update;
  if not found then return null; end if;

  insert into public.company_members(company_id,user_id,rol,invitado_por)
    values(inv.company_id,auth.uid(),inv.rol,inv.invitado_por);
  update public.company_invitations set aceptada_en = now() where id = inv.id;
  update public.user_roles set rol = 'empresa' where user_id = auth.uid();
  return inv.company_id;
end $$;

-- Las operaciones administrativas comparten una fila bloqueada. La autorización se vuelve
-- a comprobar después de tomar el bloqueo: no se decide con un rol leído antes de esperar.
create or replace function public.exigir_admin_organizacion() returns uuid
language plpgsql volatile security definer set search_path = public as $$
declare empresa uuid := public.mi_empresa();
begin
  if empresa is null then
    raise exception 'Solo administración de la organización puede hacer esto' using errcode = '42501';
  end if;
  perform 1 from public.companies where id = empresa for update;
  if public.mi_rol_empresa() is distinct from 'admin' then
    raise exception 'Solo administración de la organización puede hacer esto' using errcode = '42501';
  end if;
  return empresa;
end $$;

-- S08: owner_id es la referencia interna para el alta y la retirada de miembros. No es una
-- segunda forma de invitar a alguien por UPDATE, saltándose company_members y la verificación.
create function public.proteger_titular_organizacion() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('anon','authenticated') and new.owner_id is distinct from old.owner_id then
    raise exception 'El titular se mantiene mediante las funciones de miembros' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.proteger_titular_organizacion() from public,anon,authenticated;
create trigger proteger_titular before update on public.companies
  for each row execute function public.proteger_titular_organizacion();

-- M2 y defensa de MFA: NULL no equivale a un rol válido. Un curador sin aal2 tiene mi_rol() NULL.
-- La prueba del celular es phone_confirmed_at, no el mero hecho de que phone esté escrito.
create or replace function public.reclamar_perfil() returns uuid
language plpgsql security definer set search_path = public as $$
declare mi_celular text; perfil uuid;
begin
  if auth.uid() is null or public.mi_rol() is distinct from 'talento' then return null; end if;
  perform pg_advisory_xact_lock(hashtext('reclamar-perfil'),hashtext(auth.uid()::text));
  if exists (select 1 from public.talent_profiles where user_id = auth.uid()) then return null; end if;
  select regexp_replace(u.phone,'^57','') into mi_celular from auth.users u
    where u.id = auth.uid() and u.phone_confirmed_at is not null;
  if mi_celular is null or mi_celular !~ '^3[0-9]{9}$' then return null; end if;
  select p.id into perfil from public.talent_profiles p join public.talent_private t on t.talent_id = p.id
    where p.user_id is null and t.celular = mi_celular
    order by p.created_at,p.id limit 1 for update of p skip locked;
  if perfil is not null then
    update public.talent_profiles set user_id = auth.uid() where id = perfil and user_id is null;
  end if;
  return perfil;
end $$;

-- S03: preferencias de desembolso solo del titular. No hay una pantalla operativa del equipo
-- que necesite el celular de la billetera; una autorización de curaduría no autoriza esta lectura.
drop policy pago_ver on public.talent_payout_preferences;
create policy pago_ver on public.talent_payout_preferences for select to authenticated
  using (exists(select 1 from public.talent_profiles p where p.id=talent_id and p.user_id=auth.uid()));

-- CREATE OR REPLACE conserva ACL; se dejan explícitos los límites de cada RPC.
revoke execute on function public.aceptar_invitacion(), public.reclamar_perfil() from public,anon;
grant execute on function public.aceptar_invitacion(), public.reclamar_perfil() to authenticated;
revoke execute on function public.exigir_admin_organizacion() from public,anon,authenticated;
