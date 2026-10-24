import { MARCA } from "@/lib/marca";

// Avisos al talento por SMS (brief, "Avisos al talento", A1). Lógica pura: decide qué enviar y
// cuándo. El envío real (Twilio) es de pago y está apagado; mientras tanto la cola queda visible
// para el equipo en /equipo/ayuda, que puede llamar a la persona.

export type AvisoPendiente = { id: string; userId: string | null; creadoEn: Date; plantilla?: string };

// Qué dice cada aviso en la cola del equipo (y por qué se envía).
export const TEXTO_PLANTILLA: Record<string, string> = {
  oportunidad_nueva: "Oportunidad nueva",
  conversacion_agendada: "La organización agendó una conversación",
  acuerdo_propuesto: "La organización propuso un acuerdo",
  proceso_cerrado: "La organización decidió no seguir",
};

export type Decision = {
  enviar: { userId: string; ids: string[]; texto: string }[];
  omitir: { id: string; motivo: string }[];
  esperar: string[]; // fuera de horario o ya se envió uno hoy
};

const HORA_INICIO = 8;
const HORA_FIN = 19; // hasta las 7 p. m.
const DIAS_SEGUIMIENTO = 3;

// Colombia no cambia de hora: UTC-5 todo el año.
export function horaColombia(fecha: Date) {
  return (fecha.getUTCHours() + 24 - 5) % 24;
}

export function diaColombia(fecha: Date) {
  return new Date(fecha.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
}

// Sin nombre de empresa (privacidad) y con el aviso antifraude (regla 9). El nombre va sin
// tildes («Kanna», «codigo»): con «á» u «ó» el SMS deja de ser GSM-7, cabe la mitad y cuesta el doble.
export function textoOportunidad(enlace: string) {
  return `${MARCA.nombreSms}: tienes una oportunidad nueva. Entra a ${enlace} con tu codigo. Nadie te va a pedir dinero.`;
}

// Para los pasos del proceso: tampoco dice la empresa ni el detalle, solo que hay algo que ver.
export function textoNovedad(enlace: string) {
  return `${MARCA.nombreSms}: hay novedades en tu proceso. Entra a ${enlace} con tu codigo. Nadie te va a pedir dinero.`;
}

export function decidirEnvios(
  pendientes: AvisoPendiente[],
  ahora: Date,
  enviadosHoy: Set<string>, // personas que ya recibieron un SMS hoy (hora de Colombia)
  enlace: string,
): Decision {
  const decision: Decision = { enviar: [], omitir: [], esperar: [] };
  const hora = horaColombia(ahora);
  const enHorario = hora >= HORA_INICIO && hora < HORA_FIN;

  const porPersona = new Map<string, AvisoPendiente[]>();
  for (const p of pendientes) {
    if (!p.userId) {
      decision.omitir.push({ id: p.id, motivo: "La persona no tiene cuenta propia: llamarla." });
      continue;
    }
    porPersona.set(p.userId, [...(porPersona.get(p.userId) ?? []), p]);
  }

  for (const [userId, avisos] of porPersona) {
    const ids = avisos.map((a) => a.id);
    if (!enHorario || enviadosHoy.has(userId)) {
      decision.esperar.push(...ids);
      continue;
    }
    // Varios avisos: un solo SMS que los agrupa. Si alguno es una oportunidad nueva, se dice eso.
    const nueva = avisos.some((a) => (a.plantilla ?? "oportunidad_nueva") === "oportunidad_nueva");
    decision.enviar.push({ userId, ids, texto: nueva ? textoOportunidad(enlace) : textoNovedad(enlace) });
  }
  return decision;
}

// Oportunidades sin respuesta después de 3 días: alguien del equipo llama (brief).
export function necesitanSeguimiento<T extends { enviadaEn: Date; conSeguimiento: boolean }>(conexiones: T[], ahora: Date): T[] {
  const limite = ahora.getTime() - DIAS_SEGUIMIENTO * 24 * 3600_000;
  return conexiones.filter((c) => !c.conSeguimiento && c.enviadaEn.getTime() <= limite);
}
