import type { Capa } from "@/lib/ia/tipos";

// Cómo se nombra cada capa de la huella en la interfaz. Lenguaje que sirva igual para una
// tejedora, un ebanista o una contadora.
export const nombreCapa: Record<Capa, string> = {
  oficio: "Su oficio",
  situaciones: "Lo que ha resuelto en su trabajo",
  contexto: "Dónde o cómo trabajó",
  escala: "Tamaño de su trabajo",
  transferir: "Cómo enseña lo que sabe",
  normas: "Normas o permisos que maneja",
};

// Los mismos grupos vistos por una empresa: se habla de la persona, no de «su».
export const nombreCapaEmpresa: Record<Capa, string> = {
  oficio: "Oficio",
  situaciones: "Lo que ha resuelto",
  contexto: "Dónde o cómo trabajó",
  escala: "Tamaño del trabajo",
  transferir: "Cómo enseña lo que sabe",
  normas: "Normas o permisos que maneja",
};

export const ayudaCapa: Record<Capa, string> = {
  oficio: "Lo que usted sabe hacer.",
  situaciones: "Problemas o retos que sacó adelante.",
  contexto: "Por ejemplo, por su cuenta, en un taller o en una empresa.",
  escala: "Si trabajó solo o con ayudantes, y qué tan grandes eran los trabajos.",
  transferir: "Si le ha enseñado a otras personas.",
  normas: "Solo si su trabajo las pide. Si no, deje esto en blanco.",
};

// Orden en pantalla: primero lo que cualquiera reconoce (su oficio), al final lo opcional.
export const ORDEN_CAPAS: Capa[] = ["oficio", "situaciones", "contexto", "escala", "transferir", "normas"];

export const MAX_ETIQUETA_LIBRE = 60;

// Una etiqueta libre la ven las empresas (cuando el equipo la aprueba): sin contacto ni edad.
export function problemaEtiquetaLibre(texto: string): string | null {
  if (texto.length < 3) return "Escriba al menos una palabra completa.";
  if (texto.length > MAX_ETIQUETA_LIBRE) return `Use máximo ${MAX_ETIQUETA_LIBRE} letras.`;
  if (/\d{5,}|@|https?:|www\./i.test(texto)) return "No escriba teléfonos, correos ni páginas web.";
  if (/\baños\b|\bedad\b|naci[óo]|pension|jubil|\b(19|20)\d\d\b/i.test(texto)) return "No escriba edades, años ni fechas.";
  return null;
}
