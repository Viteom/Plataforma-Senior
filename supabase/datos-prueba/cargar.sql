-- Datos ficticios para recorrer la plataforma de punta a punta. Todo lleva «(prueba)» en el nombre
-- y los correos terminan en @prueba.invalid, así se ven y se borran fácil (borrar.sql).
--
-- Antes de correrlo: cambie CORREO-DE-LA-PERSONA por el correo con el que entró como talento.
-- Ese perfil recibe 3 oportunidades. Se corre en Supabase → SQL Editor (o por el MCP).

-- 1. Dueños ficticios de las empresas (no pueden entrar: el dominio .invalid no recibe correos).
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values
  ('a0000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'muebles@prueba.invalid', '{"rol":"empresa"}', '{"provider":"email"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'hotel@prueba.invalid', '{"rol":"empresa"}', '{"provider":"email"}', now(), now()),
  ('a0000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'constructora@prueba.invalid', '{"rol":"empresa"}', '{"provider":"email"}', now(), now())
on conflict (id) do nothing;

-- 2. Empresas verificadas (regla 9: solo así llegan al talento).
insert into companies (id, owner_id, nombre, nit, sector, tamano, ciudad, contacto, verificada_en, verificada_fuente)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Muebles La Ceiba SAS (prueba)', '900000001-1', 'Manufactura', 'Pequeña', 'Medellín', 'Contacto de prueba', now(), 'Datos de prueba'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002',
   'Hotel Montaña Verde (prueba)', '900000002-2', 'Turismo', 'Mediana', 'Guatapé', 'Contacto de prueba', now(), 'Datos de prueba'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003',
   'Constructora Andina SAS (prueba)', '900000003-3', 'Construcción', 'Grande', 'Bogotá', 'Contacto de prueba', now(), 'Datos de prueba')
on conflict (id) do nothing;

-- 3. Problemas que publicaron dos de las empresas.
insert into needs (id, company_id, problema, formatos, modalidad, ubicacion, presupuesto, estado)
values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
   'Tenemos dos aprendices nuevos y nadie con tiempo para enseñarles ensambles finos y acabados. Buscamos a alguien con oficio que les acompañe unas horas a la semana durante tres meses.',
   '{mentoria,horas}', 'presencial', 'Medellín', 2400000, 'enviada'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003',
   'Vamos a entregar 40 apartamentos y necesitamos revisar puertas, closets y cocinas en madera antes de la entrega. Buscamos a alguien que sepa de carpintería para un proyecto de seis semanas.',
   '{proyecto}', 'presencial', 'Bogotá', 6000000, 'enviada')
on conflict (id) do nothing;

-- 4. Tres oportunidades para la persona que está probando (llegan como «Oportunidad nueva» y
--    dejan un aviso en la cola del equipo).
with persona as (
  select p.id from talent_profiles p join auth.users u on u.id = p.user_id
  where u.email = 'CORREO-DE-LA-PERSONA'
)
insert into connections (company_id, talent_id, need_id, origen, estado, puntaje, razon_curador)
select x.company_id, persona.id, x.need_id, x.origen, 'enviada_talento', x.puntaje, x.razon
from persona, (values
  ('b0000000-0000-4000-8000-000000000001'::uuid, 'c0000000-0000-4000-8000-000000000001'::uuid, 'problema', 0.86,
   'Sabe de carpintería y ha enseñado el oficio: justo lo que piden para los aprendices.'),
  ('b0000000-0000-4000-8000-000000000002'::uuid, null::uuid, 'exploracion', null::numeric, null::text),
  ('b0000000-0000-4000-8000-000000000003'::uuid, 'c0000000-0000-4000-8000-000000000003'::uuid, 'problema', 0.71,
   'Tiene oficio en madera y ha trabajado con clientes grandes.')
) as x(company_id, need_id, origen, puntaje, razon)
on conflict do nothing;

-- 5. Otros perfiles ficticios, para que una empresa tenga a quién encontrar en «Explorar».
insert into talent_profiles (id, nombre, ubicacion, oficio, resumen, visibilidad, estado)
values
  ('d0000000-0000-4000-8000-000000000001', 'Rosa Chamorro (prueba)', 'Pasto', 'Tejedora',
   'Tejo en telar y en guanga. He sacado adelante pedidos grandes para tiendas y enseño a mujeres de la vereda.', 'visible', 'publicado'),
  ('d0000000-0000-4000-8000-000000000002', 'Perfil reservado (prueba)', 'Bogotá', 'Ebanista',
   null, 'reservado', 'publicado'),
  ('d0000000-0000-4000-8000-000000000003', 'Martha Lucía Ríos (prueba)', 'Cali', 'Contadora',
   'Llevé la contabilidad de una pyme familiar y la pasé a facturación electrónica sin multas.', 'visible', 'publicado'),
  ('d0000000-0000-4000-8000-000000000004', 'Perfil reservado 2 (prueba)', 'Barranquilla', 'Enfermera',
   null, 'reservado', 'publicado')
