-- Revisión de seguridad (docs/revision-seguridad.md): los tres hallazgos altos.
--   A1 · Una empresa verificada no cambia su nombre ni su NIT: eso fue lo que el equipo revisó.
--   A2 · Lo que el equipo verificó no lo cambia la persona, y las evaluaciones de empresas no se
--        borran desde la cuenta de la persona.
--   A3 · «Llámeme» sin cuenta no sirve para llenar la base: tope de largo y tope global por hora.

-- ── A1: identidad de la empresa verificada ──────────────────────────────────
-- Amplía el trigger del hito 4. Si la empresa necesita corregir su nombre o su NIT, lo hace el
-- equipo después de volver a mirar el RUES.

create or replace function public.proteger_verificacion() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.es_equipo() then
    if new.verificada_en is distinct from old.verificada_en
       or new.verificada_por is distinct from old.verificada_por
       or new.verificada_fuente is distinct from old.verificada_fuente
       or new.estado is distinct from old.estado then
      raise exception 'solo el equipo verifica empresas' using errcode = '42501';
    end if;
    if old.verificada_en is not null and (
      new.nombre is distinct from old.nombre
      or new.nit is distinct from old.nit
    ) then
      raise exception 'empresa verificada: el nombre y el NIT los cambia el equipo' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

-- ── A2: evidencias verificadas ──────────────────────────────────────────────
-- Una vez verificada, la persona solo decide si las empresas la ven (autorizada_empresas). Para
-- corregir algo agrega una evidencia nueva, que vuelve a revisión.

create or replace function public.proteger_verificacion_evidencia() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and not public.es_equipo() then
    if new.estado is distinct from old.estado
       or new.verificada_por is distinct from old.verificada_por
       or new.nota_equipo is distinct from old.nota_equipo
       or new.tipo is distinct from old.tipo then
      raise exception 'solo el equipo verifica evidencias' using errcode = '42501';
    end if;
    if old.estado = 'verificada' and (
      new.talent_id is distinct from old.talent_id
      or new.descripcion is distinct from old.descripcion
      or new.archivo_path is distinct from old.archivo_path
      or new.referencia_nombre is distinct from old.referencia_nombre
      or new.referencia_telefono is distinct from old.referencia_telefono
    ) then
      raise exception 'evidencia verificada: agregue una nueva en vez de cambiarla' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

-- La evaluación que deja una empresa al cerrar no la borra la persona. Al borrar todo el perfil
-- (Ley 1581) sí se va, en cascada.
drop policy evidencia_borrar on evidence;
create policy evidencia_borrar on evidence for delete
  using ((public.es_mi_perfil(talent_id) and tipo <> 'evaluacion') or public.es_equipo());

-- ── A3: «Llámeme» y solicitudes de ayuda ────────────────────────────────────
-- Las pantallas ya recortan el motivo a 300 letras; la base pone el tope para quien llame la API.

alter table help_requests
  add constraint motivo_corto check (length(motivo) <= 500),
  add constraint telefono_corto check (length(telefono) <= 20);

create index on help_requests (creado_en) where canal = 'llamada' and user_id is null;

create or replace function public.pedir_llamada(telefono text, franja text, motivo text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  digitos text := regexp_replace(left(coalesce(telefono, ''), 40), '\D', '', 'g');
begin
  if length(digitos) = 12 and left(digitos, 2) = '57' then digitos := substr(digitos, 3); end if;
  if digitos !~ '^3\d{9}$' then
    raise exception 'celular inválido' using errcode = '22023';
  end if;
  if franja not in ('manana', 'tarde') then
    raise exception 'franja inválida' using errcode = '22023';
  end if;
  if length(motivo) > 500 then
    raise exception 'motivo muy largo' using errcode = '22023';
  end if;
  -- Máximo 3 pedidos al día por número: evita abuso sin pedir cuenta.
  if (select count(*) from public.help_requests h
       where h.canal = 'llamada' and h.telefono = digitos and h.creado_en > now() - interval '1 day') >= 3 then
    raise exception 'ya pidió que le llamemos' using errcode = '22023';
  end if;
  -- Y 30 por hora entre todos los pedidos sin cuenta: cambiar de número no sirve para inundar la
  -- cola. Candado corto para que dos pedidos simultáneos no pasen ambos el último cupo.
  if auth.uid() is null then
    perform pg_advisory_xact_lock(hashtext('llamada-sin-cuenta'));
    if (select count(*) from public.help_requests h
         where h.canal = 'llamada' and h.user_id is null and h.creado_en > now() - interval '1 hour') >= 30 then
      raise exception 'muchos pedidos sin cuenta en la última hora' using errcode = '22023';
    end if;
  end if;
  insert into public.help_requests (user_id, canal, motivo, telefono, franja)
  values (auth.uid(), 'llamada', coalesce(nullif(trim(motivo), ''), 'Pidió que le llamemos.'), digitos, franja);
end
$$;
