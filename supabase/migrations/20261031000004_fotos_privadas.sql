-- Defensa en la base además de la comprobación previa a firmar en el servidor.
-- Se conserva todo objeto de Storage; no se borra un archivo ajeno para limpiar una referencia.
create function public.ruta_foto_valida(perfil uuid, ruta text) returns boolean
language sql immutable set search_path=public as $$
 select ruta is not null and split_part(ruta,'/',1)=perfil::text
   and substr(ruta,38) ~ '^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$'
$$;
update talent_profiles set foto_path=null where foto_path is not null and not public.ruta_foto_valida(id,foto_path);
alter table talent_profiles add constraint foto_del_perfil check (foto_path is null or public.ruta_foto_valida(id,foto_path));
