-- Varias personas por organización, con roles, y cómo prefiere recibir sus pagos el talento.

-- ── Equipo de la organización ───────────────────────────────────────────────
-- Antes cada organización tenía una sola cuenta (companies.owner_id). Ahora quien la creó queda
-- como administración y puede invitar a más personas. Cada cuenta sigue perteneciendo a una sola
-- organización. owner_id se conserva como quien la registró.
--   admin:    todo, incluido invitar personas y cambiar los datos de la organización.
--   procesos: publica retos, explora talento, conversa y propone acuerdos.
--   lectura:  ve retos y procesos, no cambia nada.
create table company_members (
  company_id uuid not null references companies on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  rol text not null check (rol in ('admin', 'procesos', 'lectura')),
  invitado_por uuid references auth.users on delete set null,
  creado_en timestamptz not null default now(),
  primary key (company_id, user_id),
  constraint una_organizacion_por_cuenta unique (user_id)
);
alter table company_members enable row level security;
revoke all on company_members from anon, authenticated;

insert into company_members (company_id, user_id, rol, creado_en)
select id, owner_id, 'admin', created_at from companies
on conflict do nothing;

-- Todas las políticas y funciones de organizaciones usan mi_empresa(): con esto, cualquier
-- persona del equipo de la organización ve lo mismo que veía la cuenta única.
create or replace function public.mi_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.company_members where user_id = auth.uid()
$$;

create function public.mi_rol_empresa() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.company_members where user_id = auth.uid()
$$;
revoke execute on function public.mi_rol_empresa() from public, anon;
grant execute on function public.mi_rol_empresa() to authenticated;

grant select on company_members to authenticated;
create policy miembros_ver on company_members for select
  using (company_id = public.mi_empresa() or public.es_equipo());

-- Quien registra la organización queda como administración.
create function public.registrar_primer_miembro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.company_members (company_id, user_id, rol) values (new.id, new.owner_id, 'admin')
  on conflict do nothing;
  return new;
end $$;
revoke execute on function public.registrar_primer_miembro() from public, anon, authenticated;
create trigger organizacion_primer_miembro after insert on companies
  for each row execute function public.registrar_primer_miembro();

-- owner_id también: una función estable no ve al primer miembro mientras se inserta la
-- organización (insert ... returning). quitar_miembro mantiene owner_id en alguien del equipo.
drop policy empresa_ver on companies;
create policy empresa_ver on companies for select
  using (id = public.mi_empresa() or owner_id = auth.uid() or public.es_equipo());

-- Quien ya es parte de una organización no registra otra.
drop policy empresa_crear on companies;
create policy empresa_crear on companies for insert
  with check (
    owner_id = auth.uid() and public.mi_rol() = 'empresa' and public.mi_empresa() is null
    and verificada_en is null and verificada_por is null and verificada_fuente is null
  );

drop policy empresa_editar on companies;
create policy empresa_editar on companies for update
  using ((id = public.mi_empresa() and public.mi_rol_empresa() = 'admin') or public.es_equipo())
  with check ((id = public.mi_empresa() and public.mi_rol_empresa() = 'admin') or public.es_equipo());

-- Solo lectura: la base bloquea cualquier cambio de retos, procesos y pedidos, también por RPC.
create function public.bloquear_solo_lectura() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.mi_rol_empresa() = 'lectura' then
    raise exception 'Tu rol en la organización es de solo lectura' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
revoke execute on function public.bloquear_solo_lectura() from public, anon, authenticated;
create trigger aaa_solo_lectura before insert or update or delete on needs
  for each row execute function public.bloquear_solo_lectura();
create trigger aaa_solo_lectura before insert or update or delete on need_requirements
  for each row execute function public.bloquear_solo_lectura();
create trigger aaa_solo_lectura before insert or update or delete on connections
  for each row execute function public.bloquear_solo_lectura();
create trigger aaa_solo_lectura before insert or update or delete on experience_requests
  for each row execute function public.bloquear_solo_lectura();

