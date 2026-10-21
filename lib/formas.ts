// Formas de contratar (enum tipo_oferta de la base). La conversación de una hora va primero:
// es la puerta de entrada de menor riesgo para la empresa (brief, A4).

export type FormaContratar =
  | "conversacion"
  | "horas"
  | "proyecto"
  | "mentoria"
  | "fraccional"
  | "medio_tiempo"
  | "experiencia";

export const formasContratar: { valor: FormaContratar; etiqueta: string; descripcion: string }[] = [
  { valor: "conversacion", etiqueta: "Conversación de una hora", descripcion: "Una empresa le consulta un problema concreto." },
  { valor: "horas", etiqueta: "Por horas", descripcion: "Unas horas a la semana, según se necesite." },
  { valor: "proyecto", etiqueta: "Por proyecto", descripcion: "Un trabajo con inicio y fin." },
  { valor: "mentoria", etiqueta: "Mentoría", descripcion: "Acompaña a una persona o a un equipo." },
  { valor: "fraccional", etiqueta: "Fraccional", descripcion: "Un cargo de dirección unos días al mes." },
  { valor: "medio_tiempo", etiqueta: "Medio tiempo", descripcion: "Media jornada estable." },
  { valor: "experiencia", etiqueta: "Experiencia o taller", descripcion: "Guía un taller para un equipo." },
];

export const esForma = (v: unknown): v is FormaContratar => formasContratar.some((f) => f.valor === v);

export const etiquetaForma = (v: string) => formasContratar.find((f) => f.valor === v)?.etiqueta ?? v;

export type Modalidad = "presencial" | "remoto" | "mixto";
export const modalidades: { valor: Modalidad; etiqueta: string }[] = [
  { valor: "presencial", etiqueta: "Presencial" },
  { valor: "remoto", etiqueta: "Desde mi casa" },
  { valor: "mixto", etiqueta: "Las dos" },
];

// Guía de tarifas (tabla rate_guides). Vacía hasta que el equipo defina los rangos.
export type GuiaTarifa = { tipo: FormaContratar; unidad: string; minimo: number; maximo: number };

const UNIDADES: Record<string, string> = {
  hora: "por hora",
  conversacion: "por conversación",
  mes: "al mes",
  proyecto: "por proyecto",
  persona: "por persona",
};
export const textoUnidad = (u: string) => UNIDADES[u] ?? "";

// Unidad con la que se pide la tarifa cuando el equipo aún no definió la guía.
export const unidadPorDefecto: Record<FormaContratar, string> = {
  conversacion: "conversacion",
  horas: "hora",
  proyecto: "proyecto",
  mentoria: "hora",
  fraccional: "mes",
  medio_tiempo: "mes",
  experiencia: "persona",
};

export const pesos = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
