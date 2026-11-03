-- S04: la retención de una operación terminada empieza al terminar, no al crear la fila.
alter table public.help_requests add column cerrada_en timestamptz;
alter table public.notifications add column finalizada_en timestamptz;

-- No se inventan cierres históricos. Si no hay fecha fiable se conserva el plazo completo
-- desde esta migración. Para avisos enviados sí existe enviado_en.
update public.help_requests set cerrada_en=now() where estado='cerrada';
update public.notifications set finalizada_en=coalesce(least(enviado_en,now()),now())
  where estado in ('enviado','fallido');

create function public.fecha_cierre_ayuda() returns trigger
language plpgsql security invoker set search_path=public as $$
begin
  if new.estado <> 'cerrada' then new.cerrada_en:=null;
  elsif current_user not in ('anon','authenticated') and new.cerrada_en is not null
    and (tg_op='INSERT' or new.cerrada_en is distinct from old.cerrada_en) then null;
  elsif tg_op='INSERT' or old.estado <> 'cerrada' then new.cerrada_en:=now();
  else new.cerrada_en:=old.cerrada_en;
  end if;
  return new;
end $$;
create trigger fecha_cierre before insert or update on public.help_requests
  for each row execute function public.fecha_cierre_ayuda();

create function public.fecha_fin_aviso() returns trigger
language plpgsql security invoker set search_path=public as $$
begin
  if new.estado not in ('enviado','fallido') then new.finalizada_en:=null;
  elsif current_user not in ('anon','authenticated') and new.finalizada_en is not null
    and (tg_op='INSERT' or new.finalizada_en is distinct from old.finalizada_en) then null;
  elsif tg_op='INSERT' or new.estado is distinct from old.estado then new.finalizada_en:=now();
  else new.finalizada_en:=old.finalizada_en;
  end if;
  return new;
end $$;
create trigger fecha_fin before insert or update on public.notifications
  for each row execute function public.fecha_fin_aviso();
revoke execute on function public.fecha_cierre_ayuda(),public.fecha_fin_aviso() from public,anon,authenticated;

create or replace function public.limpiar_datos_vencidos() returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  n_otp int; n_avisos int; n_ayuda int; n_invitaciones int; n_ia int; n_bienestar int; n_privados int;
begin
  delete from public.otp_attempts where creado_en < now()-interval '24 hours';
  get diagnostics n_otp = row_count;
  delete from public.notifications where estado in ('enviado','fallido') and finalizada_en < now()-interval '90 days';
  get diagnostics n_avisos = row_count;
  delete from public.help_requests where estado='cerrada' and cerrada_en < now()-interval '1 year';
  get diagnostics n_ayuda = row_count;
  delete from public.company_invitations where
    (cancelada_en is not null and cancelada_en < now()-interval '30 days')
    or (aceptada_en is null and cancelada_en is null and vence_en < now()-interval '30 days');
  get diagnostics n_invitaciones = row_count;
  delete from public.ia_usos where creado_en < now()-interval '90 days';
  get diagnostics n_ia = row_count;
  delete from public.wellbeing_access_log where en < now()-interval '2 years';
  get diagnostics n_bienestar = row_count;
  delete from public.private_access_log where visto_en < now()-interval '2 years';
  get diagnostics n_privados = row_count;
  return jsonb_build_object('intentos_codigo',n_otp,'avisos',n_avisos,'ayudas',n_ayuda,
    'invitaciones',n_invitaciones,'usos_ia',n_ia,'lecturas_bienestar',n_bienestar,'lecturas_privadas',n_privados);
end $$;
revoke execute on function public.limpiar_datos_vencidos() from public,anon,authenticated;
-- La tarea cron existente conserva el mismo nombre y llama a esta definición. No se programa otra.
