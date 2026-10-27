-- Todos los retos, incluidos los existentes, requieren revisión antes de nuevos envíos.
alter table needs
 add column revision_version bigint not null default 1,
 add column jornada_horas int check (jornada_horas between 1 and 48),
 add column remuneracion numeric check (remuneracion between 1 and 1000000000),
 add column remuneracion_unidad text check (remuneracion_unidad in ('hora','mes','proyecto')),
 add column condiciones text check (length(condiciones) between 20 and 1500),
 add column dignidad_estado text not null default 'pendiente' check (dignidad_estado in ('pendiente','aprobado','ajustes')),
 add column dignidad_por uuid references auth.users,
 add column dignidad_en timestamptz;
create function public.proteger_revision_reto() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if current_user in ('anon','authenticated') and not public.es_equipo() then
   if new.dignidad_estado <> 'pendiente' or new.dignidad_por is not null or new.dignidad_en is not null then
     raise exception 'solo Kánna autoriza las condiciones del reto' using errcode='42501';
   end if;
 end if;
 if tg_op='UPDATE' and (new.company_id,new.problema,new.jornada_horas,new.remuneracion,new.remuneracion_unidad,new.condiciones,new.formatos,new.modalidad,new.ubicacion) is distinct from
 (old.company_id,old.problema,old.jornada_horas,old.remuneracion,old.remuneracion_unidad,old.condiciones,old.formatos,old.modalidad,old.ubicacion) then
   new.revision_version:=old.revision_version+1;
   new.dignidad_estado:='pendiente';new.dignidad_por:=null;new.dignidad_en:=null;
 end if;
 if new.dignidad_estado='aprobado' and (new.jornada_horas is null or new.remuneracion is null or new.remuneracion_unidad is null or new.condiciones is null or new.dignidad_por is null or new.dignidad_en is null) then
   raise exception 'faltan las condiciones y la revisión del reto' using errcode='22023';
 end if;
 return new;
end $$;
create trigger revision_reto before insert or update on needs for each row execute function public.proteger_revision_reto();
revoke execute on function public.proteger_revision_reto() from public,anon,authenticated;

create function public.autorizar_reto(reto uuid, aprobado boolean, version bigint) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.es_equipo() then raise exception 'sin permiso' using errcode='42501';end if;
 update needs set dignidad_estado=case when aprobado then 'aprobado' else 'ajustes' end,
 dignidad_por=auth.uid(),dignidad_en=now() where id=reto and revision_version=version;
 if not found then raise exception 'el reto cambió: vuelve a revisarlo' using errcode='22023';end if;
end $$;
revoke execute on function public.autorizar_reto(uuid,boolean,bigint) from public,anon;
grant execute on function public.autorizar_reto(uuid,boolean,bigint) to authenticated;

create function public.exigir_reto_digno() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.estado::text='enviada_talento' and (tg_op='INSERT' or old.estado::text<>'enviada_talento' or new.need_id is distinct from old.need_id) and new.need_id is not null then
   if not exists(select 1 from needs n where n.id=new.need_id and n.company_id=new.company_id and n.dignidad_estado='aprobado') then
     raise exception 'Kánna debe autorizar las condiciones del reto antes de enviarlo' using errcode='42501';
   end if;
 end if;
 return new;
end $$;
create trigger conexion_reto_digno before insert or update on connections for each row execute function public.exigir_reto_digno();
revoke execute on function public.exigir_reto_digno() from public,anon,authenticated;

-- Cambiar los requisitos también invalida la revisión del reto.
create function public.revisar_cambio_requisitos() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op <> 'INSERT' then
   update needs set dignidad_estado='pendiente', dignidad_por=null,dignidad_en=null,revision_version=revision_version+1 where id=old.need_id;
 end if;
 if tg_op <> 'DELETE' then
   update needs set dignidad_estado='pendiente', dignidad_por=null,dignidad_en=null,revision_version=revision_version+1 where id=new.need_id;
 end if;
 return null;
end $$;
create trigger requisito_revision after insert or update or delete on need_requirements for each row execute function public.revisar_cambio_requisitos();
revoke execute on function public.revisar_cambio_requisitos() from public,anon,authenticated;
