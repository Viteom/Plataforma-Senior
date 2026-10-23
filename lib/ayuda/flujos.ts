// Chat de ayuda guiado: una pregunta a la vez, en orden, confirmando cada respuesta antes de seguir
// (buena práctica de servicio para quien no usa tecnología a diario). Sin IA: flujos fijos que el
// equipo puede leer y ajustar. Lógica pura: corre en el navegador y se prueba sin red.
// Nunca pide nombre, documento, fecha de nacimiento ni datos del banco; solo el celular cuando la
// persona pide que la llamen.

import { normalizarCelular } from "@/lib/auth/destino";

import type { Enlace } from "./respuestas";

export type FlujoId = "codigo" | "llamada" | "estafa" | "historia";

export type Opcion = { valor: string; texto: string };

export type Paso =
  | { id: string; pregunta: string; tipo: "opciones"; opciones: Opcion[] }
  | { id: string; pregunta: string; tipo: "celular" }
  | { id: string; pregunta: string; tipo: "texto"; ayuda: string; max: number; opcional?: boolean };

// Qué pasa al final: solo informar, pedir la llamada o pasar el caso al equipo.
export type Accion = "ninguna" | "llamada" | "escalar";

export type Flujo = {
  id: FlujoId;
  titulo: string;
  intro: string;
  pasos: Paso[];
  accion: Accion;
};

export type Respuestas = Record<string, string>;

export type Resultado = { texto: string; enlace?: Enlace; ofrecer?: FlujoId };

const SI_NO: Opcion[] = [
  { valor: "si", texto: "Sí" },
  { valor: "no", texto: "No" },
];

export const FLUJOS: Record<FlujoId, Flujo> = {
  codigo: {
    id: "codigo",
    titulo: "No me llega el código",
    intro: "Te haré 2 preguntas, una por una, para encontrar qué pasa.",
    accion: "ninguna",
    pasos: [
      {
        id: "medio",
        tipo: "opciones",
        pregunta: "¿Por dónde pediste el código?",
        opciones: [
          { valor: "sms", texto: "Mensaje de texto" },
          { valor: "correo", texto: "Correo" },
        ],
      },
      { id: "espero", tipo: "opciones", pregunta: "¿Ya esperaste un minuto y pediste otro?", opciones: SI_NO },
    ],
  },
  llamada: {
    id: "llamada",
    titulo: "Quiero que me llamen",
    intro: "Te haré 3 preguntas, una por una. No necesitas cuenta.",
    accion: "llamada",
    pasos: [
      { id: "celular", tipo: "celular", pregunta: "¿A qué celular te llamamos? Escribe los 10 números." },
      {
        id: "franja",
        tipo: "opciones",
        pregunta: "¿A qué hora te queda bien?",
        opciones: [
          { valor: "manana", texto: "En la mañana (8 a 12)" },
          { valor: "tarde", texto: "En la tarde (2 a 6)" },
        ],
      },
      {
        id: "tema",
        tipo: "opciones",
        pregunta: "¿Sobre qué quieres hablar?",
        opciones: [
          { valor: "Entrar a Kánna", texto: "Entrar a Kánna" },
          { valor: "Mi perfil o mi historia", texto: "Mi perfil o mi historia" },
          { valor: "Una oportunidad", texto: "Una oportunidad" },
          { valor: "Otra cosa", texto: "Otra cosa" },
        ],
      },
    ],
  },
  estafa: {
    id: "estafa",
    titulo: "Algo raro con una empresa",
    intro: "Te haré 3 preguntas, una por una, y se lo pasamos a una persona del equipo.",
    accion: "escalar",
    pasos: [
      {
        id: "que",
        tipo: "opciones",
        pregunta: "¿Qué pasó?",
        opciones: [
          { valor: "Me pidieron dinero", texto: "Me pidieron dinero" },
          { valor: "Me pidieron códigos o contraseñas", texto: "Me pidieron códigos o contraseñas" },
          { valor: "Me escribieron de un número raro", texto: "Me escribieron de un número raro" },
          { valor: "Otra cosa", texto: "Otra cosa" },
        ],
      },
      { id: "pago", tipo: "opciones", pregunta: "¿Ya pagaste o entregaste algo?", opciones: SI_NO },
      {
        id: "detalle",
        tipo: "texto",
        pregunta: "Si quieres, cuéntanos en pocas palabras qué pasó.",
        ayuda: "No escribas números de cuenta, documentos ni contraseñas.",
        max: 300,
        opcional: true,
      },
    ],
  },
  historia: {
    id: "historia",
    titulo: "Cómo contar mi historia",
    intro: "Una sola pregunta.",
    accion: "ninguna",
    pasos: [
      {
        id: "como",
        tipo: "opciones",
        pregunta: "¿Cómo te queda más fácil contarla?",
        opciones: [
          { valor: "escribir", texto: "Escribiéndola" },
          { valor: "hablar", texto: "Hablándole al celular" },
          { valor: "llamada", texto: "Que alguien me llame" },
        ],
      },
    ],
  },
};

