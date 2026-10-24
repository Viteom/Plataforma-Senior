import { etiquetaForma, pesos, textoUnidad, type FormaContratar } from "@/lib/formas";

// Procesos: las mismas etapas vistas desde el talento y desde la organización. Lógica pura: dice
// en qué etapa va, a quién le toca el siguiente paso y cómo se dice, sin depender de la base.
// En la interfaz nunca se dice «pipeline», «candidato» ni «rechazado».

export type Lado = "talento" | "empresa";

export type Etapa = "invitacion" | "interes" | "conversacion" | "acuerdo" | "en_curso" | "terminado";

export const ETAPAS: { id: Etapa; nombre: string }[] = [
  { id: "invitacion", nombre: "Invitación" },
  { id: "interes", nombre: "Interés" },
  { id: "conversacion", nombre: "Conversación" },
  { id: "acuerdo", nombre: "Acuerdo" },
  { id: "en_curso", nombre: "Trabajando" },
  { id: "terminado", nombre: "Terminado" },
];

// Quién tiene la siguiente movida. «equipo»: Kánna los pone en contacto (piloto).
export type Turno = "tuyo" | "otro" | "equipo" | "nadie";

export type DatosProceso = {
  estado: string; // como lo da la vista de cada lado (enviada_talento/esperando, visible_empresa/le_interesa…)
  conversacion_en?: string | null;
  conversacion_modo?: string | null;
  conversacion_confirmada?: boolean | null;
  acuerdo_forma?: string | null;
  acuerdo_horas_semana?: number | null;
  acuerdo_valor?: number | string | null;
  acuerdo_unidad?: string | null;
  acuerdo_inicio?: string | null;
  acuerdo_nota?: string | null;
  cierre_tipo?: string | null;
  cerrada_por?: string | null;
  motivo_cierre?: string | null;
  evaluacion_propia?: number | null;
  dias_esperando?: number | null;
};

export type Situacion = {
  etapa: Etapa | null; // null: el proceso no siguió (no hay línea que mostrar)
  turno: Turno;
  titulo: string;
  detalle?: string;
  grupo: "turno" | "proceso" | "cerrado";
};

export const DIAS_PARA_RESPONDER = 14;

const MODOS: Record<string, string> = { llamada: "llamada", videollamada: "videollamada", presencial: "en persona" };

export const MOTIVOS_NO_SEGUIR: Record<Lado, string[]> = {
  talento: ["Ya no tengo tiempo", "Las condiciones no me sirven", "Encontré otra oportunidad", "Prefiero no decirlo"],
  empresa: ["Elegimos otro perfil", "El reto cambió o se pospuso", "No tenemos presupuesto por ahora", "Otra razón"],
};

// Une el vocabulario de las dos vistas en uno solo.
function normalizar(estado: string) {
  return (
    { esperando: "enviada_talento", le_interesa: "visible_empresa", no_disponible: "descarta" } as Record<string, string>
  )[estado] ?? estado;
}

export function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

export function textoConversacion(p: DatosProceso) {
  if (!p.conversacion_en) return "";
  return `${fechaHora(p.conversacion_en)}, por ${MODOS[p.conversacion_modo ?? ""] ?? "acordar"}`;
}

