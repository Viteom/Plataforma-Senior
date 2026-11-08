-- Cada paso de la ruta de Emprende tiene una línea para escribir ahí mismo (por ejemplo, «Escribe
-- tu idea en una frase»). Antes había que escribirlo en un cuaderno; ahora queda guardado en Kánna.

alter table entrepreneurship_diagnostics
  add column respuestas_pasos jsonb not null default '{}'
    check (jsonb_typeof(respuestas_pasos) = 'object');

create or replace function guardar_respuesta_paso(paso text, texto text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  perfil uuid;
  fila uuid;
  limpio text := nullif(btrim(regexp_replace(coalesce(texto, ''), '\s+', ' ', 'g')), '');
  resultado jsonb;
begin
  if paso is null or paso !~ '^[a-z0-9-]{1,40}$' then
    raise exception 'paso no válido' using errcode = '22023';
  end if;
  if char_length(limpio) > 300 then
    raise exception 'respuesta muy larga' using errcode = '22023';
  end if;
  select id into perfil from talent_profiles where user_id = auth.uid();
  if perfil is null then
    raise exception 'sin permiso' using errcode = '42501';
  end if;
  select id into fila from entrepreneurship_diagnostics
    where talent_id = perfil order by creado_en desc limit 1;
  if fila is null then
    raise exception 'sin ruta' using errcode = 'P0002';
  end if;
  -- Dejarla vacía la borra.
  update entrepreneurship_diagnostics
    set respuestas_pasos = case
          when limpio is null then respuestas_pasos - paso
          else respuestas_pasos || jsonb_build_object(paso, limpio)
        end,
        actualizado_en = now()
    where id = fila
    returning respuestas_pasos into resultado;
  return resultado;
end;
$$;
revoke all on function guardar_respuesta_paso(text, text) from public, anon;
grant execute on function guardar_respuesta_paso(text, text) to authenticated;
