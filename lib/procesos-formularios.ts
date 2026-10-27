import { esForma, type FormaContratar } from "@/lib/formas";
import { MOTIVOS_NO_SEGUIR, type Lado } from "@/lib/procesos";

// Lee y valida los formularios del proceso antes de llamar a la base (que vuelve a validar).
// Lógica pura: se prueba sin red.

type Resultado<T> = { error: string } | { datos: T };

const texto = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();

export const UNIDADES_ACUERDO = [
  { valor: "hora", etiqueta: "Por hora" },
  { valor: "conversacion", etiqueta: "Por conversación" },
  { valor: "mes", etiqueta: "Al mes" },
  { valor: "proyecto", etiqueta: "Por todo el proyecto" },
  { valor: "persona", etiqueta: "Por persona" },
] as const;

export const MODOS_CONVERSACION = [
  { valor: "llamada", etiqueta: "Llamada" },
  { valor: "videollamada", etiqueta: "Videollamada" },
  { valor: "presencial", etiqueta: "En persona" },
] as const;

// Colombia no cambia de hora: UTC-5 todo el año.
export const hoyColombia = (ahora = new Date()) =>
  new Date(ahora.getTime() - 5 * 3600_000).toISOString().slice(0, 10);

export function leerAgenda(
  datos: FormData,
  ahora = new Date(),
): Resultado<{ fecha: string; modo: string }> {
  const dia = texto(datos.get("dia"));
  const hora = texto(datos.get("hora"));
  const modo = texto(datos.get("modo"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia))
    return { error: "Elige el día de la conversación." };
  if (!/^\d{2}:\d{2}$/.test(hora))
    return { error: "Elige la hora de la conversación." };
  if (!MODOS_CONVERSACION.some((m) => m.valor === modo))
    return { error: "Elige si es por llamada, videollamada o en persona." };
  const fecha = new Date(`${dia}T${hora}:00-05:00`);
  if (Number.isNaN(fecha.getTime()))
    return { error: "Revisa el día y la hora." };
  if (fecha.getTime() <= ahora.getTime())
    return { error: "Elige un día y una hora que todavía no hayan pasado." };
  return { datos: { fecha: fecha.toISOString(), modo } };
}

export type Acuerdo = {
  forma: FormaContratar;
  horas: number | null;
  valor: number;
  unidad: string;
  inicio: string | null;
  nota: string | null;
};

export function leerAcuerdo(
  datos: FormData,
  ahora = new Date(),
): Resultado<Acuerdo> {
  const forma = texto(datos.get("forma"));
  const horasTexto = texto(datos.get("horas"));
  const valor = Number(texto(datos.get("valor")).replace(/\D/g, ""));
  const unidad = texto(datos.get("unidad"));
  const inicio = texto(datos.get("inicio")) || null;
  const nota = texto(datos.get("nota")) || null;

  if (!esForma(forma)) return { error: "Elige cómo van a trabajar." };
  const horas = horasTexto ? Number(horasTexto) : null;
  if (horas !== null && (!Number.isInteger(horas) || horas < 1 || horas > 60))
    return { error: "Las horas a la semana van de 1 a 60." };
  if (!valor || valor <= 0)
    return { error: "Escribe el valor: en Kánna el trabajo siempre se paga." };
  if (valor > 1_000_000_000)
    return { error: "Revisa el valor: parece demasiado alto." };
  if (!UNIDADES_ACUERDO.some((u) => u.valor === unidad))
    return { error: "Elige si el valor es por hora, al mes o por proyecto." };
  if (
    inicio &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || inicio < hoyColombia(ahora))
  ) {
    return { error: "La fecha de inicio no puede ser pasada." };
  }
  if (nota && nota.length > 300)
    return { error: "La nota puede tener máximo 300 letras." };
  // El contacto lo pone el equipo: nada de teléfonos ni correos en el acuerdo.
  if (nota && /\d{7,}|@/.test(nota.replace(/[\s.-]/g, ""))) {
    return {
      error:
        "No escribas teléfonos ni correos en la nota: nuestro equipo los pone en contacto.",
    };
  }
  return { datos: { forma, horas, valor, unidad, inicio, nota } };
}

export function leerMotivo(datos: FormData, lado: Lado): Resultado<string> {
  const motivo = texto(datos.get("motivo"));
  if (!MOTIVOS_NO_SEGUIR[lado].includes(motivo))
    return { error: "Elige un motivo." };
  return { datos: motivo };
}

export function leerEvaluacion(datos: FormData): Resultado<number> {
  const n = Number(datos.get("evaluacion"));
  if (!Number.isInteger(n) || n < 1 || n > 5)
    return { error: "Elige una calificación de 1 a 5." };
  return { datos: n };
}

// Errores de la base, en palabras para quien usa la app.
export function mensajeProceso(error: { message?: string } | null): string {
  const m = error?.message ?? "";
  if (/tu carga cambió/.test(m))
    return "Tu carga cambió. Recarga la página y vuelve a revisar tus horas antes de aceptar.";
  if (/revisa la carga/.test(m))
    return "Revisa las horas y confirma tu decisión, o pide ajustar el acuerdo.";
  if (/Kánna debe revisar/.test(m))
    return "Nuestro equipo está revisando las condiciones. Te avisamos cuando puedas continuar.";
  if (/acuerdo cambió/.test(m))
    return "La organización cambió el acuerdo mientras lo mirabas. Recarga la página y revisa el nuevo antes de aceptar.";
  if (/fecha cambió/.test(m))
    return "La organización cambió la fecha mientras la mirabas. Recarga la página y revisa la nueva.";
  if (/futura/.test(m))
    return "Elige un día y una hora que todavía no hayan pasado.";
  if (/valor/.test(m))
    return "El acuerdo necesita un valor: en Kánna el trabajo siempre se paga.";
  if (/sin respuesta/.test(m))
    return "Pasaron 14 días: la persona ya no espera esta respuesta.";
  if (/no permitida/.test(m))
    return "Este paso ya no está disponible. Recarga la página para ver cómo va.";
  return "No pudimos guardar. Intenta de nuevo o pide ayuda.";
}
