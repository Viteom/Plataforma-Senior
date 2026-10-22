-- Huella para todos los oficios (observación del 21 oct 2026: una tejedora o un ebanista no
-- encontraban opciones). Tres cambios:
-- 1. Más etiquetas para oficios, talleres y trabajo independiente.
-- 2. La persona puede escribir una etiqueta con sus palabras. Esa etiqueta no llega a las
--    empresas hasta que el equipo la aprueba (también cierra M3 de docs/revision-seguridad.md:
--    una etiqueta libre podía llevar un celular o la edad).
-- 3. Una etiqueta de la lista siempre muestra el texto de la lista: nadie puede ponerle otro
--    texto a un taxonomy_id para saltarse la revisión.

insert into taxonomy (capa, etiqueta, sinonimos, sector) values
  ('situaciones', 'Pedido grande entregado a tiempo', '{"cumplir un pedido","entrega a tiempo"}', null),
  ('situaciones', 'Reclamo de un cliente resuelto', '{"cliente inconforme","queja de un cliente"}', null),
  ('situaciones', 'Negocio propio sacado adelante', '{"emprendimiento","mi propio negocio"}', null),
  ('situaciones', 'Reparación que nadie sabía hacer', '{"arreglar lo difícil","reparación difícil"}', null),
  ('situaciones', 'Trabajo a la medida del cliente', '{"encargo especial","diseño a la medida"}', null),
  ('situaciones', 'Clientes nuevos conseguidos', '{"conseguir clientes","vender más"}', null),
  ('situaciones', 'Trabajo con materiales escasos', '{"falta de material","conseguir materiales"}', null),
  ('situaciones', 'Precio justo para el trabajo', '{"calcular precios","cobrar bien"}', null),
  ('situaciones', 'Restauración de piezas antiguas', '{"restaurar muebles","restaurar"}', 'artesania'),

  ('contexto', 'Por mi cuenta, independiente', '{"independiente","trabajo solo","trabajo sola"}', null),
  ('contexto', 'Taller propio', '{"mi taller"}', null),
  ('contexto', 'Negocio propio', '{"mi negocio","emprendimiento"}', null),
  ('contexto', 'Desde la casa', '{"en casa","trabajo en casa"}', null),
  ('contexto', 'Asociación de artesanos', '{"colectivo","grupo de artesanas"}', 'artesania'),
  ('contexto', 'Ferias y mercados', '{"plaza de mercado","feria artesanal"}', null),
  ('contexto', 'Casas de familia', '{"hogares"}', null),
  ('contexto', 'Comunidad o barrio', '{"junta de acción comunal","vereda"}', null),

  ('escala', 'Trabajo individual', '{"solo","sola"}', null),
  ('escala', 'Con 1 a 5 ayudantes', '{"pocos ayudantes"}', null),
  ('escala', 'Pedidos de muchas unidades', '{"producción en serie","pedidos grandes"}', null),
  ('escala', 'Piezas únicas por encargo', '{"trabajo por encargo"}', null),

  ('oficio', 'Ebanistería y carpintería', '{"carpintero","ebanista","muebles"}', 'artesania'),
  ('oficio', 'Costura y confección', '{"modista","sastre","costurera"}', null),
  ('oficio', 'Mecánica automotriz', '{"mecánico","taller de motos"}', null),
  ('oficio', 'Panadería y repostería', '{"panadero","repostera"}', 'alimentos'),
  ('oficio', 'Peluquería y belleza', '{"peluquera","barbero","manicurista"}', null),
  ('oficio', 'Plomería', '{"plomero","fontanero"}', null),
  ('oficio', 'Soldadura y metalistería', '{"soldador","ornamentación"}', null),
  ('oficio', 'Cerámica y alfarería', '{"barro","alfarera"}', 'artesania'),
  ('oficio', 'Joyería y bisutería', '{"joyero","orfebre"}', 'artesania'),
  ('oficio', 'Marroquinería y calzado', '{"zapatero","cuero"}', 'artesania'),
  ('oficio', 'Cestería y fibras naturales', '{"iraca","caña flecha","tejido en fibra"}', 'artesania'),
  ('oficio', 'Jardinería', '{"jardinero","vivero"}', null),
  ('oficio', 'Conducción y transporte', '{"conductor","chofer"}', null),
  ('oficio', 'Pintura y acabados', '{"pintor de casas","acabados"}', 'construccion'),

  ('normas', 'Manipulación de alimentos', '{"curso de manipulación"}', 'alimentos'),
  ('normas', 'Licencia de conducción', '{"pase"}', null),
  ('normas', 'Sello de calidad artesanal', '{"hecho a mano","artesanías de colombia"}', 'artesania'),
  ('normas', 'Trabajo en alturas', '{"curso de alturas"}', null),
  ('normas', 'Normas de bioseguridad', '{"protocolos de bioseguridad"}', null),

  ('transferir', 'Enseñó a aprendices en el taller', '{"aprendiz","aprendices"}', null),
  ('transferir', 'Enseñó el oficio en la familia', '{"enseñar a los hijos"}', null),
  ('transferir', 'Dio clases en la comunidad', '{"clases en el barrio"}', null)
