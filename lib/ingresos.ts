import { pesos } from "@/lib/formas";

// Pensión o subsidio de la persona. Solo sirve para avisarle a ella antes de aceptar un acuerdo:
// nunca lo ven las organizaciones ni entra al emparejamiento (regla 1 del CLAUDE.md).

export const SITUACIONES = [
  { valor: "vejez_invalidez", titulo: "Recibo pensión de vejez o de invalidez" },
  { valor: "sobrevivencia", titulo: "Recibo pensión de sobrevivencia" },
  { valor: "colombia_mayor", titulo: "Recibo Colombia Mayor u otro subsidio" },
  { valor: "ninguno", titulo: "No recibo ninguno" },
  { valor: "no_dice", titulo: "Prefiero no decirlo" },
] as const;

export type SituacionIngresos = (typeof SITUACIONES)[number]["valor"];
export type Hogar = "sola" | "familia";

export const esSituacion = (v: unknown): v is SituacionIngresos => SITUACIONES.some((s) => s.valor === v);
export const esHogar = (v: unknown): v is Hogar => v === "sola" || v === "familia";

export const PREGUNTA_INGRESOS = "¿Recibes hoy una pensión o un subsidio?";
export const AYUDA_INGRESOS =
  "Es opcional. Lo usamos solo para avisarte si un trabajo puede afectar tu subsidio o tus aportes. Las organizaciones nunca lo ven.";
export const PREGUNTA_HOGAR = "¿Con quién vives?";
export const HOGARES = [
  { valor: "sola", titulo: "Vivo sin compañía" },
  { valor: "familia", titulo: "Vivo con mi familia" },
] as const;
export const AYUDA_HOGAR = "Cambia cuánto puedes ganar al mes sin perder el subsidio.";

// Lo que devuelve la función avisos_ingresos de la base.
export type AvisoIngresos =
  | {
      codigo: "colombia_mayor";
      mensual: number;
      total: number;
      tope: number;
      hogar: Hogar | null;
      supera: boolean;
    }
  | { codigo: "entidad_publica" }
  | { codigo: "aportes" };

export type TextoAviso = { titulo: string; texto: string; importante: boolean };

export function textoAviso(a: AvisoIngresos): TextoAviso {
  if (a.codigo === "colombia_mayor") {
    const conOtros = a.total > a.mensual ? `, ${pesos(a.total)} con los trabajos que ya tienes` : "";
    // Sin saber con quién vive, la base usa el tope más bajo.
    const quien = a.hogar === "familia" ? "si vives con tu familia" : "si vives sin compañía";
    return a.supera
      ? {
          titulo: "Con este acuerdo podrías perder Colombia Mayor",
          texto: `Este acuerdo suma cerca de ${pesos(a.mensual)} al mes${conOtros}. Colombia Mayor se pierde ${quien} y ganas más de ${pesos(a.tope)} al mes. Habla con el equipo antes de aceptar: te ayudamos a ajustar las horas o el valor.`,
          importante: true,
        }
      : {
          titulo: "Tu subsidio",
          texto: `Este acuerdo suma cerca de ${pesos(a.mensual)} al mes${conOtros}. Está por debajo de ${pesos(a.tope)}, el tope de Colombia Mayor ${quien}.`,
          importante: false,
        };
  }
  if (a.codigo === "entidad_publica")
    return {
      titulo: "Esta organización es pública",
      texto:
        "Si recibes una pensión, una entidad pública no puede pagarte también un salario. Sí puede contratarte por prestación de servicios. Antes de aceptar, confirma con el equipo cómo será el contrato.",
      importante: true,
    };
  return {
    titulo: "Tus aportes",
    texto:
      "Como recibes pensión de vejez o de invalidez, en este trabajo no pagas aportes a pensión. Sí pagas salud y riesgos laborales.",
    importante: false,
  };
}

// La base devuelve jsonb; esto lo valida sin confiar en la forma.
export function leerAvisos(crudo: unknown): AvisoIngresos[] {
  if (!Array.isArray(crudo)) return [];
  return crudo.filter(
    (a): a is AvisoIngresos =>
      !!a && typeof a === "object" && ["colombia_mayor", "entidad_publica", "aportes"].includes((a as { codigo?: string }).codigo ?? ""),
  );
}

// Mismo cálculo que ingreso_mensual en la base (un proyecto se toma como un mes de trabajo).
export function ingresoMensual(valor: number | null, unidad: string | null, horas: number | null): number | null {
  if (valor == null) return null;
  if (unidad === "mes") return valor;
  if (unidad === "hora" && horas != null) return (valor * horas * 30) / 7;
  if (unidad === "proyecto") return ((valor / 4) * 30) / 7;
  return null;
}

// Solo para la demostración: cómo se vería el aviso a alguien que recibe Colombia Mayor y no
// contó con quién vive (se usa el tope más bajo: medio salario mínimo del parámetro actual).
export function avisoDemo(valor: number | null, unidad: string | null, horas: number | null): AvisoIngresos[] {
  const mensual = ingresoMensual(valor, unidad, horas);
  if (mensual == null) return [];
  const tope = 711750;
  return [
    { codigo: "colombia_mayor", mensual: Math.round(mensual), total: Math.round(mensual), tope, hogar: null, supera: mensual > tope },
  ];
}