-- ── Invitaciones ────────────────────────────────────────────────────────────
-- Kánna todavía no envía correos: administración comparte el enlace de entrada y, cuando la
-- persona entra con ese correo, la invitación la suma a la organización.
create table company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies on delete cascade,
  correo text not null check (correo = lower(correo) and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  rol text not null check (rol in ('admin', 'procesos', 'lectura')),
  invitado_por uuid references auth.users on delete set null,
  creado_en timestamptz not null default now(),
  vence_en timestamptz not null default now() + interval '7 days',
  aceptada_en timestamptz,
  cancelada_en timestamptz
);
alter table company_invitations enable row level security;
revoke all on company_invitations from anon, authenticated;
grant select on company_invitations to authenticated;
create unique index una_invitacion_abierta on company_invitations (company_id, correo)
  where aceptada_en is null and cancelada_en is null;
create index on company_invitations (correo) where aceptada_en is null and cancelada_en is null;
create policy invitaciones_ver on company_invitations for select
  using ((company_id = public.mi_empresa() and public.mi_rol_empresa() = 'admin') or public.es_equipo());

create function public.exigir_admin_organizacion() returns uuid
language plpgsql stable security definer set search_path = public as $$
begin
  if public.mi_rol_empresa() is distinct from 'admin' then
    raise exception 'Solo administración de la organización puede hacer esto' using errcode = '42501';
  end if;
  return public.mi_empresa();
end $$;
revoke execute on function public.exigir_admin_organizacion() from public, anon, authenticated;

