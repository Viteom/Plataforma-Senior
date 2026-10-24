import { supabaseConfigurado } from "@/lib/supabase/config";
import { taxonomiaDemo } from "@/lib/taxonomia-demo";

// Datos de ejemplo para revisar el diseño mientras las pantallas no leen de Supabase
// (hitos 3 y 4). Ningún dato de ejemplo incluye edad.

// Sin Supabase configurado no hay inicio de sesión: la portada muestra accesos a cada área.
export const MODO_DEMO = !supabaseConfigurado;

// Las formas de contratar viven en lib/formas.ts; se reexportan para las pantallas de ejemplo.
export { formasContratar, type FormaContratar } from "@/lib/formas";
import type {
  ConexionEmpresa,
  ExperienciaVista,
  MiEmpresa,
  NecesidadVista,
  Oportunidad,
  PerfilVista,
  SolicitudExperiencia,
} from "@/lib/datos/tipos";

// Perfiles como los ve una empresa (misma forma que company_talent_view).
export const perfilesEjemplo: PerfilVista[] = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    visibilidad: "reservado",
    identidad_visible: false,
    nombre: null,
    resumen: null,
    oficio: "Producción de alimentos",
    ubicacion: "Valle de Aburrá",
    huella: [
      { capa: "situaciones", etiqueta: "Apertura de una planta nueva" },
      { capa: "situaciones", etiqueta: "Certificación sanitaria" },
      { capa: "contexto", etiqueta: "Empresa familiar" },
      { capa: "escala", etiqueta: "Equipo de 10 a 50 personas" },
      { capa: "normas", etiqueta: "INVIMA" },
      { capa: "normas", etiqueta: "SG-SST" },
    ],
    ofertas: [
      { tipo: "proyecto", horas_semana: 15, modalidad: "presencial", rango_min: 2_500_000, rango_max: 3_500_000 },
      { tipo: "mentoria", horas_semana: 15, modalidad: "presencial", rango_min: null, rango_max: null },
    ],
    evidencias: 2,
  },
  {
    id: "00000000-0000-4000-a000-000000000002",
    visibilidad: "visible",
    identidad_visible: true,
    nombre: "Gloria Restrepo",
    resumen: "Contadora. Ayudo a cooperativas y pymes a ordenar sus finanzas y a salir de crisis de caja.",
    oficio: "Contabilidad y finanzas",
    ubicacion: "Medellín",
    huella: [
      { capa: "situaciones", etiqueta: "Salida de una crisis de caja" },
      { capa: "situaciones", etiqueta: "Cambio a facturación electrónica" },
      { capa: "contexto", etiqueta: "Cooperativa" },
      { capa: "normas", etiqueta: "NIIF para pymes" },
      { capa: "normas", etiqueta: "DIAN" },
    ],
    ofertas: [
      { tipo: "conversacion", horas_semana: 20, modalidad: "mixto", rango_min: 120_000, rango_max: 170_000 },
      { tipo: "fraccional", horas_semana: 20, modalidad: "mixto", rango_min: null, rango_max: null },
    ],
    evidencias: 1,
  },
  {
    id: "00000000-0000-4000-a000-000000000003",
    visibilidad: "reservado",
    identidad_visible: false,
    nombre: null,
    resumen: null,
    oficio: "Mantenimiento industrial",
    ubicacion: "Rionegro",
    huella: [
      { capa: "situaciones", etiqueta: "Reducción de paradas de planta" },
      { capa: "situaciones", etiqueta: "Formación de personal nuevo" },
      { capa: "contexto", etiqueta: "Turnos 24 horas" },
      { capa: "normas", etiqueta: "RETIE" },
    ],
    ofertas: [{ tipo: "medio_tiempo", horas_semana: 24, modalidad: "presencial", rango_min: null, rango_max: null }],
    evidencias: 0,
  },
];

export const empresaEjemplo: MiEmpresa = {
  id: "00000000-0000-4000-b000-000000000001",
  nombre: "Alimentos del Oriente SAS",
  nit: "900123456",
  verificada: true,
  estado: "activa",
};

export const necesidadEjemplo: NecesidadVista = {
  id: "00000000-0000-4000-c000-000000000001",
  problema: "Vamos a abrir una segunda planta y necesitamos cumplir con INVIMA en 6 meses.",
  formatos: ["proyecto"],
  modalidad: "presencial",
  ubicacion: "Rionegro",
  presupuesto: 4_000_000,
  estado: "enviada",
  creado_en: "2026-10-20T15:00:00Z",
  requisitos: [
    { capa: "situaciones", etiqueta: "Certificación sanitaria", obligatorio: true },
    { capa: "normas", etiqueta: "INVIMA", obligatorio: true },
    { capa: "contexto", etiqueta: "Alimentos", obligatorio: false },
  ],
};

