"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Estado = { error?: string; aviso?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEMO = { aviso: "En la demostración no se guarda nada." };

async function actuar(datos: FormData, accion: "me_interesa" | "no_me_interesa"): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  if (!UUID.test(conexion)) return { error: "Oportunidad no válida." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data, error } = await supabase.rpc("actuar_conexion", { conexion, accion });
  if (error) return { error: "No pudimos guardar tu respuesta. Intenta de nuevo o pide ayuda." };
  revalidatePath("/oportunidades");
  if (accion === "no_me_interesa") return { aviso: "Listo. No le compartimos nada a esa empresa." };
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
export async function reportarEmpresa(_p: Estado, datos: FormData): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  const motivo = String(datos.get("motivo") ?? "").replace(/\s+/g, " ").trim().slice(0, 1000);
  if (!UUID.test(conexion)) return { error: "Oportunidad no válida." };
  if (motivo.length < 3) return { error: "Cuéntanos en pocas palabras qué pasó." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { error } = await supabase.rpc("reportar_empresa", { conexion, motivo });
  if (error) return { error: "No pudimos enviar el reporte. Llámanos desde Ayuda." };
  revalidatePath("/oportunidades");
  return { aviso: "Gracias. Pausamos todo con esa empresa y nuestro equipo lo revisa en máximo 2 días hábiles." };
}