on conflict (capa, etiqueta) do nothing;

alter table footprint_tags
  add column aprobada_en timestamptz,
  add constraint etiqueta_largo check (char_length(etiqueta) between 2 and 80) not valid;

-- Solo el equipo aprueba. Si la persona cambia el texto, vuelve a revisión. Una etiqueta de la
-- lista toma siempre su texto y su capa de la lista.
create or replace function public.proteger_etiqueta()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  canonica record;
begin
  if new.taxonomy_id is not null then
    select capa, etiqueta into canonica from public.taxonomy where id = new.taxonomy_id;
    if found then
      new.capa := canonica.capa;
      new.etiqueta := canonica.etiqueta;
    end if;
  end if;

  if current_user in ('anon', 'authenticated') and not public.es_equipo() then
    if tg_op = 'INSERT' then
      new.aprobada_en := null;
    elsif new.etiqueta is distinct from old.etiqueta or new.capa is distinct from old.capa then
      new.aprobada_en := null;
    else
      new.aprobada_en := old.aprobada_en;
    end if;
  end if;
  return new;
end;
$$;

create trigger proteger_etiqueta before insert or update on footprint_tags
  for each row execute function public.proteger_etiqueta();

revoke execute on function public.proteger_etiqueta() from public, anon, authenticated;

-- Igual que antes, pero la huella solo lleva etiquetas de la lista o aprobadas por el equipo.
create or replace view company_talent_view with (security_barrier) as
with revelado as (
  select distinct talent_id from public.connections
  where company_id = public.mi_empresa() and estado::text in ('abierta', 'cerrada')
)
select
  p.id,
  p.visibilidad,
  (p.visibilidad = 'visible' or r.talent_id is not null) as identidad_visible,
  case when p.visibilidad = 'visible' or r.talent_id is not null then p.nombre end as nombre,
  case when p.visibilidad = 'visible' or r.talent_id is not null then p.foto_path end as foto_path,
  case when p.visibilidad = 'visible' or r.talent_id is not null then p.resumen end as resumen,
  p.oficio,
  p.ubicacion,
  coalesce(
    (select jsonb_agg(jsonb_build_object('capa', t.capa, 'etiqueta', t.etiqueta) order by t.capa, t.etiqueta)
       from footprint_tags t
      where t.talent_id = p.id and t.confirmada and (t.taxonomy_id is not null or t.aprobada_en is not null)),
    '[]'::jsonb
  ) as huella,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
        'tipo', o.tipo, 'horas_semana', o.horas_semana, 'modalidad', o.modalidad,
        -- Rango alrededor de la tarifa, redondeado a miles: la empresa nunca ve el número exacto.
        'rango_min', case when o.tarifa_esperada > 0 then floor(o.tarifa_esperada * 0.85 / 1000) * 1000 end,
        'rango_max', case when o.tarifa_esperada > 0 then ceil(o.tarifa_esperada * 1.15 / 1000) * 1000 end))
       from talent_offers o where o.talent_id = p.id),
    '[]'::jsonb
  ) as ofertas,
  (select count(*) from evidence e where e.talent_id = p.id and e.estado = 'verificada' and e.autorizada_empresas) as evidencias
from talent_profiles p
left join revelado r on r.talent_id = p.id
where p.estado = 'publicado'
  and public.mi_rol() in ('empresa', 'curador', 'admin');

revoke all on company_talent_view from anon, authenticated;
grant select on company_talent_view to authenticated;

-- La persona puede quitar o cambiar su foto (antes solo podía subirla). Se salta donde no
-- existe storage (pruebas).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    execute $p$
      create policy fotos_borrar on storage.objects for delete to authenticated
      using (bucket_id = 'fotos' and public.es_mi_perfil(((storage.foldername(name))[1])::uuid))
    $p$;
  end if;
end
$$;