// Fechas relativas a hoy, para que la demostración siempre muestre conversaciones por venir.
const enDias = (d: number, hora = 15) => {
  const f = new Date(Date.now() + d * 24 * 3600_000);
  f.setUTCHours(hora, 0, 0, 0);
  return f.toISOString();
};
const diaEn = (d: number) => enDias(d).slice(0, 10);

// Mis procesos de la empresa de ejemplo: una etapa distinta en cada una.
export const conexionesEjemplo: ConexionEmpresa[] = [
  {
    id: "00000000-0000-4000-d000-000000000001",
    talent_id: perfilesEjemplo[0].id,
    need_id: necesidadEjemplo.id,
    origen: "problema",
    estado: "le_interesa",
    puntaje: 86,
    desglose: { situaciones: 1, oficio_normas: 1, contexto_escala: 0.5, formato: 1, evidencia: 0.4, ubicacion: 1, economica: 1 },
    razon_curador: "Lideró una certificación INVIMA en una planta de tamaño parecido.",
    actualizado_en: enDias(-9),
    dias_esperando: 9,
  },
  {
    id: "00000000-0000-4000-d000-000000000002",
    talent_id: perfilesEjemplo[1].id,
    need_id: null,
    origen: "exploracion",
    estado: "conversacion",
    puntaje: null,
    desglose: null,
    razon_curador: null,
    actualizado_en: enDias(-1),
    conversacion_en: enDias(2),
    conversacion_modo: "videollamada",
    conversacion_confirmada: true,
  },
  {
    id: "00000000-0000-4000-d000-000000000003",
    talent_id: perfilesEjemplo[2].id,
    need_id: null,
    origen: "exploracion",
    estado: "acuerdo",
    puntaje: null,
    desglose: null,
    razon_curador: null,
    actualizado_en: enDias(-2),
    conversacion_en: enDias(-4),
    conversacion_modo: "presencial",
    conversacion_confirmada: true,
    acuerdo_forma: "medio_tiempo",
    acuerdo_horas_semana: 24,
    acuerdo_valor: 3800000,
    acuerdo_unidad: "mes",
    acuerdo_inicio: diaEn(10),
    acuerdo_nota: "Reducir las paradas de la línea 2 y formar a dos técnicos.",
  },
  {
    id: "00000000-0000-4000-d000-000000000004",
    talent_id: perfilesEjemplo[0].id,
    need_id: null,
    origen: "exploracion",
    estado: "cerrada",
    puntaje: null,
    desglose: null,
    razon_curador: null,
    actualizado_en: enDias(-20),
    cierre_tipo: "terminado",
    cerrada_por: "talento",
    acuerdo_forma: "conversacion",
    acuerdo_valor: 150000,
    acuerdo_unidad: "conversacion",
    evaluacion_empresa: null,
  },
];

// Oportunidades del talento de ejemplo, en distintas etapas.
export const oportunidadesEjemplo: Oportunidad[] = [
  {
    id: "00000000-0000-4000-e000-000000000001",
    origen: "problema",
    estado: "enviada_talento",
    empresa: "Alimentos del Oriente SAS",
    sector: "Alimentos",
    ciudad: "Rionegro",
    empresa_verificada: true,
    problema: "Vamos a abrir una segunda planta y necesitamos cumplir con INVIMA en 6 meses.",
    formatos: ["proyecto"],
    modalidad: "presencial",
    creado_en: enDias(-1),
  },
  {
    id: "00000000-0000-4000-e000-000000000002",
    origen: "exploracion",
    estado: "conversacion",
    empresa: "Cooperativa La Esperanza",
    sector: "Finanzas",
    ciudad: "Medellín",
    empresa_verificada: true,
    problema: null,
    formatos: null,
    modalidad: null,
    creado_en: enDias(-6),
    conversacion_en: enDias(3),
    conversacion_modo: "videollamada",
    conversacion_confirmada: false,
  },
  {
    id: "00000000-0000-4000-e000-000000000003",
    origen: "problema",
    estado: "acuerdo",
    empresa: "Muebles del Sur SAS",
    sector: "Manufactura",
    ciudad: "Pasto",
    empresa_verificada: true,
    problema: "Queremos ordenar el taller y formar a dos aprendices en acabados.",
    formatos: ["proyecto"],
    modalidad: "presencial",
    creado_en: enDias(-12),
    conversacion_en: enDias(-3),
    conversacion_modo: "presencial",
    conversacion_confirmada: true,
    acuerdo_forma: "proyecto",
    acuerdo_horas_semana: 15,
    acuerdo_valor: 3000000,
    acuerdo_unidad: "proyecto",
    acuerdo_inicio: diaEn(7),
    acuerdo_nota: "Tres meses, con visitas al taller martes y jueves.",
  },
  {
    id: "00000000-0000-4000-e000-000000000006",
    origen: "exploracion",
    estado: "en_curso",
    empresa: "Clínica San Rafael",
    sector: "Salud",
    ciudad: "Bello",
    empresa_verificada: true,
    problema: null,
    formatos: null,
    modalidad: null,
    creado_en: enDias(-30),
    conversacion_en: enDias(-24),
    conversacion_modo: "llamada",
    conversacion_confirmada: true,
    acuerdo_forma: "mentoria",
    acuerdo_horas_semana: 6,
    acuerdo_valor: 90000,
    acuerdo_unidad: "hora",
    acuerdo_aceptado_en: enDias(-20),
  },
  {
    id: "00000000-0000-4000-e000-000000000004",
    origen: "exploracion",
    estado: "cerrada",
    empresa: "Fundación Leer Juntos",
    sector: "Educación",
    ciudad: "Manizales",
    empresa_verificada: true,
    problema: null,
    formatos: null,
    modalidad: null,
    creado_en: enDias(-40),
    cierre_tipo: "terminado",
    cerrada_por: "empresa",
    evaluacion_talento: null,
  },
  {
    id: "00000000-0000-4000-e000-000000000005",
    origen: "problema",
    estado: "sin_respuesta",
    empresa: "Hotel Andino",
    sector: "Turismo",
    ciudad: "Paipa",
    empresa_verificada: true,
    problema: "Necesitamos mejorar la atención en recepción en temporada alta.",
    formatos: ["mentoria"],
    modalidad: "presencial",
    creado_en: enDias(-25),
  },
];

