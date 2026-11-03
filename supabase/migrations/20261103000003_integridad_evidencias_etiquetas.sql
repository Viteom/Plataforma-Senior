-- A2: un objeto ya enlazado a una evidencia no se reemplaza, tampoco durante la revisión.
-- Para cambiarlo, se usa una ruta nueva; para borrarlo, primero se retira la evidencia.
-- Políticas restrictivas: otras políticas permisivas no pueden reabrir este camino.
do $$ begin
  if exists(select 1 from pg_namespace where nspname='storage') then
    execute $p$
      create policy evidencia_objeto_inmutable_borrar on storage.objects as restrictive
      for delete to authenticated using (
        bucket_id <> 'evidencias' or public.es_equipo() or not exists (
          select 1 from public.evidence e where e.archivo_path=name
        )
      )
    $p$;
    execute $p$
      create policy evidencia_objeto_inmutable_subir on storage.objects as restrictive
      for insert to authenticated with check (
        bucket_id <> 'evidencias' or public.es_equipo() or not exists (
          select 1 from public.evidence e where e.archivo_path=name
        )
      )
    $p$;
    execute $p$
      create policy evidencia_objeto_inmutable_editar on storage.objects as restrictive
      for update to authenticated using (
        bucket_id <> 'evidencias' or public.es_equipo() or not exists (
          select 1 from public.evidence e where e.archivo_path=name
        )
      ) with check (
        bucket_id <> 'evidencias' or public.es_equipo() or not exists (
          select 1 from public.evidence e where e.archivo_path=name
        )
      )
    $p$;
  end if;
end $$;

-- M3: el trigger de 20261025000002 solo normalizaba escrituras futuras. Corrige también las
-- etiquetas históricas ligadas al catálogo, conservando la opción elegida por la persona.
update public.footprint_tags f set capa=t.capa,etiqueta=t.etiqueta
  from public.taxonomy t where f.taxonomy_id=t.id
    and (f.capa,f.etiqueta) is distinct from (t.capa,t.etiqueta);

-- El texto mostrado en pantalla viaja como una precondición. Toda la decisión, incluida la
-- incorporación al catálogo, ocurre en una transacción con bloqueo de la etiqueta.
create function public.revisar_etiqueta(
  etiqueta_id uuid, decision text, etiqueta_esperada text, capa_esperada text
) returns void
language plpgsql security definer set search_path=public as $$
declare f public.footprint_tags; tax uuid; limpio text;
begin
  if not public.es_equipo() then raise exception 'solo el equipo revisa etiquetas' using errcode='42501'; end if;
  if decision is null or decision not in ('aprobar','sumar','quitar') then
    raise exception 'decisión no válida' using errcode='22023';
  end if;
  select * into f from public.footprint_tags where id=etiqueta_id for update;
  if not found or f.etiqueta is distinct from etiqueta_esperada or f.capa::text is distinct from capa_esperada then
    raise exception 'La etiqueta cambió; vuelve a revisarla' using errcode='40001';
  end if;
  if decision='quitar' then delete from public.footprint_tags where id=f.id; return; end if;
  limpio:=public.texto_normalizado(f.etiqueta);
  if limpio ~ '\m(anos|edad)\M|naci[o]|pension|jubil|\m(19|20)[0-9]{2}\M|[0-9]{5,}|@|[0-9][0-9 .()+-]{7,}[0-9]' then
    raise exception 'Tiene edad, fechas o datos de contacto. Quítala.' using errcode='22023';
  end if;
  if decision='sumar' then
    select id into tax from public.taxonomy where capa=f.capa and lower(etiqueta)=lower(f.etiqueta) limit 1;
    if tax is null then
      insert into public.taxonomy(capa,etiqueta) values(f.capa,f.etiqueta)
        on conflict(capa,etiqueta) do update set etiqueta=excluded.etiqueta returning id into tax;
    end if;
  end if;
  update public.footprint_tags set aprobada_en=now(),taxonomy_id=coalesce(tax,taxonomy_id) where id=f.id;
end $$;
revoke execute on function public.revisar_etiqueta(uuid,text,text,text) from public,anon;
grant execute on function public.revisar_etiqueta(uuid,text,text,text) to authenticated;

-- La revisión se vincula a una versión impredecible del contenido. El cliente no puede fijarla:
-- borrar y recrear una fila con el mismo id tampoco conserva su versión anterior.
alter table public.evidence add column revision uuid not null default gen_random_uuid();
create function public.sellar_revision_evidencia() returns trigger
language plpgsql security invoker set search_path=public as $$
begin
  if tg_op='INSERT' or (new.talent_id,new.tipo,new.descripcion,new.archivo_path,new.referencia_nombre,new.referencia_telefono)
    is distinct from (old.talent_id,old.tipo,old.descripcion,old.archivo_path,old.referencia_nombre,old.referencia_telefono) then
    new.revision:=gen_random_uuid();
  else new.revision:=old.revision;
  end if;
  return new;
end $$;
revoke execute on function public.sellar_revision_evidencia() from public,anon,authenticated;
create trigger sellar_revision before insert or update on public.evidence
  for each row execute function public.sellar_revision_evidencia();

create function public.revisar_evidencia(evidencia_id uuid,decision text,nota text,revision_esperada uuid) returns void
language plpgsql security definer set search_path=public as $$
declare e public.evidence; visible text;
begin
  if not public.es_equipo() then raise exception 'solo el equipo revisa evidencias' using errcode='42501'; end if;
  if decision is null or decision not in ('verificada','rechazada') or length(nota)>200 then
    raise exception 'revisión no válida' using errcode='22023';
  end if;
  select * into e from public.evidence where id=evidencia_id for update;
  if not found or e.estado <> 'pendiente' or e.revision is distinct from revision_esperada then
    raise exception 'La evidencia cambió; vuelve a revisarla' using errcode='40001';
  end if;
  if decision='verificada' then
    if char_length(trim(coalesce(nota,'')))<5 then raise exception 'Escribe lo que confirmaste' using errcode='22023'; end if;
    visible:=public.texto_normalizado(coalesce(e.descripcion,'') || ' ' || nota);
    if visible ~ '\m(anos|edad)\M|naci[o]|pension|jubil|\m(19|20)[0-9]{2}\M|[0-9]{5,}|@|[0-9][0-9 .()+-]{7,}[0-9]' then
      raise exception 'La evidencia contiene edad, fechas o datos de contacto' using errcode='22023';
    end if;
  end if;
  update public.evidence set estado=decision,nota_equipo=nullif(trim(nota),''),verificada_por=auth.uid() where id=e.id;
end $$;
revoke execute on function public.revisar_evidencia(uuid,text,text,uuid) from public,anon;
grant execute on function public.revisar_evidencia(uuid,text,text,uuid) to authenticated;
