-- También las contrataciones nacidas desde Explorar necesitan acompañamiento: no basta verificar
-- la empresa. La autorización corresponde a una versión concreta del acuerdo, sin datos clínicos.
alter table connections
 add column acuerdo_revisado_version int,
 add column acuerdo_revisado_por uuid references auth.users,
 add column acuerdo_revisado_en timestamptz;
create function public.exigir_acuerdo_revisado() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if tg_op='UPDATE' and (new.acuerdo_version,new.acuerdo_forma,new.acuerdo_horas_semana,new.acuerdo_valor,new.acuerdo_unidad,new.acuerdo_inicio,new.acuerdo_nota) is distinct from
 (old.acuerdo_version,old.acuerdo_forma,old.acuerdo_horas_semana,old.acuerdo_valor,old.acuerdo_unidad,old.acuerdo_inicio,old.acuerdo_nota) then
  new.acuerdo_revisado_version:=null;new.acuerdo_revisado_por:=null;new.acuerdo_revisado_en:=null;
 end if;
 if new.estado::text='en_curso' and (tg_op='INSERT' or old.estado::text<>'en_curso') then
  if new.acuerdo_revisado_version is distinct from new.acuerdo_version or new.acuerdo_revisado_por is null or new.acuerdo_revisado_en is null then
   raise exception 'Kánna debe revisar las condiciones antes de empezar' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
-- Su orden va después del trigger que incrementa acuerdo_version: se comprueba al aceptar,
-- cuando la versión del acuerdo ya está establecida.
create trigger conexion_revision_acuerdo before insert or update on connections for each row execute function public.exigir_acuerdo_revisado();
revoke execute on function public.exigir_acuerdo_revisado() from public,anon,authenticated;
create function public.autorizar_acuerdo(conexion uuid, version int) returns void language plpgsql security definer set search_path=public as $$
begin
 if not public.es_equipo() then raise exception 'sin permiso' using errcode='42501';end if;
 update connections set acuerdo_revisado_version=acuerdo_version,acuerdo_revisado_por=auth.uid(),acuerdo_revisado_en=now()
 where id=conexion and estado::text='acuerdo' and acuerdo_version=version;
 if not found then raise exception 'el acuerdo cambió: vuelve a revisarlo' using errcode='22023';end if;
end $$;
revoke execute on function public.autorizar_acuerdo(uuid,int) from public,anon;
grant execute on function public.autorizar_acuerdo(uuid,int) to authenticated;

create or replace view company_connections_view with (security_barrier) as
select
  c.id, c.talent_id, c.need_id, c.origen, c.creado_en, c.actualizado_en,
  case
    when c.estado::text = 'enviada_talento' then 'esperando'
    when c.estado::text = 'descarta' then 'no_disponible'
    when public.sin_respuesta(c.estado::text, c.actualizado_en) then 'sin_respuesta'
    when c.estado::text = 'visible_empresa' then 'le_interesa'
    else c.estado::text
  end as estado,
  case when c.estado::text = 'visible_empresa'
    then (now()::date - c.actualizado_en::date) end as dias_esperando,
  case when c.estado::text in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso', 'cerrada')
    then c.puntaje end as puntaje,
  case when c.estado::text in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso', 'cerrada')
    then c.desglose end as desglose,
  case when c.estado::text in ('visible_empresa', 'abierta', 'conversacion', 'acuerdo', 'en_curso', 'cerrada')
    then c.razon_curador end as razon_curador,
  c.evaluacion_empresa,
  c.conversacion_en, c.conversacion_modo, c.conversacion_confirmada,
  c.acuerdo_forma, c.acuerdo_horas_semana, c.acuerdo_valor, c.acuerdo_unidad, c.acuerdo_inicio, c.acuerdo_nota,
  c.acuerdo_aceptado_en,
  c.cierre_tipo, c.cerrada_por,
  case when c.cerrada_por = 'empresa' then c.motivo_cierre end as motivo_cierre,
  c.acuerdo_version, c.conversacion_version, c.acuerdo_revisado_en
from connections c
where c.company_id = public.mi_empresa()
  and c.estado::text not in ('propuesta', 'elegida')
  and not (c.origen = 'problema' and c.estado::text in ('enviada_talento', 'descarta'));

create or replace view talent_opportunities_view with (security_barrier) as
select
  c.id, c.origen,
  case when public.sin_respuesta(c.estado::text, c.actualizado_en) then 'sin_respuesta' else c.estado::text end as estado,
  c.creado_en, c.actualizado_en, c.evaluacion_talento,
  co.nombre as empresa, co.sector, co.ciudad,
  (co.verificada_en is not null) as empresa_verificada,
  n.problema, n.formatos, n.modalidad,
  c.conversacion_en, c.conversacion_modo, c.conversacion_confirmada,
  c.acuerdo_forma, c.acuerdo_horas_semana, c.acuerdo_valor, c.acuerdo_unidad, c.acuerdo_inicio, c.acuerdo_nota,
  c.acuerdo_aceptado_en,
  c.cierre_tipo, c.cerrada_por,
  case when c.cerrada_por = 'empresa' then c.motivo_cierre end as motivo_cierre,
  c.acuerdo_version, c.conversacion_version, c.acuerdo_revisado_en
from connections c
join companies co on co.id = c.company_id
left join needs n on n.id = c.need_id
where public.es_mi_perfil(c.talent_id)
  and c.estado::text not in ('propuesta', 'elegida');