// Primera experiencia del brief, como borrador: los datos que faltan se muestran "Por definir".
export const experienciaEjemplo: ExperienciaVista = {
  id: "00000000-0000-4000-9400-000000000001",
  slug: "ceremonia-del-cuidado",
  tipo: "experiencia",
  nombre: "Ceremonia del cuidado",
  proposito:
    "A través del tejido, encarna el cuidado y abre la conversación sobre cómo esa labor ha recaído históricamente en las mujeres y sobre la importancia de que quienes cuidan también sean cuidadas.",
  sabedora_nombre: null,
  sabedora_pueblo: null,
  temas: ["Cuidado", "Tejido", "Bienestar de equipos"],
  para_quien: "Equipos de enfermería y cuidado",
  beneficios: ["Conversación sobre el cuidado de quienes cuidan", "Un espacio de pausa para el equipo"],
  momentos: [],
  formatos: ["territorio", "sede"],
  lugar: null,
  duracion: null,
  grupo_min: null,
  grupo_max: null,
  precio_desde: null,
  porcentaje_sabedora: null,
  testimonio: null,
  estado: "borrador",
  aprobada_por_sabedora_en: null,
};

// Oficio por encargo de muestra: Vasees lo arma con la artesana, que no usa la app.
export const oficioEjemplo: ExperienciaVista = {
  id: "00000000-0000-4000-9400-000000000002",
  slug: "tejidos-en-guanga-por-encargo",
  tipo: "oficio",
  nombre: "Tejidos en guanga por encargo",
  proposito:
    "Ruanas, mochilas y tapices tejidos a mano en telar de guanga, para regalos corporativos o para vestir un espacio. Cada pieza lleva el nombre de quien la tejió.",
  sabedora_nombre: "Asociación de tejedoras de la vereda (ejemplo)",
  sabedora_pueblo: "Nariño",
  temas: ["Tejido", "Regalos corporativos"],
  para_quien: "Empresas que buscan regalos con historia",
  beneficios: ["Piezas únicas, hechas a mano", "Una tarjeta con la historia de quien la tejió"],
  momentos: [
    { titulo: "Diseño", descripcion: "Eliges colores y tamaño con nuestro equipo." },
    { titulo: "Tejido", descripcion: "Las tejedoras trabajan en sus casas, a su ritmo." },
    { titulo: "Entrega", descripcion: "Vasees revisa cada pieza y la lleva a tu sede." },
  ],
  formatos: ["sede"],
  lugar: null,
  duracion: "4 a 6 semanas",
  grupo_min: 10,
  grupo_max: 200,
  precio_desde: 120000,
  porcentaje_sabedora: 70,
  testimonio: null,
  estado: "publicada",
  aprobada_por_sabedora_en: "2026-10-20T15:00:00Z",
};

export const solicitudesEjemplo: SolicitudExperiencia[] = [
  {
    id: "00000000-0000-4000-9500-000000000001",
    experiencia: "Ceremonia del cuidado",
    tipo: "experiencia",
    empresa: "Clínica del Oriente",
    formato: "sede",
    personas: 20,
    mes: "Noviembre",
    nota: "Para el equipo de enfermería del turno de la noche.",
    estado: "cotizada",
    valor_cotizado: 2_800_000,
    creado_en: "2026-10-20T15:00:00Z",
    impacto: null,
  },
];

// Taxonomía mínima para el modo demostración (la real vive en la migración de taxonomía semilla).
// La misma taxonomía que siembran las migraciones (scripts/generar-taxonomia-demo.mjs).
export const taxonomiaEjemplo = taxonomiaDemo;
