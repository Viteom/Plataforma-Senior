import { MARCA } from "@/lib/marca";

// Avisos al talento por SMS (brief, "Avisos al talento", A1). Lógica pura: decide qué enviar y
// cuándo. El envío real (Twilio) es de pago y está apagado; mientras tanto la cola queda visible
// para el equipo en /equipo/ayuda, que puede llamar a la persona.

export type AvisoPendiente = { id: string; userId: string | null; creadoEn: Date };

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

// Sin nombre de empresa (privacidad) y con el aviso antifraude (regla 9).
export function textoOportunidad(enlace: string) {
  return `${MARCA.nombre}: tiene una oportunidad nueva. Entre a ${enlace} con su código. Nadie le va a pedir dinero.`;
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
    // Varias oportunidades: un solo SMS que las agrupa.
    decision.enviar.push({ userId, ids, texto: textoOportunidad(enlace) });
  }
  return decision;
}

// Oportunidades sin respuesta después de 3 días: alguien del equipo llama (brief).
export function necesitanSeguimiento<T extends { enviadaEn: Date; conSeguimiento: boolean }>(conexiones: T[], ahora: Date): T[] {
  const limite = ahora.getTime() - DIAS_SEGUIMIENTO * 24 * 3600_000;
  return conexiones.filter((c) => !c.conSeguimiento && c.enviadaEn.getTime() <= limite);
}
