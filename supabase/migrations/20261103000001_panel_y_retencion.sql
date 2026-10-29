-- Etapa 0 de la arquitectura (documento «Arquitectura de Kánna»): menos idas y vueltas a la base
-- y limpieza automática de lo que no tiene motivo para quedarse.

-- ── El panel del equipo en una sola llamada ─────────────────────────────────
-- Antes cada pantalla del equipo hacía unas 13 consultas para el menú y el inicio (10 conteos, el
-- resumen, el rol y la cuenta). Ahora es una. Solo cifras: ningún dato de una persona del talento.
create function public.panel_equipo() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.es_equipo() then
    raise exception 'Solo el equipo de Kánna puede ver el resumen' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'rol', public.mi_rol(),
    'nombre', (select nullif(split_part(raw_user_meta_data ->> 'nombre', ' ', 1), '') from auth.users where id = auth.uid()),
    'resumen', public.resumen_equipo(),
    'conteos', jsonb_build_object(
      'necesidades', (select count(*) from needs where estado = 'en_curaduria'),
      'empresas', (select count(*) from companies where verificada_en is null),
      'evidencias', (select count(*) from evidence where estado = 'pendiente'),
      'reportes', (select count(*) from company_reports where estado = 'abierto'),
      'ayuda', (select count(*) from help_requests where estado = 'abierta'),
      'avisos', (select count(*) from notifications where estado in ('pendiente', 'omitido')),
      'cotizaciones', (select count(*) from experience_requests where estado = 'recibida'),
      'etiquetas', (select count(*) from footprint_tags where confirmada and taxonomy_id is null and aprobada_en is null),
      'amarillos', (select count(*) from needs where dignidad_estado = 'pendiente' and semaforo = 'amarillo'),
      'muestra', (select count(*) from needs where en_muestra)
    )
  );
end $$;
revoke execute on function public.panel_equipo() from public, anon;
grant execute on function public.panel_equipo() to authenticated;

-- ── Retención de datos ──────────────────────────────────────────────────────
-- Plazos de la tabla de retención (por revisar con asesoría legal, Ley 1581). Lo que pertenece a la
-- persona (perfil, huella, evidencias, bienestar) se queda mientras tenga cuenta y se borra con ella.
--   intentos de código para entrar ...... 24 horas
--   avisos por SMS enviados o fallidos .. 90 días (los que esperan a una persona no se tocan)
--   solicitudes de ayuda cerradas ....... 1 año
--   invitaciones vencidas o canceladas .. 30 días
--   registro de uso de IA ............... 90 días (los topes diarios solo miran 24 horas)
--   lecturas de casos de bienestar ...... 2 años
--   lecturas de datos privados .......... 2 años
create function public.limpiar_datos_vencidos() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  n_otp int; n_avisos int; n_ayuda int; n_invitaciones int; n_ia int; n_bienestar int; n_privados int;
begin
  delete from otp_attempts where creado_en < now() - interval '24 hours';
  get diagnostics n_otp = row_count;
  delete from notifications where estado in ('enviado', 'fallido') and creado_en < now() - interval '90 days';
  get diagnostics n_avisos = row_count;
  delete from help_requests where estado = 'cerrada' and creado_en < now() - interval '1 year';
  get diagnostics n_ayuda = row_count;
  delete from company_invitations
  where (cancelada_en is not null or (aceptada_en is null and vence_en < now()))
    and creado_en < now() - interval '30 days';
  get diagnostics n_invitaciones = row_count;
  delete from ia_usos where creado_en < now() - interval '90 days';
  get diagnostics n_ia = row_count;
  delete from wellbeing_access_log where en < now() - interval '2 years';
  get diagnostics n_bienestar = row_count;
  delete from private_access_log where visto_en < now() - interval '2 years';
  get diagnostics n_privados = row_count;
  return jsonb_build_object(
    'intentos_codigo', n_otp, 'avisos', n_avisos, 'ayudas', n_ayuda, 'invitaciones', n_invitaciones,
    'usos_ia', n_ia, 'lecturas_bienestar', n_bienestar, 'lecturas_privadas', n_privados);
end $$;
-- Nadie la llama desde la app: solo la tarea programada.
revoke execute on function public.limpiar_datos_vencidos() from public, anon, authenticated;

-- Todos los días a las 3:15 a. m. de Colombia (8:15 UTC). pg_cron viene con Supabase; donde no
-- existe (las pruebas locales) la tarea simplemente no se programa.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('kanna-limpieza-diaria', '15 8 * * *', 'select public.limpiar_datos_vencidos()');
  end if;
end $$;
