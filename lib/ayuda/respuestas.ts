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
    texto: "Si es una emergencia, llama ya a la línea 123. Te pasamos con una persona de nuestro equipo.",
  },
  {
    categoria: "violencia",
    re: /\b(violencia|me pega\w*|maltrat\w*|amenaz\w*|abus\w*|acoso|me golpe\w*)\b/,
    texto: "Lo que cuentas es importante y lo debe atender una persona. Si estás en peligro, llama a la línea 123. Te pasamos con alguien del equipo.",
  },
  {
    categoria: "fraude",
    re: /\b(estafa\w*|fraude|robo|me pidi\w* (plata|dinero|pago|codigo|clave)|consign\w*|cuenta bancaria|datos del banco|me robaron)\b/,
    texto: "Nadie de Kánna ni de una empresa te va a pedir dinero, códigos ni datos del banco. No pagues nada. Te pasamos con una persona del equipo para revisarlo.",
  },
  {
    categoria: "salud",
    re: /\b(enferm\w*|hospital|dolor|medic\w*|salud|clinica)\b/,
    texto: "Los temas de salud los atiende una persona, no este asistente. Te pasamos con alguien del equipo.",
  },
  {
    categoria: "pagos",
    re: /\b(pago|pagan|me pagaron|contrato|salario|sueldo|factura|cuenta de cobro|cuanto me van a pagar)\b/,
    texto: "Las preguntas sobre pagos y contratos de una oportunidad las responde una persona del equipo. Te pasamos con alguien.",
  },
];

// Preguntas frecuentes. Se elige la de más palabras clave presentes.
const PREGUNTAS: { claves: string[]; texto: string; enlace?: Enlace }[] = [
  {
    claves: ["codigo", "no llega", "no me llega", "mensaje", "sms", "entrar"],
    texto: "El código llega por mensaje de texto en menos de un minuto. Revisa que el número esté bien escrito. Si no llega, espera 45 segundos y pide otro. Si sigue sin llegar, pide que te llamemos.",
    enlace: { href: "/entrar", texto: "Volver a entrar" },
  },
  {
    claves: ["huella", "historia", "contar", "etiquetas"],
    texto: "Tu huella de experiencia son las etiquetas que salen de la historia de un reto que resolviste. Puedes escribirla, contarla hablándole al celular o pedir que te llamemos.",
    enlace: { href: "/huella", texto: "Contar mi historia" },
  },
  {
    claves: ["escribir", "no se escribir", "dificil escribir", "hablar", "dictar", "voz"],
    texto: "No tienes que escribir. Puedes contar tu historia hablando: el celular la escribe por ti. También puedes pedir que alguien del equipo te llame y la cuentes por teléfono.",
    enlace: { href: "/huella", texto: "Contarla hablando" },
  },
  {
    claves: ["nombre", "reservado", "visible", "quien ve", "foto", "privado"],
    texto: "Tú decides. Con perfil reservado, las empresas ven tu experiencia pero no tu nombre ni tu foto, hasta que aceptes conocerlas. Lo cambias en Mi perfil.",
    enlace: { href: "/mi-perfil", texto: "Ir a Mi perfil" },
  },
  {
    claves: ["edad", "anos", "vieja", "viejo", "mayor"],
    texto: "Las empresas nunca ven tu edad. La guardamos aparte y solo la ve el equipo.",
  },
  {
    claves: ["cobrar", "tarifa", "cuanto", "precio"],
    texto: "Tú pones tu tarifa al crear tu perfil y la puedes cambiar en Mi perfil. Si no sabes cuánto cobrar, marca «Prefiero que el equipo me oriente» y te ayudamos.",
    enlace: { href: "/mi-perfil", texto: "Ir a Mi perfil" },
  },
  {
    claves: ["oportunidad", "me interesa", "empresa", "busca", "conectar"],
    texto: "Cuando una empresa busca una experiencia como la tuya, te llega una oportunidad. Si dices «Me interesa», nuestro equipo los pone en contacto. Ninguna empresa ve tu nombre antes.",
    enlace: { href: "/oportunidades", texto: "Ver oportunidades" },
  },
  {
    claves: ["verificada", "confiar", "segura", "seguro", "real"],
    texto: "Revisamos cada empresa en el registro mercantil (RUES) antes de que pueda buscarte. Si algo te parece raro, usa «Reportar esta empresa» en la oportunidad.",
  },
  {
    claves: ["borrar", "eliminar", "descargar", "mis datos", "cuenta"],
    texto: "En Mi perfil puedes descargar todos tus datos o borrar tu cuenta cuando quieras.",
    enlace: { href: "/mi-perfil", texto: "Ir a Mi perfil" },
  },
  {
    claves: ["curso", "aprender", "estudiar", "capacitacion"],
    texto: "En Aprende hay cursos gratuitos de otras entidades, elegidos para ti.",
    enlace: { href: "/aprende", texto: "Ir a Aprende" },
  },
  {
    claves: ["negocio", "emprender", "emprendimiento", "vender"],
    texto: "En Emprende respondes unas preguntas y te sugerimos los pasos según la etapa de tu negocio. También puedes pedir asesoría.",
    enlace: { href: "/emprende", texto: "Ir a Emprende" },
  },
  {
    claves: ["taller", "experiencia", "sabedora", "sabedor", "tejido", "campo", "encargo", "artesania", "artesanía"],
    texto: "Talento del campo son talleres y oficios por encargo con personas del territorio, que Vasees arma con ellas. Si tienes un oficio o un saber tradicional, cuéntanos y te ayudamos a armar tu oferta.",
  },
  {
    claves: ["celular", "cambiar numero", "otro numero"],
    texto: "Para cambiar el número con el que entras, pide que te llamemos: lo hacemos contigo para cuidar tu cuenta.",
  },
];

const NO_ENTENDI = "No te entendí bien. ¿Me lo dices con otras palabras? También puedes pedir que te llamemos.";

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
