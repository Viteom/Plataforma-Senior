import { supabaseConfigurado } from "@/lib/supabase/config";

// Datos de ejemplo para revisar el diseño mientras las pantallas no leen de Supabase
// (hitos 3 y 4). Ningún dato de ejemplo incluye edad.

// Sin Supabase configurado no hay inicio de sesión: la portada muestra accesos a cada área.
export const MODO_DEMO = !supabaseConfigurado;

// Las formas de contratar viven en lib/formas.ts; se reexportan para las pantallas de ejemplo.
export { formasContratar, type FormaContratar } from "@/lib/formas";
import type { FormaContratar } from "@/lib/formas";

export type PerfilEjemplo = {
  id: string;
  visibilidad: "reservado" | "visible";
  nombre?: string;
  oficio: string;
  ubicacion: string;
  situaciones: string[];
  contexto: string[];
  normas: string[];
  formas: FormaContratar[];
  horasSemana: number;
  modalidad: "Presencial" | "Remoto" | "Mixto";
};

export const perfilesEjemplo: PerfilEjemplo[] = [
  {
    id: "ejemplo-1",
    visibilidad: "reservado",
    oficio: "Producción de alimentos",
    ubicacion: "Valle de Aburrá",
    situaciones: ["Apertura de una planta nueva", "Certificación sanitaria"],
    contexto: ["Empresa familiar", "Equipo de 40 personas"],
    normas: ["INVIMA", "SG-SST"],
    formas: ["proyecto", "mentoria"],
    horasSemana: 15,
    modalidad: "Presencial",
  },
  {
    id: "ejemplo-2",
    visibilidad: "visible",
    nombre: "Gloria Restrepo",
    oficio: "Contabilidad y finanzas",
    ubicacion: "Medellín",
    situaciones: ["Salida de una crisis de caja", "Cambio a facturación electrónica"],
    contexto: ["Pyme de servicios", "Cooperativa"],
    normas: ["NIIF para pymes", "DIAN"],
    formas: ["horas", "fraccional"],
    horasSemana: 20,
    modalidad: "Mixto",
  },
  {
    id: "ejemplo-3",
    visibilidad: "reservado",
    oficio: "Mantenimiento industrial",
    ubicacion: "Rionegro",
    situaciones: ["Reducción de paradas de planta", "Formación de técnicos nuevos"],
    contexto: ["Plásticos", "Turnos 24/7"],
    normas: ["RETIE"],
    formas: ["mentoria", "medio_tiempo"],
    horasSemana: 24,
    modalidad: "Presencial",
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
