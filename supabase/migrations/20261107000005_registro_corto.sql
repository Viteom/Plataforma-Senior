-- Registro más corto (prueba con usuarios, 7 nov 2026).
--
-- 1. Datos privados nuevos: cédula, país, ciudad donde quiere trabajar, sexo (opcional) y cómo le
--    gusta trabajar (de pie o con silla, hasta dónde se mueve). Viven en talent_private: ninguna
--    organización los ve y no entran al emparejamiento (regla 1). No son datos de salud: son
--    preferencias de trabajo que la persona cuenta si quiere.
-- 2. Oficios que siempre son presenciales (cuidado, aseo, cocina, obra…): la lista la mantiene el
--    equipo desde el panel. Con uno de esos oficios no se ofrece trabajo desde la casa, salvo las
--    mentorías y los talleres si la persona lo activa.
-- 3. La huella separa «mi experiencia» (la historia) de «mi talento» (lo que le sale bien).

alter table talent_private
  add column cedula text check (cedula ~ '^[A-Za-z0-9]{4,15}$'),
  add column pais text check (char_length(pais) between 2 and 60),
  add column ciudad_trabajo text check (char_length(ciudad_trabajo) between 2 and 80),
  add column sexo text check (sexo in ('hombre', 'mujer', 'otro', 'no_dice')),
  add column postura text check (postura in ('de_pie', 'con_silla', 'igual')),
  add column movilidad text check (movilidad in ('toda_la_ciudad', 'cerca', 'sin_desplazarme'));

-- La persona guarda sus datos del registro. Solo los suyos; vacío deja el dato en blanco.
create function public.guardar_datos_registro(
  cedula text default null,
  pais text default null,
  ciudad_trabajo text default null,
  sexo text default null,
  postura text default null,
  movilidad text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  perfil uuid;
  v_cedula text := nullif(regexp_replace(coalesce(cedula, ''), '[\s.\-]', '', 'g'), '');
  v_pais text := nullif(btrim(coalesce(pais, '')), '');
  v_ciudad text := nullif(btrim(coalesce(ciudad_trabajo, '')), '');
begin
  select id into perfil from talent_profiles where user_id = auth.uid();
  if perfil is null then raise exception 'sin permiso' using errcode = '42501'; end if;
  if v_cedula is not null and v_cedula !~ '^[A-Za-z0-9]{4,15}$' then
    raise exception 'cédula no válida' using errcode = '22023';
  end if;
  if sexo is not null and sexo not in ('hombre', 'mujer', 'otro', 'no_dice') then
    raise exception 'sexo no válido' using errcode = '22023';
  end if;
  if postura is not null and postura not in ('de_pie', 'con_silla', 'igual') then
    raise exception 'postura no válida' using errcode = '22023';
  end if;
  if movilidad is not null and movilidad not in ('toda_la_ciudad', 'cerca', 'sin_desplazarme') then
    raise exception 'movilidad no válida' using errcode = '22023';
  end if;
  insert into talent_private as t (talent_id, cedula, pais, ciudad_trabajo, sexo, postura, movilidad)
  values (perfil, v_cedula, left(v_pais, 60), left(v_ciudad, 80), sexo, postura, movilidad)
  on conflict (talent_id) do update set
    cedula = excluded.cedula,
    pais = excluded.pais,
    ciudad_trabajo = excluded.ciudad_trabajo,
    sexo = excluded.sexo,
    postura = excluded.postura,
    movilidad = excluded.movilidad;
end
$$;
revoke execute on function public.guardar_datos_registro(text, text, text, text, text, text) from public, anon;
grant execute on function public.guardar_datos_registro(text, text, text, text, text, text) to authenticated;

-- La persona ve lo que contó (para su descarga de datos y para cambiarlo). Nadie más por la API.
create function public.mis_datos_registro()
returns table (cedula text, pais text, ciudad_trabajo text, sexo text, postura text, movilidad text)
language sql stable security definer set search_path = public as $$
  select t.cedula, t.pais, t.ciudad_trabajo, t.sexo, t.postura, t.movilidad
  from talent_private t
  join talent_profiles p on p.id = t.talent_id
  where p.user_id = auth.uid()
$$;
revoke execute on function public.mis_datos_registro() from public, anon;
grant execute on function public.mis_datos_registro() to authenticated;

-- Oficios que siempre se hacen en persona. «palabra» es un pedazo del oficio en minúscula y sin
-- tildes («cuidad» reconoce «cuidado», «cuidadora», «cuidador»).
create table oficios_presenciales (
  id bigint generated always as identity primary key,
  palabra text not null unique check (palabra ~ '^[a-z ]{3,40}$'),
  creado_por uuid references auth.users on delete set null,
  creado_en timestamptz not null default now()
);
alter table oficios_presenciales enable row level security;

-- No es un dato personal: el formulario de registro la necesita para no ofrecer trabajo desde la casa.
create policy "oficios presenciales: todos leen" on oficios_presenciales
  for select to anon, authenticated using (true);
create policy "oficios presenciales: el equipo agrega" on oficios_presenciales
  for insert to authenticated with check (public.es_equipo());
create policy "oficios presenciales: el equipo quita" on oficios_presenciales
  for delete to authenticated using (public.es_equipo());
grant select on oficios_presenciales to anon, authenticated;
grant insert, delete on oficios_presenciales to authenticated;

insert into oficios_presenciales (palabra) values
  ('cuidad'), ('enfermer'), ('servicios generales'), ('aseo'), ('limpieza'), ('oficios varios'),
  ('empleada domestica'), ('cocin'), ('chef'), ('meser'), ('mantenimiento'),
  ('construccion'), ('obra'), ('albanil'), ('electricista'), ('plomer'),
  ('jardin'), ('agricult'), ('cultiv'), ('ganader'), ('finca'), ('conduct'), ('chofer'),
  ('taxista'), ('mecanic'), ('taller mecanico'), ('vigilan'), ('seguridad privada'),
  ('peluquer'), ('manicur'), ('carpinter'), ('soldad');

-- La historia (mi experiencia) y, aparte, lo que le sale bien (mi talento).
alter table stories
  add column talento text check (char_length(talento) <= 300);
