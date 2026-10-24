import { MARCA } from "@/lib/marca";

// Diseño de los avisos a la persona en cada momento del proceso, por SMS y por WhatsApp. Es la
// propuesta para revisar antes de implementar el envío (Twilio o WhatsApp Business son de pago).
// Reglas de todos los mensajes:
//   · Nunca el nombre de la organización ni datos de la persona (se pueden reenviar o ver en la
//     pantalla bloqueada). El detalle está en la app, después de entrar con el código.
//   · Siempre «Nadie te va a pedir dinero» cuando hay algo que hacer.
//   · SMS sin tildes («Kanna», «codigo»): con una tilde deja de ser GSM-7, cabe la mitad y cuesta
//     el doble. Máximo 160 caracteres.
//   · WhatsApp sí lleva tildes y hasta 3 botones de respuesta rápida. Cada plantilla necesita
//     aprobación de Meta y que la persona haya aceptado recibir mensajes por ahí.

export type Momento = {
  id: string;
  titulo: string; // cómo lo llama el equipo
  cuando: string; // qué lo dispara
  estado: "hoy" | "propuesta"; // «hoy»: ya se encola en la base; «propuesta»: falta implementarlo
  sms: string;
  whatsapp: { texto: string; botones: string[] };
};

export type DatosMensaje = { enlace: string; conversacion_en?: string | null; conversacion_modo?: string | null; acuerdo?: string };

const NADIE = "Nadie te va a pedir dinero.";

// «jue 6 nov, 10:00 am»: corto y sin tildes para el SMS.
export function fechaSms(iso: string) {
  const f = new Date(iso);
  const dia = f
    .toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", timeZone: "America/Bogota" })
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/ de /g, " ");
  const hora = f
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" })
    .toLowerCase()
    .replace(/[  ]/g, " "); // el espacio angosto de «10:00 AM» no es GSM-7
  return `${dia}, ${hora}`.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function fechaWhatsApp(iso: string) {
  return new Date(iso).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" });
}

const MODO_SMS: Record<string, string> = { llamada: "llamada", videollamada: "videollamada", presencial: "en persona" };

export function momentos(d: DatosMensaje): Momento[] {
  const n = MARCA.nombreSms;
  const cuando = d.conversacion_en ? fechaSms(d.conversacion_en) : "jue 6 nov, 10:00 am";
  const cuandoWa = d.conversacion_en ? fechaWhatsApp(d.conversacion_en) : "jueves 6 de noviembre, 10:00 a. m.";
  const modo = MODO_SMS[d.conversacion_modo ?? ""] ?? "videollamada";
  return [
    {
      id: "oportunidad_nueva",
      titulo: "Oportunidad nueva",
      cuando: "Una organización verificada quiere conocer el perfil.",
      estado: "hoy",
      sms: `${n}: tienes una oportunidad nueva. Entra a ${d.enlace} con tu codigo. ${NADIE}`,
      whatsapp: {
        texto: `Hola. Una organización verificada quiere conocer tu perfil en Kánna. Entra para ver de qué se trata y decir si te interesa.\n\n${NADIE}`,
        botones: ["Ver la oportunidad", "Quiero que me llamen"],
      },
    },
    {
      id: "conexion_abierta",
      titulo: "La organización también quiere conocerte",
      cuando: "La organización acepta después del «Me interesa».",
      estado: "propuesta",
      sms: `${n}: la organizacion tambien quiere conocerte. Te llamamos en las proximas 24 horas habiles para ponerlos en contacto.`,
      whatsapp: {
        texto: "¡Buenas noticias! La organización también quiere conocerte. En las próximas 24 horas hábiles te llamamos para ponerlos en contacto.",
        botones: ["Ver mi proceso"],
      },
    },
    {
      id: "conversacion_agendada",
      titulo: "Conversación agendada",
      cuando: "La organización registra la fecha de la conversación.",
      estado: "hoy",
      sms: `${n}: tienes una conversacion el ${cuando} por ${modo}. Confirma en ${d.enlace}. ${NADIE}`,
      whatsapp: {
        texto: `Tu conversación quedó para el ${cuandoWa}, por ${modo}. ¿Te sirve esa fecha?\n\n${NADIE}`,
        botones: ["Sí, me sirve", "Necesito otra fecha"],
      },
    },
    {
      id: "recordatorio",
      titulo: "Recordatorio de la conversación",
      cuando: "El día anterior, a las 9 a. m.",
      estado: "propuesta",
      sms: `${n}: manana es tu conversacion (${cuando}). Si no puedes, avisanos en ${d.enlace}.`,
      whatsapp: {
        texto: `Te recordamos tu conversación de mañana: ${cuandoWa}. Si no puedes, avísanos y la movemos.`,
        botones: ["Ahí estaré", "Necesito otra fecha"],
      },
    },
    {
      id: "acuerdo_propuesto",
      titulo: "Acuerdo propuesto",
      cuando: "La organización envía cómo van a trabajar.",
      estado: "hoy",
      sms: `${n}: te propusieron un acuerdo. Revisalo en ${d.enlace} antes de aceptar. ${NADIE}`,
      whatsapp: {
        texto: `La organización te propuso un acuerdo:\n${d.acuerdo ?? "Por proyecto, 15 horas a la semana · $ 3.000.000 por proyecto"}\n\nRevísalo con calma en la app antes de aceptar. ${NADIE}`,
        botones: ["Ver el acuerdo", "Quiero que me llamen"],
      },
    },
    {
      id: "calificar",
      titulo: "Trabajo terminado",
      cuando: "La organización marca el trabajo como terminado.",
      estado: "propuesta",
      sms: `${n}: el trabajo quedo terminado. Cuentanos como te fue en ${d.enlace}. Tu calificacion ayuda a otras personas.`,
      whatsapp: {
        texto: "La organización marcó el trabajo como terminado. ¿Cómo te fue? Tu calificación ayuda a otras personas a confiar.",
        botones: ["Calificar"],
      },
    },
    {
      id: "proceso_cerrado",
      titulo: "La organización no sigue",
      cuando: "La organización decide no seguir.",
      estado: "hoy",
      sms: `${n}: la organizacion decidio no seguir por ahora. Tu perfil sigue activo para otras oportunidades.`,
      whatsapp: {
        texto: "La organización decidió no seguir por ahora. Tu perfil sigue activo y te avisamos cuando llegue otra oportunidad.",
        botones: ["Ver mis oportunidades"],
      },
    },
    {
      id: "sin_respuesta",
      titulo: "Sin respuesta a tiempo",
      cuando: "Pasan 14 días sin que la organización responda al «Me interesa».",
      estado: "propuesta",
      sms: `${n}: la organizacion no respondio a tiempo y cerramos esa oportunidad. Tu perfil sigue activo.`,
      whatsapp: {
        texto: "La organización no respondió a tiempo, así que cerramos esa oportunidad para que no sigas esperando. Tu perfil sigue activo.",
        botones: ["Ver mis oportunidades"],
      },
    },
  ];
}
