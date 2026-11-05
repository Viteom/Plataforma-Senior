-- Cinco oportunidades de prueba, una en cada etapa, para recorrer el flujo del talento completo:
--   1. Invitación nueva          (enviada_talento)  → puedes decir «Me interesa» o «No por ahora»
--   2. Interés enviado           (visible_empresa)  → esperas que la organización quiera conocerte
--   3. Conversación agendada     (conversacion)     → confirmas la fecha o pides otra
--   4. Acuerdo propuesto         (acuerdo)          → lo aceptas o pides ajustes
--   5. Trabajo en curso          (en_curso)         → lo terminas y calificas
--
-- Todo lleva «(prueba)» en el nombre y los dueños de las organizaciones usan @prueba.invalid
-- (no pueden entrar). Se borra con borrar.sql. No crea perfiles de talento falsos.
--
-- Antes de correrlo: cambia CORREO-DE-LA-PERSONA por el correo con el que entraste como talento
-- (debe tener el perfil creado). Se corre en Supabase → SQL Editor. Puedes correrlo varias veces.

-- 1. Dueños ficticios (una organización por cuenta).
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
select ('a0000000-0000-4000-8000-0000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000',
       'authenticated', 'authenticated', 'flujo' || n || '@prueba.invalid', '{"rol":"empresa"}', '{"provider":"email"}', now(), now()
from unnest(array['11', '12', '13', '14', '15']) as n
on conflict (id) do nothing;

-- 2. Organizaciones verificadas y activas (regla 9).
insert into companies (id, owner_id, nombre, nit, sector, tamano, ciudad, contacto, verificada_en, verificada_fuente)
values
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000011',
   'Panadería El Trigal (prueba)', '900000011-1', 'Alimentos', 'Pequeña', 'Medellín', 'Contacto de prueba', now(), 'Datos de prueba'),
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000012',
   'Cooperativa Cafetera del Sur (prueba)', '900000012-2', 'Agro', 'Mediana', 'Pitalito', 'Contacto de prueba', now(), 'Datos de prueba'),
  ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000013',
   'Clínica Dental Sonrisa (prueba)', '900000013-3', 'Salud', 'Pequeña', 'Bogotá', 'Contacto de prueba', now(), 'Datos de prueba'),
  ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000014',
   'Ferretería Los Andes (prueba)', '900000014-4', 'Comercio', 'Mediana', 'Cali', 'Contacto de prueba', now(), 'Datos de prueba'),
  ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000015',
   'Fundación Lectores (prueba)', '900000015-5', 'Educación', 'Pequeña', 'Bucaramanga', 'Contacto de prueba', now(), 'Datos de prueba')
on conflict (id) do nothing;

-- 3. Un reto por organización, con condiciones de trabajo digno ya aprobadas.
insert into needs (id, company_id, problema, formatos, modalidad, ubicacion, presupuesto, estado,
                   jornada_horas, remuneracion, remuneracion_unidad, condiciones)
values
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000011',
   'Abrimos una segunda sede y el equipo nuevo no sabe llevar inventario ni costos. Buscamos a alguien que les enseñe a ordenar compras y mermas.',
   '{mentoria,horas}', 'presencial', 'Medellín', 1800000, 'enviada', 8, 45000, 'hora',
   'Jornada en la mañana con pausa de descanso a media jornada. El equipo de Kánna hace acompañamiento durante todo el proceso.'),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000012',
   'Queremos que los caficultores jóvenes aprendan a llevar las cuentas de la finca. Buscamos a alguien con experiencia para dar talleres cortos.',
   '{proyecto}', 'mixto', 'Pitalito', 3000000, 'enviada', 10, 3000000, 'proyecto',
   'Talleres de dos horas con descanso entre sesiones. Transporte cubierto y acompañamiento del equipo de Kánna.'),
  ('c0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000013',
   'La recepción se nos desordena y perdemos citas. Buscamos a alguien que organice la agenda y forme a la persona de recepción.',
   '{horas}', 'presencial', 'Bogotá', 1500000, 'enviada', 12, 40000, 'hora',
   'Horario flexible con pausas de descanso. Acompañamiento del equipo de Kánna desde el primer día.'),
  ('c0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000014',
   'Necesitamos revisar cómo atendemos a los maestros de obra y ordenar el catálogo de herrajes. Buscamos a alguien que conozca el oficio.',
   '{horas}', 'presencial', 'Cali', 2000000, 'enviada', 8, 50000, 'hora',
   'Ocho horas a la semana repartidas en dos días, con descanso. Acompañamiento del equipo de Kánna.'),
  ('c0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000015',
   'Vamos a abrir clubes de lectura en barrios y buscamos a alguien que forme a los voluntarios y acompañe las primeras sesiones.',
   '{proyecto}', 'presencial', 'Bucaramanga', 2400000, 'enviada', 6, 2400000, 'proyecto',
   'Sesiones de tarde con pausa de descanso. Acompañamiento del equipo de Kánna en cada encuentro.')