export const MENU: FlujoId[] = ["codigo", "llamada", "estafa", "historia"];

// Valida una respuesta. Devuelve el mensaje de error o null si está bien.
export function validar(paso: Paso, valor: string): string | null {
  const v = valor.trim();
  if (paso.tipo === "opciones") return paso.opciones.some((o) => o.valor === v) ? null : "Elige una de las opciones.";
  if (paso.tipo === "celular") return normalizarCelular(v) ? null : "Escribe los 10 números del celular. Empieza por 3.";
  if (!v && paso.opcional) return null;
  if (!v) return "Escribe tu respuesta o toca «Seguir sin escribir».";
  if (v.length > paso.max) return `Usa máximo ${paso.max} letras.`;
  if (/\d{7,}|@/.test(v.replace(/\s/g, ""))) return "No escribas números de cuenta, teléfonos ni correos aquí.";
  return null;
}

// Cómo se repite la respuesta al confirmarla. El celular va enmascarado: «300 *** 4567».
export function textoRespuesta(paso: Paso, valor: string): string {
  if (paso.tipo === "opciones") return paso.opciones.find((o) => o.valor === valor)?.texto ?? valor;
  if (paso.tipo === "celular") {
    const n = (normalizarCelular(valor) ?? valor).replace(/\D/g, "").slice(-10);
    return `${n.slice(0, 3)} *** ${n.slice(-4)}`;
  }
  return valor.trim() || "Sin detalle";
}

export function resumen(flujo: Flujo, respuestas: Respuestas): string[] {
  return flujo.pasos.map((p) => `${p.pregunta.split("?")[0].replace("¿", "")}: ${textoRespuesta(p, respuestas[p.id] ?? "")}`);
}

export function resultado(flujo: Flujo, r: Respuestas): Resultado {
  switch (flujo.id) {
    case "codigo":
      if (r.medio === "correo") {
        return {
          texto:
            "Revisa la carpeta de correo no deseado (spam) y busca un mensaje de Kánna. Si no está, espera un minuto y pide otro código.",
          enlace: { href: "/entrar", texto: "Volver a pedir el código" },
          ofrecer: "llamada",
        };
      }
      return r.espero === "no"
        ? {
            texto: "A veces tarda. Espera un minuto, revisa que el número esté bien escrito y pide otro código.",
            enlace: { href: "/entrar", texto: "Volver a pedir el código" },
          }
        : {
            texto: "Si ya esperaste y pediste otro, lo mejor es que te llamemos y lo resolvamos juntos.",
            ofrecer: "llamada",
          };
    case "historia":
      if (r.como === "llamada") return { texto: "Perfecto, te llamamos y la contamos juntos.", ofrecer: "llamada" };
      return {
        texto:
          r.como === "hablar"
            ? "En «Contar mi historia» toca «Contarla hablando»: el celular escribe lo que dices y luego lo puedes corregir."
            : "En «Contar mi historia» escríbela con tus palabras: qué pasó, qué hiciste y cómo terminó. No importa la ortografía.",
        enlace: { href: "/huella", texto: "Contar mi historia" },
      };
    case "estafa":
      return {
        texto:
          r.pago === "si"
            ? "Lo pasamos a una persona del equipo. Como ya entregaste algo, denúncialo también en la Policía (línea 123) y avisa a tu banco. No sigas hablando con esa persona."
            : "Lo pasamos a una persona del equipo. No pagues ni entregues nada: nadie de Kánna ni de una empresa te lo va a pedir.",
      };
    case "llamada":
      return {
        texto: `Listo. Te llamamos en la ${r.franja === "tarde" ? "tarde (2 a 6)" : "mañana (8 a 12)"} desde el número de Kánna.`,
      };
  }
}

// Lo que el equipo recibe cuando el caso pasa a una persona: corto y sin datos personales.
export function motivoParaEquipo(flujo: Flujo, r: Respuestas): string {
  if (flujo.id === "llamada") return `Pidió llamada desde el chat. Tema: ${r.tema ?? "sin tema"}.`;
  const partes = flujo.pasos.filter((p) => p.tipo !== "celular").map((p) => textoRespuesta(p, r[p.id] ?? ""));
  return `${flujo.titulo}: ${partes.join(" · ")}`.slice(0, 300);
}
