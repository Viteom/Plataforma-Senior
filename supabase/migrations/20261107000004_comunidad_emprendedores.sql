-- Comunidad de emprendedores (prueba con usuarios, 7 nov 2026): quien llena Emprende queda en un
-- grupo interno, clasificado por tipo de negocio, para que el equipo le comparta ferias, lugares
-- para vender y oportunidades. Es interno: ninguna organización lo ve. Los contactos solo salen
-- para quien aceptó recibir esas oportunidades, y cada consulta queda registrada.

alter table entrepreneurship_diagnostics
  add column categoria text check (categoria in (
    'artesanias', 'comida', 'confeccion', 'campo', 'belleza', 'hogar', 'comercio', 'otro'
  )),
  add column quiere_oportunidades boolean not null default false;

-- El grupo: el diagnóstico más reciente de cada persona. Solo el equipo.
create or replace function comunidad_emprendedores()
returns table (
  talent_id uuid,
  nombre text,
  ubicacion text,
  categoria text,
  etapa text,
  idea text,
  quiere_asesoria boolean,
  quiere_oportunidades boolean,
  pasos_hechos int,
  actualizado_en timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_equipo() then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  return query
    select distinct on (d.talent_id)
      d.talent_id, p.nombre, p.ubicacion, d.categoria, d.etapa, d.idea, d.quiere_asesoria,
      d.quiere_oportunidades, coalesce(array_length(d.pasos_hechos, 1), 0), d.actualizado_en
    from entrepreneurship_diagnostics d
    join talent_profiles p on p.id = d.talent_id
    order by d.talent_id, d.creado_en desc;
end;
$$;
revoke all on function comunidad_emprendedores() from public, anon;
grant execute on function comunidad_emprendedores() to authenticated;

-- Contactos para compartir una feria u oportunidad: solo de quien aceptó, con motivo obligatorio
-- y registro por persona (como ver_datos_privados).
create or replace function contactos_comunidad(cat text, motivo text)
returns table (nombre text, celular text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_equipo() then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  if coalesce(btrim(motivo), '') = '' then
    raise exception 'motivo obligatorio' using errcode = '22023';
  end if;
  return query
    with elegidos as (
      select c.talent_id, c.nombre, u.phone as celular
      from public.comunidad_emprendedores() c
      join talent_profiles p on p.id = c.talent_id
      join auth.users u on u.id = p.user_id
      where c.quiere_oportunidades and (cat is null or c.categoria = cat) and u.phone is not null
    ), registro as (
      insert into private_access_log (talent_id, visto_por, motivo)
      select e.talent_id, auth.uid(), 'Comunidad de emprendedores: ' || btrim(motivo) from elegidos e
      returning 1
    )
    select e.nombre, e.celular from elegidos e
    where (select count(*) from registro) >= 0
    order by e.nombre;
end;
$$;
revoke all on function contactos_comunidad(text, text) from public, anon;
grant execute on function contactos_comunidad(text, text) to authenticated;
