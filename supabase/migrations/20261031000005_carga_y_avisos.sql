-- Carga nominal al inicio del nuevo acuerdo: incluye acuerdos aceptados, no propuestas pendientes.
-- No predice capacidad, no cambia metas y no revela preferencias a las organizaciones.
create function public.previsualizar_carga(conexion uuid, version int) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
 c public.connections;
 meta public.wellbeing_preferences;
 fecha date;
 previas int;
 desconocidos int;
 pares jsonb;
 total int;
begin
 select * into c from connections where id=conexion;
 if not found or not public.es_mi_perfil(c.talent_id) then raise exception 'sin permiso' using errcode='42501';end if;
 if c.estado::text not in ('acuerdo','en_curso') or c.acuerdo_version is distinct from version then
   raise exception 'el acuerdo cambió: revísalo de nuevo' using errcode='40001';
 end if;
 select * into meta from wellbeing_preferences where talent_id=c.talent_id;
 fecha:=greatest(coalesce(c.acuerdo_inicio,(now() at time zone 'America/Bogota')::date),(now() at time zone 'America/Bogota')::date);
 select coalesce(sum(p.acuerdo_horas_semana),0)::int,
   count(*) filter(where p.acuerdo_horas_semana is null)::int,
   coalesce(jsonb_agg(jsonb_build_array(p.id,p.acuerdo_version,p.acuerdo_horas_semana,p.acuerdo_inicio) order by p.id),'[]'::jsonb)
 into previas,desconocidos,pares from connections p
 where p.talent_id=c.talent_id and p.id<>c.id and p.estado::text='en_curso'
   and coalesce(p.acuerdo_inicio,fecha)<=fecha;
 desconocidos:=desconocidos+case when c.acuerdo_horas_semana is null then 1 else 0 end;
 total:=previas+coalesce(c.acuerdo_horas_semana,0);
 return jsonb_build_object('fecha',fecha,'horas_previas',previas,'horas_nuevas',c.acuerdo_horas_semana,
   'total',total,'sin_horas',desconocidos,'limite',meta.horas_meta,
   'requiere_confirmacion',desconocidos>0 or (meta.horas_meta is not null and total>meta.horas_meta),
   'token',md5(jsonb_build_array(c.id,c.acuerdo_version,c.acuerdo_horas_semana,c.acuerdo_inicio,fecha,meta.horas_meta,meta.consentimiento_en,pares)::text));
end $$;
revoke execute on function public.previsualizar_carga(uuid,int) from public,anon;
grant execute on function public.previsualizar_carga(uuid,int) to authenticated;

-- La función anterior conserva sus validaciones de actor, etapa, revisión y versiones.
-- Se retira el permiso de acceso directo: no queda una segunda RPC que permita saltarse la carga.
alter function public.avanzar_proceso(uuid,text,jsonb) rename to avanzar_proceso_interno;
revoke execute on function public.avanzar_proceso_interno(uuid,text,jsonb) from public,anon,authenticated;
create function public.avanzar_proceso(conexion uuid, accion text, datos jsonb default '{}'::jsonb) returns text
language plpgsql security definer set search_path=public as $$
declare
 resultado text;
 c public.connections;
 carga jsonb;
begin
 if accion='aceptar_acuerdo' then
   -- Serializa aceptaciones de la misma persona para no confirmar dos cargas a la vez.
   perform pg_advisory_xact_lock(hashtextextended('carga-'||coalesce(auth.uid()::text,''),0));
   perform 1 from wellbeing_preferences w join talent_profiles p on p.id=w.talent_id
     where p.user_id=auth.uid() for update of w;
 end if;
 resultado:=public.avanzar_proceso_interno(conexion,accion,datos);
 if accion='aceptar_acuerdo' then
   select * into c from connections where id=conexion;
   carga:=public.previsualizar_carga(conexion,c.acuerdo_version);
   if (carga->>'requiere_confirmacion')::boolean then
     if datos->>'carga_token' is distinct from carga->>'token' then
       raise exception 'tu carga cambió: vuelve a revisar antes de aceptar' using errcode='40001';
     end if;
     if coalesce(datos->>'confirmar_carga','false') <> 'true' then
       raise exception 'revisa la carga y confirma tu decisión antes de aceptar' using errcode='42501';
     end if;
   end if;
 end if;
 return resultado;
end $$;
revoke execute on function public.avanzar_proceso(uuid,text,jsonb) from public,anon;
grant execute on function public.avanzar_proceso(uuid,text,jsonb) to authenticated;

-- Aviso solo cuando la versión vigente queda autorizada; volver a pulsar no duplica el aviso.
create function public.avisar_acuerdo_autorizado() returns trigger
language plpgsql security definer set search_path=public as $$
declare usuario uuid;
begin
 if new.estado::text='acuerdo' and new.acuerdo_revisado_en is not null
    and new.acuerdo_revisado_version=new.acuerdo_version
    and (old.acuerdo_revisado_en is null or old.acuerdo_revisado_version is distinct from new.acuerdo_revisado_version) then
   select user_id into usuario from talent_profiles where id=new.talent_id;
   insert into notifications(user_id,talent_id,canal,plantilla,connection_id,estado,motivo_omitido)
   values(usuario,new.talent_id,'sms','acuerdo_autorizado',new.id,
     case when usuario is null then 'omitido' else 'pendiente' end,
     case when usuario is null then 'La persona no tiene cuenta propia: llamarla.' end);
 end if;
 return new;
end $$;
create trigger acuerdo_autorizado_aviso after update on connections for each row execute function public.avisar_acuerdo_autorizado();
revoke execute on function public.avisar_acuerdo_autorizado() from public,anon,authenticated;
