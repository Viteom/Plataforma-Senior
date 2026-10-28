-- Backoffice: segundo factor obligatorio para el equipo y resumen del panel de inicio.

-- ── Segundo factor ──────────────────────────────────────────────────────────
-- Curaduría y administración leen datos sensibles (bienestar, fecha de nacimiento, referencias).
-- Sus permisos solo cuentan con una sesión que pasó el segundo factor (aal2 en el JWT de Supabase).
-- Con solo la clave o el código por SMS, la base los trata como una cuenta sin rol: aunque alguien
-- se salte la pantalla de entrada, RLS no le deja leer nada del equipo.
-- El gestor de campo no entra en esta regla: registra talento desde su celular y no ve bienestar.
create function public.sesion_con_segundo_factor() returns boolean
language sql stable set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

create or replace function public.mi_rol() returns rol
language sql stable security definer set search_path = public as $$
  select case
    when r.rol in ('curador', 'admin') and not public.sesion_con_segundo_factor() then null
    else r.rol
  end
  from public.user_roles r
  where r.user_id = auth.uid()
$$;

-- El rol guardado, sin importar el factor: solo sirve para mandar a cada quien a su entrada.
-- No da ningún permiso.
create function public.mi_rol_registrado() returns rol
language sql stable security definer set search_path = public as $$
  select rol from public.user_roles where user_id = auth.uid()
$$;
revoke execute on function public.mi_rol_registrado() from public, anon;
grant execute on function public.mi_rol_registrado() to authenticated;

-- ── Resumen del panel de inicio ─────────────────────────────────────────────
-- Cómo se nombra a alguien del equipo en el panel: su nombre si lo tiene, si no, su correo sin dominio.
create function public.nombre_equipo(usuario uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(u.raw_user_meta_data ->> 'nombre', ''), split_part(u.email, '@', 1), 'Alguien del equipo')
  from auth.users u
  where u.id = usuario and exists (select 1 from public.user_roles r where r.user_id = u.id and r.rol in ('curador', 'admin'))
$$;
revoke execute on function public.nombre_equipo(uuid) from public, anon, authenticated;

-- Solo cifras y nombres de organizaciones: ningún dato de una persona del talento. Leer el resumen
-- no abre casos de bienestar, así que no queda en wellbeing_access_log.
create function public.resumen_equipo() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  semana timestamptz := date_trunc('week', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
  resultado jsonb;
begin
  if not public.es_equipo() then
    raise exception 'Solo el equipo de Kánna puede ver el resumen' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'semana_desde', semana,
    'bienestar', (
      select jsonb_build_object(
        'abiertos', count(*),
        'vencidos', count(*) filter (where revision_sugerida_en < now()),
        'mas_antiguo', min(creado_en))
      from wellbeing_cases where estado <> 'cerrado'),
    'ayuda', (
      select jsonb_build_object('abiertas', count(*), 'mas_antigua', min(creado_en))
      from help_requests where estado = 'abierta'),
    'avisos', (select count(*) from notifications where estado in ('pendiente', 'omitido')),
    'condiciones', (
      select count(*) from connections
      where estado::text = 'acuerdo' and acuerdo_revisado_version is distinct from acuerdo_version),
    'personas_nuevas', (select count(*) from talent_profiles where created_at >= semana),
    'personas_publicadas', (
      select count(*) from talent_profiles where created_at >= semana and estado = 'publicado'),
    'organizaciones_verificadas', (select count(*) from companies where verificada_en >= semana),
    'conversaciones', (
      select count(*) from connections
      where conversacion_en >= semana and conversacion_en < semana + interval '7 days'),
    'acuerdos_en_curso', (select count(*) from connections where estado::text = 'en_curso'),
    'acuerdos_nuevos', (
      select count(*) from connections
      where estado::text = 'en_curso' and acuerdo_inicio >= (semana at time zone 'America/Bogota')::date),
    'semaforo', (
      select jsonb_build_object(
        'verde', count(*) filter (where semaforo = 'verde'),
        'amarillo', count(*) filter (where semaforo = 'amarillo'),
        'rojo', count(*) filter (where semaforo = 'rojo'),
        'muestra', count(*) filter (where semaforo = 'verde' and en_muestra))
      from needs where semaforo_en >= semana),
    'actividad', coalesce((
      select jsonb_agg(a order by a.en desc)
      from (
        select * from (
          select n.dignidad_en as en, 'reto_aprobado' as tipo, c.nombre as organizacion,
                 case when n.dignidad_automatica then null else public.nombre_equipo(n.dignidad_por) end as quien
          from needs n join companies c on c.id = n.company_id
          where n.dignidad_estado = 'aprobado' and n.dignidad_en is not null
          union all
          select c.verificada_en, 'organizacion_verificada', c.nombre, public.nombre_equipo(c.verificada_por)
          from companies c where c.verificada_en is not null
        ) todo
        order by en desc
        limit 5
      ) a), '[]'::jsonb)
  ) into resultado;
  return resultado;
end $$;
revoke execute on function public.resumen_equipo() from public, anon;
grant execute on function public.resumen_equipo() to authenticated;
