import { supabaseConfigurado } from "@/lib/supabase/config";

// Datos de ejemplo para revisar el diseño mientras las pantallas no leen de Supabase
// (hitos 3 y 4). Ningún dato de ejemplo incluye edad.

// Sin Supabase configurado no hay inicio de sesión: la portada muestra accesos a cada área.
export const MODO_DEMO = !supabaseConfigurado;

// Las formas de contratar viven en lib/formas.ts; se reexportan para las pantallas de ejemplo.
export { formasContratar, type FormaContratar } from "@/lib/formas";
import type { ConexionEmpresa, MiEmpresa, NecesidadVista, Oportunidad, PerfilVista } from "@/lib/datos/tipos";

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
    actualizado_en: "2026-10-21T14:00:00Z",
  },
  {
    id: "00000000-0000-4000-d000-000000000002",
    talent_id: perfilesEjemplo[1].id,
    need_id: null,
    origen: "exploracion",
    estado: "abierta",
    puntaje: null,
    desglose: null,
    razon_curador: null,
    actualizado_en: "2026-10-19T14:00:00Z",
  },
  {
    id: "00000000-0000-4000-d000-000000000003",
    talent_id: perfilesEjemplo[2].id,
    need_id: null,
    origen: "exploracion",
    estado: "esperando",
    puntaje: null,
    desglose: null,
    razon_curador: null,
    actualizado_en: "2026-10-21T10:00:00Z",
  },
];

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
    creado_en: "2026-10-21T14:00:00Z",
  },
  {
    id: "00000000-0000-4000-e000-000000000002",
    origen: "exploracion",
    estado: "abierta",
    empresa: "Cooperativa La Esperanza",
    sector: "Finanzas",
    ciudad: "Medellín",
    empresa_verificada: true,
    problema: null,
    formatos: null,
    modalidad: null,
    creado_en: "2026-10-18T14:00:00Z",
  },
];

export const experienciaEjemplo = {
  slug: "ceremonia-del-cuidado",
  nombre: "Ceremonia del cuidado",
  estado: "borrador" as const,
  proposito:
    "A través del tejido, encarna el cuidado y abre la conversación sobre cómo esa labor ha recaído históricamente en las mujeres y sobre la importancia de que quienes cuidan también sean cuidadas.",
  paraQuien: "Equipos de enfermería y cuidado",
  temas: ["Cuidado", "Tejido", "Bienestar de equipos"],
  formatos: ["En el territorio", "En su sede"],
  // Lo que el brief marca como pendiente se muestra como "Por definir".
  sabedora: null as string | null,
  duracion: null as string | null,
  grupo: null as string | null,
  precioDesde: null as string | null,
};

// Taxonomía mínima para el modo demostración (la real vive en la migración de taxonomía semilla).
export const taxonomiaEjemplo: { id: string; capa: "situaciones" | "contexto" | "escala" | "oficio" | "normas" | "transferir"; etiqueta: string; sinonimos: string[] }[] = [
  { id: "00000000-0000-4000-9000-000000000001", capa: "situaciones", etiqueta: "Apertura de una planta nueva", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000002", capa: "situaciones", etiqueta: "Certificación sanitaria", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000003", capa: "situaciones", etiqueta: "Formación de personal nuevo", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000004", capa: "contexto", etiqueta: "Empresa familiar", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000005", capa: "contexto", etiqueta: "Alimentos", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000006", capa: "escala", etiqueta: "Equipo de 10 a 50 personas", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000007", capa: "oficio", etiqueta: "Producción de alimentos", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000008", capa: "oficio", etiqueta: "Calidad", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000009", capa: "normas", etiqueta: "INVIMA", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000010", capa: "normas", etiqueta: "SG-SST", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000011", capa: "transferir", etiqueta: "Formó a supervisores", sinonimos: [] },
  { id: "00000000-0000-4000-9000-000000000012", capa: "transferir", etiqueta: "Escribió manuales de trabajo", sinonimos: [] },
];
