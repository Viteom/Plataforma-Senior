// Chat de ayuda SIN IA (la IA es de pago y está apagada): respuestas preparadas por el equipo y
// detección de riesgo antes de responder (docs/ia-desde-moai.md, sección 6). Lógica pura: corre en
// el navegador y se prueba sin red.

export type Enlace = { href: string; texto: string };

export type Respuesta =
  | { tipo: "respuesta"; texto: string; enlace?: Enlace }
  | { tipo: "riesgo"; categoria: Categoria; texto: string }
  | { tipo: "no_entendi"; texto: string };

export type Categoria = "emergencia" | "salud" | "violencia" | "fraude" | "pagos";

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();

// Antes que cualquier respuesta: estos temas los atiende una persona.
const RIESGOS: { categoria: Categoria; re: RegExp; texto: string }[] = [
  {
    categoria: "emergencia",
    re: /\b(emergencia|urgencia|ambulancia|me quiero morir|quitarme la vida|suicid\w*|no quiero vivir|accidente)\b/,
    texto: "Si es una emergencia, llame ya a la línea 123. Le pasamos con una persona de nuestro equipo.",
  },
  {
    categoria: "violencia",
    re: /\b(violencia|me pega\w*|maltrat\w*|amenaz\w*|abus\w*|acoso|me golpe\w*)\b/,
    texto: "Lo que cuenta es importante y lo debe atender una persona. Si está en peligro, llame a la línea 123. Le pasamos con alguien del equipo.",
  },
  {
    categoria: "fraude",
    re: /\b(estafa\w*|fraude|robo|me pidi\w* (plata|dinero|pago|codigo|clave)|consign\w*|cuenta bancaria|datos del banco|me robaron)\b/,
    texto: "Nadie de la plataforma ni de una empresa le va a pedir dinero, códigos ni datos del banco. No pague nada. Le pasamos con una persona del equipo para revisarlo.",
  },
  {
    categoria: "salud",
    re: /\b(enferm\w*|hospital|dolor|medic\w*|salud|clinica)\b/,
    texto: "Los temas de salud los atiende una persona, no este asistente. Le pasamos con alguien del equipo.",
  },
  {
    categoria: "pagos",
    re: /\b(pago|pagan|me pagaron|contrato|salario|sueldo|factura|cuenta de cobro|cuanto me van a pagar)\b/,
    texto: "Las preguntas sobre pagos y contratos de una oportunidad las responde una persona del equipo. Le pasamos con alguien.",
  },
];