on conflict (id) do nothing;

update needs set dignidad_estado = 'aprobado', dignidad_en = now(), dignidad_automatica = true
where id in ('c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000012',
             'c0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000014',
             'c0000000-0000-4000-8000-000000000015');

-- 4. Las cinco oportunidades para la persona que está probando.
with persona as (
  select p.id from talent_profiles p join auth.users u on u.id = p.user_id
  where lower(u.email) = lower('CORREO-DE-LA-PERSONA')
)
insert into connections (company_id, talent_id, need_id, origen, estado, puntaje, razon_curador,
                         abierta_en, conversacion_en, conversacion_modo, conversacion_confirmada, conversacion_version,
                         acuerdo_forma, acuerdo_horas_semana, acuerdo_valor, acuerdo_unidad, acuerdo_inicio, acuerdo_nota,
                         acuerdo_version, acuerdo_revisado_version, acuerdo_revisado_en, acuerdo_revision_automatica,
                         acuerdo_semaforo, acuerdo_aceptado_en)
select x.company_id, persona.id, x.need_id, 'problema', x.estado::estado_conexion, x.puntaje, x.razon,
       x.abierta_en, x.conversacion_en, x.modo, x.confirmada, x.conv_version,
       x.forma::tipo_oferta, x.horas, x.valor, x.unidad, x.inicio, x.nota,
       x.acuerdo_version, x.revisado_version, x.revisado_en, x.revisado_en is not null,
       case when x.revisado_en is not null then 'verde' end, x.aceptado_en
from persona, (values
  -- 1. Invitación nueva
  ('b0000000-0000-4000-8000-000000000011'::uuid, 'c0000000-0000-4000-8000-000000000011'::uuid, 'enviada_talento', 0.88,
   'Ha llevado inventarios y sabe enseñar con paciencia.',
   null::timestamptz, null::timestamptz, null::text, false, 0,
   null::text, null::int, null::numeric, null::text, null::date, null::text, 0, null::int, null::timestamptz, null::timestamptz),
  -- 2. Interés enviado
  ('b0000000-0000-4000-8000-000000000012'::uuid, 'c0000000-0000-4000-8000-000000000012'::uuid, 'visible_empresa', 0.80,
   'Sabe de cuentas y ha trabajado con gente del campo.',
   null, null, null, false, 0,
   null, null, null, null, null, null, 0, null, null, null),
  -- 3. Conversación agendada, por confirmar
  ('b0000000-0000-4000-8000-000000000013'::uuid, 'c0000000-0000-4000-8000-000000000013'::uuid, 'conversacion', 0.76,
   'Organizó agendas de atención al público por años.',
   now() - interval '2 days', date_trunc('hour', now()) + interval '3 days', 'videollamada', false, 1,
   null, null, null, null, null, null, 0, null, null, null),
  -- 4. Acuerdo propuesto y revisado
  ('b0000000-0000-4000-8000-000000000014'::uuid, 'c0000000-0000-4000-8000-000000000014'::uuid, 'acuerdo', 0.83,
   'Conoce el oficio y sabe atender a maestros de obra.',
   now() - interval '6 days', now() - interval '3 days', 'presencial', true, 1,
   'horas', 8, 50000, 'hora', current_date + 7, 'Martes y jueves en la mañana, con descanso a media jornada.',
   1, 1, now(), null),
  -- 5. Trabajo en curso
  ('b0000000-0000-4000-8000-000000000015'::uuid, 'c0000000-0000-4000-8000-000000000015'::uuid, 'en_curso', 0.90,
   'Ha formado grupos y le gusta la lectura en voz alta.',
   now() - interval '20 days', now() - interval '16 days', 'llamada', true, 1,
   'proyecto', 6, 2400000, 'proyecto', current_date - 7, 'Seis sesiones de tarde durante dos meses.',
   1, 1, now() - interval '12 days', now() - interval '10 days')
) as x(company_id, need_id, estado, puntaje, razon,
       abierta_en, conversacion_en, modo, confirmada, conv_version,
       forma, horas, valor, unidad, inicio, nota, acuerdo_version, revisado_version, revisado_en, aceptado_en)
on conflict do nothing;

-- 5. Revisa: debe mostrar 5 filas, una por etapa. Si sale vacío, el correo no tiene perfil.
select co.nombre, c.estado
from connections c join companies co on co.id = c.company_id
join talent_profiles p on p.id = c.talent_id join auth.users u on u.id = p.user_id
where lower(u.email) = lower('CORREO-DE-LA-PERSONA') and co.nombre like '%(prueba)%'
order by co.nombre;