// «Por proyecto, 15 horas a la semana · $ 3.000.000 por proyecto · desde el 3 de noviembre»
export function textoAcuerdo(p: DatosProceso) {
  const partes = [
    [p.acuerdo_forma && etiquetaForma(p.acuerdo_forma as FormaContratar), p.acuerdo_horas_semana && `${p.acuerdo_horas_semana} horas a la semana`]
      .filter(Boolean)
      .join(", "),
    p.acuerdo_valor && `${pesos(Number(p.acuerdo_valor))} ${textoUnidad(p.acuerdo_unidad ?? "")}`.trim(),
    p.acuerdo_inicio &&
      `desde el ${new Date(`${p.acuerdo_inicio}T12:00:00-05:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: "America/Bogota" })}`,
  ];
  return partes.filter(Boolean).join(" · ");
}

export function situacion(p: DatosProceso, lado: Lado): Situacion {
  const e = normalizar(p.estado);
  const t = lado === "talento";
  const otro = t ? "la organización" : "la persona";

  switch (e) {
    case "enviada_talento":
      return t
        ? { etapa: "invitacion", turno: "tuyo", grupo: "turno", titulo: "Una organización quiere conocer tu perfil", detalle: "Dinos si te interesa." }
        : { etapa: "invitacion", turno: "otro", grupo: "proceso", titulo: "Esperando respuesta de la persona" };
    case "visible_empresa": {
      if (t) return { etapa: "interes", turno: "otro", grupo: "proceso", titulo: "Dijiste que te interesa", detalle: "Esperamos la respuesta de la organización." };
      const quedan = Math.max(DIAS_PARA_RESPONDER - (p.dias_esperando ?? 0), 1);
      return {
        etapa: "interes",
        turno: "tuyo",
        grupo: "turno",
        titulo: "Le interesa: decide si quieres conocerla",
        detalle: `Tienes ${quedan} ${quedan === 1 ? "día" : "días"} para responder. Después, la persona deja de esperar.`,
      };
    }
    case "abierta":
      return t
        ? { etapa: "conversacion", turno: "equipo", grupo: "proceso", titulo: "Conexión abierta", detalle: "Nuestro equipo los pone en contacto para acordar una conversación." }
        : { etapa: "conversacion", turno: "tuyo", grupo: "turno", titulo: "Agenda la conversación", detalle: "Nuestro equipo los pone en contacto. Cuando acuerden la fecha, regístrala aquí." };
    case "conversacion": {
      const cuando = textoConversacion(p);
      if (!p.conversacion_confirmada) {
        return t
          ? { etapa: "conversacion", turno: "tuyo", grupo: "turno", titulo: `Conversación el ${cuando}`, detalle: "Confirma si te sirve o pide otra fecha." }
          : { etapa: "conversacion", turno: "otro", grupo: "proceso", titulo: `Conversación el ${cuando}`, detalle: "Esperando que la persona confirme la fecha." };
      }
      return t
        ? { etapa: "conversacion", turno: "otro", grupo: "proceso", titulo: `Conversación confirmada: ${cuando}`, detalle: "Después de conversar, la organización te propone cómo trabajar." }
        : { etapa: "conversacion", turno: "tuyo", grupo: "turno", titulo: `Conversación confirmada: ${cuando}`, detalle: "Después de conversar, propón cómo trabajar." };
    }
    case "acuerdo":
      return t
        ? { etapa: "acuerdo", turno: "tuyo", grupo: "turno", titulo: "La organización te propone un acuerdo", detalle: textoAcuerdo(p) }
        : { etapa: "acuerdo", turno: "otro", grupo: "proceso", titulo: "Acuerdo enviado: esperando a la persona", detalle: textoAcuerdo(p) };
    case "en_curso":
      return { etapa: "en_curso", turno: "nadie", grupo: "proceso", titulo: "Trabajando juntos", detalle: textoAcuerdo(p) };
    case "cerrada":
      if (p.cierre_tipo === "no_sigue") {
        const mio = p.cerrada_por === lado;
        return {
          etapa: null,
          turno: "nadie",
          grupo: "cerrado",
          titulo: mio ? "Decidiste no seguir" : t ? "La organización decidió no seguir por ahora" : "La persona decidió no seguir",
          detalle: !mio && p.motivo_cierre ? `Motivo: ${p.motivo_cierre}.` : undefined,
        };
      }
      return p.evaluacion_propia
        ? { etapa: "terminado", turno: "nadie", grupo: "cerrado", titulo: "Terminado", detalle: "Gracias por contarnos cómo les fue." }
        : { etapa: "terminado", turno: "tuyo", grupo: "turno", titulo: "Terminado: ¿cómo te fue?", detalle: `Tu calificación ayuda a ${t ? "otras personas" : "otras organizaciones"} a confiar.` };
    case "descarta":
      return t
        ? { etapa: null, turno: "nadie", grupo: "cerrado", titulo: "Dijiste que no te interesa" }
        : { etapa: null, turno: "nadie", grupo: "cerrado", titulo: "La persona no está disponible por ahora" };
    case "sin_respuesta":
      return t
        ? { etapa: null, turno: "nadie", grupo: "cerrado", titulo: "La organización no respondió a tiempo", detalle: "Cerramos esta oportunidad para que no sigas esperando." }
        : { etapa: null, turno: "nadie", grupo: "cerrado", titulo: "No respondiste a tiempo", detalle: "La persona ya no espera esta conversación." };
    case "pausada":
      return { etapa: null, turno: "equipo", grupo: "cerrado", titulo: "En pausa mientras revisamos un reporte" };
    default:
      return { etapa: null, turno: "nadie", grupo: "cerrado", titulo: `Con ${otro}` };
  }
}

// Lo que se dice arriba del cuadro: a quién le toca, en palabras (nunca solo con color).
export function textoTurno(turno: Turno, lado: Lado) {
  if (turno === "tuyo") return "Te toca a ti";
  if (turno === "otro") return lado === "talento" ? "Le toca a la organización" : "Le toca a la persona";
  if (turno === "equipo") return "Lo tiene nuestro equipo";
  return null;
}
