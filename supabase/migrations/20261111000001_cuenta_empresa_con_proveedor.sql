-- Entrar con Google o Microsoft. Con el código por correo, el rol de organización viaja en los
-- datos del registro («rol»: «empresa») y lo asigna el trigger. Con Google o Microsoft la cuenta
-- nace sin ese dato y queda como talento. Esta función deja que una cuenta RECIÉN creada, que
-- entró desde «Entrar como empresa», pase a rol de organización.
--
-- Solo sirve en los primeros 15 minutos de la cuenta, si todavía es talento y no tiene perfil:
-- nadie puede usarla para cambiar de rol una cuenta que ya se usa, ni para llegar al equipo.
create function public.usar_cuenta_como_empresa() returns boolean
language plpgsql security definer set search_path = public as $$
declare
  creada timestamptz;
begin
  if auth.uid() is null then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  select created_at into creada from auth.users where id = auth.uid();
  if creada is null or creada < now() - interval '15 minutes' then return false; end if;
  if exists (select 1 from talent_profiles where user_id = auth.uid()) then return false; end if;
  update user_roles set rol = 'empresa' where user_id = auth.uid() and rol = 'talento';
  return found;
end
$$;
revoke execute on function public.usar_cuenta_como_empresa() from public, anon;
grant execute on function public.usar_cuenta_como_empresa() to authenticated;
