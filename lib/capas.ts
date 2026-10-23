import type { Capa } from "@/lib/ia/tipos";

// Cómo se nombra cada capa de la huella en la interfaz. Lenguaje que sirva igual para una
// tejedora, un ebanista o una contadora.
export const nombreCapa: Record<Capa, string> = {
  oficio: "Tu oficio",
  situaciones: "Lo que has resuelto en tu trabajo",
  contexto: "Dónde o cómo trabajaste",
  escala: "Tamaño de tu trabajo",
  transferir: "Cómo enseñas lo que sabes",
  normas: "Normas o permisos que manejas",
};

// Los mismos grupos vistos por una empresa: se habla de la persona en tercera persona.
export const nombreCapaEmpresa: Record<Capa, string> = {
  oficio: "Oficio",
  situaciones: "Lo que ha resuelto",
  contexto: "Dónde o cómo trabajó",
  escala: "Tamaño del trabajo",
  transferir: "Cómo enseña lo que sabe",
  normas: "Normas o permisos que maneja",
};

export const ayudaCapa: Record<Capa, string> = {
  oficio: "Lo que sabes hacer.",
  situaciones: "Problemas o retos que sacaste adelante.",
  contexto: "Por ejemplo, por tu cuenta, en un taller o en una empresa.",
  escala: "Si trabajaste solo o con ayudantes, y qué tan grandes eran los trabajos.",
  transferir: "Si les has enseñado a otras personas.",
  normas: "Solo si tu trabajo las pide. Si no, deja esto en blanco.",
};

// Orden en pantalla: primero lo que cualquiera reconoce (su oficio), al final lo opcional.
export const ORDEN_CAPAS: Capa[] = ["oficio", "situaciones", "contexto", "escala", "transferir", "normas"];

export const MAX_ETIQUETA_LIBRE = 60;

// Una etiqueta libre la ven las empresas (cuando el equipo la aprueba): sin contacto ni edad.
export function problemaEtiquetaLibre(texto: string): string | null {
  if (texto.length < 3) return "Escribe al menos una palabra completa.";
  if (texto.length > MAX_ETIQUETA_LIBRE) return `Usa máximo ${MAX_ETIQUETA_LIBRE} letras.`;
  if (/\d{5,}|@|https?:|www\./i.test(texto)) return "No escribas teléfonos, correos ni páginas web.";
  if (/\baños\b|\bedad\b|naci[óo]|pension|jubil|\b(19|20)\d\d\b/i.test(texto)) return "No escribas edades, años ni fechas.";
  return null;
}
