"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { esProcesoDemo } from "@/lib/demo-proceso";
import { avanzarProcesoDemo } from "@/lib/demo-proceso-cookie";
import {
  leerEvaluacion,
  leerMotivo,
  mensajeProceso,
} from "@/lib/procesos-formularios";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Estado = { error?: string; aviso?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO = { aviso: "En la demostración no se guarda nada." };

// En la demostración avanza de verdad un solo proceso (Alimentos del Oriente), guardado en este
// navegador. Los demás ejemplos solo se muestran.
async function pasoDemo(
  conexion: string,
  accion: string,
  extra: object,
  aviso: string,
): Promise<Estado> {
  if (!esProcesoDemo(conexion)) {
    return {
      aviso:
        "En la demostración avanza el proceso con Alimentos del Oriente. Este es solo de ejemplo.",
    };
  }
  const r = await avanzarProcesoDemo(
    "talento",
    accion,
    extra as Record<string, unknown>,
  );
  if ("error" in r) return { error: r.error };
  revalidatePath("/", "layout");
  return { aviso };
}

async function actuar(
  datos: FormData,
  accion: "me_interesa" | "no_me_interesa",
): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  if (!UUID.test(conexion)) return { error: "Oportunidad no válida." };
  if (MODO_DEMO) {
    return pasoDemo(
      conexion,
      accion,
      {},
      accion === "no_me_interesa"
        ? "Listo. No le compartimos nada a esa empresa."
        : "¡Listo! Le contamos a la empresa. Si decide conocerte, alguien de nuestro equipo te llama.",
    );
  }
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data, error } = await supabase.rpc("actuar_conexion", {
    conexion,
    accion,
  });
  if (error)
    return {
      error: "No pudimos guardar tu respuesta. Intenta de nuevo o pide ayuda.",
    };
  revalidatePath("/oportunidades");
  if (accion === "no_me_interesa")
    return { aviso: "Listo. No le compartimos nada a esa empresa." };
  return {
    aviso:
      data === "abierta"
        ? "¡Listo! Alguien de nuestro equipo te llama para ponerte en contacto con la empresa."
        : "¡Listo! Le contamos a la empresa. Si decide conocerte, alguien de nuestro equipo te llama.",
  };
}

export async function meInteresa(_p: Estado, datos: FormData) {
  return actuar(datos, "me_interesa");
}

export async function noMeInteresa(_p: Estado, datos: FormData) {
  return actuar(datos, "no_me_interesa");
}

// Reporte antifraude (A2): pausa las conexiones con esa empresa y el equipo lo revisa.
export async function reportarEmpresa(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  const motivo = String(datos.get("motivo") ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
  if (!UUID.test(conexion)) return { error: "Oportunidad no válida." };
  if (motivo.length < 3)
    return { error: "Cuéntanos en pocas palabras qué pasó." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { error } = await supabase.rpc("reportar_empresa", {
    conexion,
    motivo,
  });
  if (error)
    return { error: "No pudimos enviar el reporte. Llámanos desde Ayuda." };
  revalidatePath("/oportunidades");
  return {
    aviso:
      "Gracias. Pausamos todo con esa empresa y nuestro equipo lo revisa en máximo 2 días hábiles.",
  };
}

// ── Pasos del proceso después de abrir la conexión ──────────────────────────

async function paso(
  datos: FormData,
  accion: string,
  extra: object,
  aviso: string,
): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  if (!UUID.test(conexion)) return { error: "Oportunidad no válida." };
  if (MODO_DEMO) return pasoDemo(conexion, accion, extra, aviso);
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { error } = await supabase.rpc("avanzar_proceso", {
    conexion,
    accion,
    datos: extra,
  });
  if (error) return { error: mensajeProceso(error) };
  revalidatePath("/oportunidades");
  return { aviso };
}

// La versión de la fecha o del acuerdo que la persona tenía en pantalla.
const version = (datos: FormData) => ({
  version: Number(datos.get("version")),
});

export async function confirmarFecha(_p: Estado, datos: FormData) {
  return paso(
    datos,
    "confirmar_fecha",
    version(datos),
    "Listo. Le contamos a la organización que la fecha te sirve.",
  );
}

export async function otraFecha(_p: Estado, datos: FormData) {
  return paso(
    datos,
    "otra_fecha",
    version(datos),
    "Listo. Nuestro equipo te llama para acordar otra fecha.",
  );
}

export async function aceptarAcuerdo(_p: Estado, datos: FormData) {
  return paso(
    datos,
    "aceptar_acuerdo",
    {
      ...version(datos),
      carga_token: String(datos.get("carga_token") ?? ""),
      confirmar_carga: datos.get("confirmar_carga") === "si",
    },
    "¡Listo! Quedó el acuerdo. Cuando terminen, cuéntanos cómo te fue.",
  );
}

export async function ajustarAcuerdo(_p: Estado, datos: FormData) {
  return paso(
    datos,
    "ajustar_acuerdo",
    version(datos),
    "Listo. Nuestro equipo te llama para ajustar el acuerdo contigo.",
  );
}

export async function noSeguir(_p: Estado, datos: FormData): Promise<Estado> {
  const motivo = leerMotivo(datos, "talento");
  if ("error" in motivo) return motivo;
  return paso(
    datos,
    "no_seguir",
    { motivo: motivo.datos },
    "Listo. Cerramos este proceso. Gracias por avisar.",
  );
}

export async function terminar(_p: Estado, datos: FormData): Promise<Estado> {
  const evaluacion = leerEvaluacion(datos);
  if ("error" in evaluacion) return evaluacion;
  return paso(
    datos,
    "terminar",
    { evaluacion: evaluacion.datos },
    "Gracias. Marcamos el trabajo como terminado.",
  );
}

export async function calificar(_p: Estado, datos: FormData): Promise<Estado> {
  const evaluacion = leerEvaluacion(datos);
  if ("error" in evaluacion) return evaluacion;
  return paso(
    datos,
    "calificar",
    { evaluacion: evaluacion.datos },
    "Gracias por contarnos cómo te fue.",
  );
}