// Preguntas frecuentes. Se elige la de más palabras clave presentes.
const PREGUNTAS: { claves: string[]; texto: string; enlace?: Enlace }[] = [
  {
    claves: ["codigo", "no llega", "no me llega", "mensaje", "sms", "entrar"],
    texto: "El código llega por mensaje de texto en menos de un minuto. Revise que el número esté bien escrito. Si no llega, espere 45 segundos y pida otro. Si sigue sin llegar, pida que le llamemos.",
    enlace: { href: "/entrar", texto: "Volver a entrar" },
  },
  {
    claves: ["huella", "historia", "contar", "etiquetas"],
    texto: "Su huella de experiencia son las etiquetas que salen de una historia de un problema que usted resolvió. Puede escribirla, contarla hablándole al celular o pedir que le llamemos.",
    enlace: { href: "/huella", texto: "Contar mi historia" },
  },
  {
    claves: ["escribir", "no se escribir", "dificil escribir", "hablar", "dictar", "voz"],
    texto: "No tiene que escribir. Puede contar su historia hablando: el celular la escribe por usted. También puede pedir que alguien del equipo le llame y la cuente por teléfono.",
    enlace: { href: "/huella", texto: "Contarla hablando" },
  },
  {
    claves: ["nombre", "reservado", "visible", "quien ve", "foto", "privado"],
    texto: "Usted decide. Con perfil reservado, las empresas ven su experiencia pero no su nombre ni su foto, hasta que usted acepte conocerlas. Lo cambia en Mi perfil.",
    enlace: { href: "/mi-perfil", texto: "Ir a Mi perfil" },
  },
  {
    claves: ["edad", "anos", "vieja", "viejo", "mayor"],
    texto: "Las empresas nunca ven su edad. La guardamos aparte y solo la ve el equipo.",
  },
  {
    claves: ["cobrar", "tarifa", "cuanto", "precio"],
    texto: "Usted pone su tarifa al crear su perfil y la puede cambiar en Mi perfil. Si no sabe cuánto cobrar, marque «Prefiero que el equipo me oriente» y le ayudamos.",
    enlace: { href: "/mi-perfil", texto: "Ir a Mi perfil" },
  },
  {
    claves: ["oportunidad", "me interesa", "empresa", "busca", "conectar"],
    texto: "Cuando una empresa necesita algo parecido a lo que usted ya resolvió, le llega una oportunidad. Si dice «Me interesa», nuestro equipo les pone en contacto. Ninguna empresa ve su nombre antes.",
    enlace: { href: "/oportunidades", texto: "Ver oportunidades" },
  },
  {
    claves: ["verificada", "confiar", "segura", "seguro", "real"],
    texto: "Revisamos cada empresa en el registro mercantil (RUES) antes de que pueda buscarle. Si algo le parece raro, use «Reportar esta empresa» en la oportunidad.",
  },
  {
    claves: ["borrar", "eliminar", "descargar", "mis datos", "cuenta"],
    texto: "En Mi perfil puede descargar todos sus datos o borrar su cuenta cuando quiera.",
    enlace: { href: "/mi-perfil", texto: "Ir a Mi perfil" },
  },
  {
    claves: ["curso", "aprender", "estudiar", "capacitacion"],
    texto: "En Aprende hay cursos gratuitos de otras entidades, elegidos para usted.",
    enlace: { href: "/aprende", texto: "Ir a Aprende" },
  },
  {
    claves: ["negocio", "emprender", "emprendimiento", "vender"],
    texto: "En Emprende responde unas preguntas y le sugerimos los pasos según la etapa de su negocio. También puede pedir asesoría.",
    enlace: { href: "/emprende", texto: "Ir a Emprende" },
  },
  {
    claves: ["taller", "experiencia", "sabedora", "sabedor", "tejido"],
    texto: "Las experiencias con saberes son talleres que guían sabedoras y sabedores para equipos de empresas. Si usted enseña un oficio tradicional, cuéntenos y le ayudamos a armar la suya.",
  },
  {
    claves: ["celular", "cambiar numero", "otro numero"],
    texto: "Para cambiar el número con el que entra, pida que le llamemos: lo hacemos con usted para cuidar su cuenta.",
  },
];

const NO_ENTENDI = "No le entendí bien. ¿Me lo dice con otras palabras? También puede pedir que le llamemos.";

export function responder(mensaje: string): Respuesta {
  const texto = normalizar(mensaje);
  if (!texto) return { tipo: "no_entendi", texto: NO_ENTENDI };

  const riesgo = RIESGOS.find((r) => r.re.test(texto));
  if (riesgo) return { tipo: "riesgo", categoria: riesgo.categoria, texto: riesgo.texto };

  let mejor: (typeof PREGUNTAS)[number] | null = null;
  let puntos = 0;
  for (const p of PREGUNTAS) {
    const n = p.claves.filter((c) => texto.includes(c)).length;
    if (n > puntos) {
      mejor = p;
      puntos = n;
    }
  }
  if (!mejor) return { tipo: "no_entendi", texto: NO_ENTENDI };
  return { tipo: "respuesta", texto: mejor.texto, enlace: mejor.enlace };
}

export const MAX_TURNOS = 12;
export const MAX_CARACTERES = 600;
