-- Taxonomía semilla (hito 3). Propuesta inicial para revisar con el equipo antes del piloto:
-- etiquetas canónicas de máximo 6 palabras, en español sencillo, sin nada que revele la edad
-- (nada de "años de experiencia", "pensionado" ni fechas). Las etiquetas nuevas que proponga la
-- IA quedan fuera de esta tabla y pasan a revisión del equipo.

insert into taxonomy (capa, etiqueta, sinonimos, sector) values
  -- Situaciones vividas: lo que la persona ya resolvió.
  ('situaciones', 'Apertura de una planta nueva', '{"montar una planta","arrancar una fábrica"}', 'manufactura'),
  ('situaciones', 'Certificación sanitaria', '{"registro invima","visita del invima"}', 'alimentos'),
  ('situaciones', 'Salida de una crisis de caja', '{"falta de liquidez","sin plata para pagar"}', null),
  ('situaciones', 'Cambio a facturación electrónica', '{"factura electrónica"}', 'contabilidad'),
  ('situaciones', 'Reducción de paradas de planta', '{"menos paros","mantenimiento preventivo"}', 'manufactura'),
  ('situaciones', 'Formación de personal nuevo', '{"capacitar gente nueva","entrenar operarios"}', null),
  ('situaciones', 'Cierre contable anual', '{"cierre de año","balance de fin de año"}', 'contabilidad'),
  ('situaciones', 'Auditoría externa superada', '{"pasar una auditoría"}', null),
  ('situaciones', 'Recuperación de cartera vencida', '{"cobro de cartera","cartera morosa"}', 'finanzas'),
  ('situaciones', 'Reorganización de un equipo', '{"reestructurar el área"}', null),
  ('situaciones', 'Implementación de un sistema nuevo', '{"cambiar de software","implementar erp"}', null),
  ('situaciones', 'Respuesta a una emergencia', '{"atender una emergencia","contingencia"}', null),
  ('situaciones', 'Lanzamiento de un producto', '{"sacar un producto nuevo"}', null),
  ('situaciones', 'Mejora de la calidad del producto', '{"bajar devoluciones","control de calidad"}', null),
  ('situaciones', 'Negociación con proveedores', '{"bajar costos de compra"}', null),
  ('situaciones', 'Apertura de un mercado nuevo', '{"vender en otra región","exportar"}', null),
  ('situaciones', 'Relevo en una empresa familiar', '{"sucesión familiar","pasar el negocio"}', null),
  ('situaciones', 'Recuperación de una cosecha', '{"salvar la cosecha","plaga en el cultivo"}', 'agro'),
  ('situaciones', 'Obra entregada a tiempo', '{"terminar la obra a tiempo"}', 'construccion'),
  ('situaciones', 'Cuidado de pacientes complejos', '{"pacientes crónicos"}', 'salud'),

  -- Contexto: dónde y con quién.
  ('contexto', 'Empresa familiar', '{"negocio de familia"}', null),
  ('contexto', 'Pyme', '{"pequeña empresa","mediana empresa"}', null),
  ('contexto', 'Gran empresa', '{"multinacional"}', null),
  ('contexto', 'Cooperativa', '{"asociación","fondo de empleados"}', null),
  ('contexto', 'Sector público', '{"entidad pública","alcaldía","gobierno"}', null),
  ('contexto', 'Zona rural', '{"vereda","campo"}', null),
  ('contexto', 'Fundación u ONG', '{"organización social"}', null),
  ('contexto', 'Alimentos', '{"industria de alimentos"}', 'alimentos'),
  ('contexto', 'Manufactura', '{"industria","fábrica"}', 'manufactura'),
  ('contexto', 'Servicios', '{"empresa de servicios"}', null),
  ('contexto', 'Comercio', '{"tienda","almacén","venta al por menor"}', null),
  ('contexto', 'Salud', '{"clínica","hospital","ips"}', 'salud'),
  ('contexto', 'Agro', '{"finca","agricultura","ganadería"}', 'agro'),
  ('contexto', 'Construcción', '{"obra","constructora"}', 'construccion'),
  ('contexto', 'Educación', '{"colegio","universidad","sena"}', null),
  ('contexto', 'Turnos 24 horas', '{"trabajo por turnos","24/7"}', null),

  -- Escala: tamaño de lo que manejó.
  ('escala', 'Equipo de hasta 10 personas', '{"grupo pequeño"}', null),
  ('escala', 'Equipo de 10 a 50 personas', '{}', null),
  ('escala', 'Equipo de más de 50 personas', '{}', null),
  ('escala', 'Varias sedes', '{"varias sucursales","varias plantas"}', null),
  ('escala', 'Un solo cliente grande', '{}', null),
  ('escala', 'Presupuesto a cargo', '{"manejo de presupuesto"}', null),

  -- Saber del oficio.
  ('oficio', 'Producción de alimentos', '{"procesamiento de alimentos"}', 'alimentos'),
  ('oficio', 'Contabilidad', '{"contador","contaduría"}', 'contabilidad'),
  ('oficio', 'Finanzas', '{"tesorería","flujo de caja"}', 'finanzas'),
  ('oficio', 'Mantenimiento industrial', '{"mantenimiento de máquinas","mecánico industrial"}', 'manufactura'),
  ('oficio', 'Electricidad', '{"electricista"}', null),
  ('oficio', 'Recursos humanos', '{"gestión humana","talento humano","nómina"}', null),
  ('oficio', 'Ventas', '{"vendedor","comercial"}', null),
  ('oficio', 'Logística', '{"bodega","inventarios","despachos"}', null),
  ('oficio', 'Compras', '{"abastecimiento"}', null),
  ('oficio', 'Calidad', '{"aseguramiento de calidad"}', null),
  ('oficio', 'Enfermería', '{"enfermera","auxiliar de enfermería"}', 'salud'),
  ('oficio', 'Cuidado de personas', '{"cuidador","cuidadora"}', 'salud'),
  ('oficio', 'Agricultura', '{"cultivos","agricultor"}', 'agro'),
  ('oficio', 'Construcción', '{"maestro de obra","obra civil"}', 'construccion'),
  ('oficio', 'Docencia', '{"profesor","enseñar"}', null),
  ('oficio', 'Tejido artesanal', '{"tejer","tejedora"}', 'artesania'),
  ('oficio', 'Cocina', '{"chef","cocinera"}', null),
  ('oficio', 'Administración', '{"administrador","gerencia"}', null),
  ('oficio', 'Sistemas', '{"informática","tecnología"}', null),

  -- Normas y regulaciones que conoce (Colombia).
  ('normas', 'INVIMA', '{"buenas prácticas de manufactura","bpm"}', 'alimentos'),
  ('normas', 'SG-SST', '{"seguridad y salud en el trabajo","sgsst"}', null),
  ('normas', 'NIIF para pymes', '{"niif","normas internacionales"}', 'contabilidad'),
  ('normas', 'DIAN', '{"impuestos","tributaria"}', 'contabilidad'),
  ('normas', 'RETIE', '{"reglamento eléctrico"}', null),
  ('normas', 'ISO 9001', '{"norma de calidad"}', null),
  ('normas', 'ICA', '{"registro ica"}', 'agro'),
  ('normas', 'Habilitación en salud', '{"resolución de habilitación"}', 'salud'),
  ('normas', 'Ley de protección de datos', '{"habeas data","ley 1581"}', null),
  ('normas', 'NSR-10', '{"sismorresistencia","norma sismo resistente"}', 'construccion'),

  -- Transferir: cómo comparte lo que sabe.
  ('transferir', 'Formó a supervisores', '{"capacitó jefes"}', null),
  ('transferir', 'Escribió manuales de trabajo', '{"procedimientos","instructivos"}', null),
  ('transferir', 'Acompañó a personas nuevas', '{"mentor","padrino"}', null),
  ('transferir', 'Dictó talleres', '{"capacitaciones","charlas"}', null),
  ('transferir', 'Enseñó un oficio tradicional', '{"saber tradicional","saber ancestral"}', 'artesania')
on conflict (capa, etiqueta) do nothing;