on conflict (id) do nothing;

insert into footprint_tags (talent_id, capa, etiqueta, taxonomy_id, confirmada)
select v.talent_id, t.capa, t.etiqueta, t.id, true
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Tejido artesanal'),
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Pedido grande entregado a tiempo'),
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Asociación de artesanos'),
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Dio clases en la comunidad'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'Ebanistería y carpintería'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'Restauración de piezas antiguas'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'Taller propio'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'Enseñó a aprendices en el taller'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'Contabilidad'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'Cambio a facturación electrónica'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'Empresa familiar'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'DIAN'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Enfermería'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Cuidado de pacientes complejos'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Turnos 24 horas'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Formó a supervisores')
) as v(talent_id, etiqueta)
join taxonomy t on t.etiqueta = v.etiqueta
where not exists (select 1 from footprint_tags f where f.talent_id = v.talent_id and f.taxonomy_id = t.id);

insert into talent_offers (talent_id, tipo, horas_semana, modalidad, tarifa_esperada)
select * from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'proyecto'::tipo_oferta, 20, 'presencial', 1800000::numeric),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'horas'::tipo_oferta, 15, 'presencial', 45000::numeric),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'fraccional'::tipo_oferta, 16, 'remoto', 2500000::numeric),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'medio_tiempo'::tipo_oferta, 20, 'presencial', 2000000::numeric)
) as o(talent_id, tipo, horas_semana, modalidad, tarifa_esperada)
where not exists (select 1 from talent_offers t where t.talent_id = o.talent_id);

-- 6. Talento del campo: un oficio por encargo y un taller, publicados, para que las empresas los vean.
insert into experiences (slug, tipo, nombre, proposito, sabedora_nombre, sabedora_pueblo, temas, para_quien, beneficios, momentos, formatos, lugar, duracion, grupo_min, grupo_max, precio_desde, porcentaje_sabedora, estado, aprobada_por_sabedora_en)
values
  ('tejidos-en-guanga-prueba', 'oficio', 'Tejidos en guanga por encargo (prueba)',
   'Ruanas, mochilas y tapices tejidos a mano en telar de guanga, para regalos corporativos o para vestir un espacio. Cada pieza lleva el nombre de quien la tejió.',
   'Asociación de tejedoras de la vereda (prueba)', 'Nariño', '{Tejido,"Regalos corporativos"}', 'Empresas que buscan regalos con historia',
   '{"Piezas únicas, hechas a mano","Una tarjeta con la historia de quien la tejió"}',
   '[{"titulo":"Diseño","descripcion":"Eliges colores y tamaño con nuestro equipo."},{"titulo":"Tejido","descripcion":"Las tejedoras trabajan en sus casas, a su ritmo."},{"titulo":"Entrega","descripcion":"Kánna revisa cada pieza y la lleva a tu sede."}]'::jsonb,
   '{sede}', null, '4 a 6 semanas', 10, 200, 120000, 70, 'publicada', now()),
  ('taller-de-cesteria-prueba', 'experiencia', 'Taller de cestería con fibras naturales (prueba)',
   'Tu equipo aprende a tejer una canasta pequeña con fibras naturales mientras conversa sobre el trabajo paciente y en equipo.',
   'Maestro artesano de la región (prueba)', 'Boyacá', '{Cestería,"Trabajo en equipo"}', 'Equipos de hasta 25 personas',
   '{"Una canasta tejida por cada persona","Una pausa para conversar sobre el trabajo en equipo"}',
   '[{"titulo":"Apertura","descripcion":"El maestro cuenta de dónde viene la fibra."},{"titulo":"Tejido","descripcion":"Cada persona teje su canasta con acompañamiento."},{"titulo":"Cierre","descripcion":"Conversamos sobre lo que el oficio enseña del trabajo en equipo."}]'::jsonb,
   '{territorio,sede}', 'Tibasosa, Boyacá', '3 horas', 8, 25, 85000, 60, 'publicada', now())
on conflict (slug) do nothing;