create function public.invitar_a_mi_empresa(correo text, rol text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  empresa uuid := public.exigir_admin_organizacion();
  limpio text := lower(trim(correo));
  nueva uuid;
begin
  if rol not in ('admin', 'procesos', 'lectura') then
    raise exception 'Rol no válido' using errcode = '22023';
  end if;
  if limpio !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Correo no válido' using errcode = '22023';
  end if;
  if exists (select 1 from company_members m join auth.users u on u.id = m.user_id
             where m.company_id = empresa and lower(u.email) = limpio) then
    raise exception 'Esa persona ya es parte del equipo' using errcode = '23505';
  end if;
  if (select count(*) from company_invitations i where i.company_id = empresa
      and i.aceptada_en is null and i.cancelada_en is null and i.vence_en > now()) >= 30 then
    raise exception 'Hay demasiadas invitaciones abiertas' using errcode = '54000';
  end if;
  -- Una invitación vencida se reemplaza por la nueva.
  update company_invitations i set cancelada_en = now()
  where i.company_id = empresa and i.correo = limpio and i.aceptada_en is null and i.cancelada_en is null;
  insert into company_invitations (company_id, correo, rol, invitado_por)
  values (empresa, limpio, rol, auth.uid()) returning id into nueva;
  return nueva;
end $$;

create function public.cancelar_invitacion(invitacion uuid) returns void
language plpgsql security definer set search_path = public as $$
declare empresa uuid := public.exigir_admin_organizacion();
begin
  update company_invitations set cancelada_en = now()
  where id = invitacion and company_id = empresa and aceptada_en is null and cancelada_en is null;
end $$;

-- Siempre queda al menos una persona con administración.
create function public.cambiar_rol_miembro(usuario uuid, rol text) returns void
language plpgsql security definer set search_path = public as $$
declare empresa uuid := public.exigir_admin_organizacion();
begin
  if rol not in ('admin', 'procesos', 'lectura') then
    raise exception 'Rol no válido' using errcode = '22023';
  end if;
  if rol <> 'admin' and not exists (select 1 from company_members m where m.company_id = empresa
      and m.rol = 'admin' and m.user_id <> usuario) then
    raise exception 'Debe quedar al menos una persona con administración' using errcode = '23514';
  end if;
  update company_members m set rol = cambiar_rol_miembro.rol where m.company_id = empresa and m.user_id = usuario;
  if not found then raise exception 'Esa persona no es parte del equipo' using errcode = '22023'; end if;
end $$;

create function public.quitar_miembro(usuario uuid) returns void
language plpgsql security definer set search_path = public as $$
declare empresa uuid := public.exigir_admin_organizacion();
begin
  if not exists (select 1 from company_members m where m.company_id = empresa
      and m.rol = 'admin' and m.user_id <> usuario) then
    raise exception 'Debe quedar al menos una persona con administración' using errcode = '23514';
  end if;
  delete from company_members m where m.company_id = empresa and m.user_id = usuario;
  if not found then raise exception 'Esa persona no es parte del equipo' using errcode = '22023'; end if;
  -- Quien registró la organización deja de verla: owner_id pasa a otra persona con administración.
  update companies c set owner_id = (
    select m.user_id from company_members m where m.company_id = empresa and m.rol = 'admin' order by m.creado_en limit 1)
  where c.id = empresa and c.owner_id = usuario;
end $$;

-- Al entrar con el correo invitado, la cuenta se suma a la organización. Solo cuentas nuevas o de
-- organización sin organización: nunca cambia una cuenta de talento con perfil ni del equipo Kánna.
create function public.aceptar_invitacion() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  correo_cuenta text;
  rol_cuenta rol;
  inv company_invitations;
begin
  if auth.uid() is null or public.mi_empresa() is not null then return null; end if;
  select lower(email) into correo_cuenta from auth.users where id = auth.uid();
  if correo_cuenta is null then return null; end if;
  select r.rol into rol_cuenta from user_roles r where r.user_id = auth.uid();
  if rol_cuenta not in ('empresa', 'talento') then return null; end if;
  if rol_cuenta = 'talento' and exists (select 1 from talent_profiles p where p.user_id = auth.uid()) then
    return null;
  end if;
  select * into inv from company_invitations i
  where i.correo = correo_cuenta and i.aceptada_en is null and i.cancelada_en is null and i.vence_en > now()
  order by i.creado_en desc limit 1
  for update;
  if not found then return null; end if;

  insert into company_members (company_id, user_id, rol, invitado_por)
  values (inv.company_id, auth.uid(), inv.rol, inv.invitado_por);
  update company_invitations set aceptada_en = now() where id = inv.id;
  update user_roles set rol = 'empresa' where user_id = auth.uid();
  return inv.company_id;
end $$;

-- La lista del equipo con correo y nombre: solo para personas de la misma organización.
create function public.miembros_de_mi_empresa()
returns table (user_id uuid, correo text, nombre text, rol text, desde timestamptz, soy_yo boolean)
language sql stable security definer set search_path = public as $$
  select m.user_id, u.email, nullif(u.raw_user_meta_data ->> 'nombre', ''), m.rol, m.creado_en, m.user_id = auth.uid()
  from company_members m join auth.users u on u.id = m.user_id
  where m.company_id = public.mi_empresa()
  order by (m.user_id = auth.uid()) desc, m.creado_en
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'invitar_a_mi_empresa(text, text)', 'cancelar_invitacion(uuid)', 'cambiar_rol_miembro(uuid, text)',
    'quitar_miembro(uuid)', 'aceptar_invitacion()', 'miembros_de_mi_empresa()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ── Cómo prefiere recibir sus pagos el talento ──────────────────────────────
-- Solo la preferencia. El número de una cuenta de banco no se guarda en Kánna: se escribirá en la
-- página segura del proveedor de pagos. Para Nequi o Daviplata, celular vacío significa «el mismo
-- con el que entra». Ninguna organización lo ve.
create table talent_payout_preferences (
  talent_id uuid primary key references talent_profiles on delete cascade,
  metodo text not null check (metodo in ('nequi', 'daviplata', 'banco', 'giro')),
  celular text check (celular ~ '^3[0-9]{9}$'),
  actualizado_en timestamptz not null default now(),
  constraint celular_solo_billetera check (celular is null or metodo in ('nequi', 'daviplata'))
);
alter table talent_payout_preferences enable row level security;
revoke all on talent_payout_preferences from anon, authenticated;
grant select, insert, update, delete on talent_payout_preferences to authenticated;
create policy pago_ver on talent_payout_preferences for select
  using (exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()) or public.es_equipo());
create policy pago_propio on talent_payout_preferences for all
  using (exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()))
  with check (exists (select 1 from talent_profiles p where p.id = talent_id and p.user_id = auth.uid()));
