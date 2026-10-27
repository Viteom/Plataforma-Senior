"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";
export type EstadoBienestar = { error?: string; aviso?: string };
async function sesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: perfil } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!perfil) redirect("/perfil/nuevo");
  return { supabase, perfil };
}
export async function guardarMetas(
  _p: EstadoBienestar,
  d: FormData,
): Promise<EstadoBienestar> {
  const crudo = String(d.get("horas") ?? "");
  const horas = Number(crudo);
  const ingresoCrudo = String(d.get("ingreso") ?? "").trim();
  const ingreso = ingresoCrudo ? Number(ingresoCrudo) : null;
  if (!crudo.trim() || !Number.isInteger(horas) || horas < 0 || horas > 48)
    return { error: "Elige entre 0 y 48 horas a la semana." };
  if (
    ingreso !== null &&
    (!Number.isFinite(ingreso) || ingreso < 0 || ingreso > 1000000000)
  )
    return { error: "Revisa tu meta de ingreso semanal." };
  if (d.get("consentimiento") !== "si")
    return {
      error:
        "Necesitamos tu autorización para guardar estas preferencias privadas.",
    };
  if (MODO_DEMO)
    return {
      aviso: "En la demostración no se guardan preferencias personales.",
    };
  const { supabase, perfil } = await sesion();
  const { error } = await supabase.from("wellbeing_preferences").upsert({
    talent_id: perfil.id,
    horas_meta: horas,
    ingreso_meta: ingreso,
    consentimiento_en: new Date().toISOString(),
  });
  if (error)
    return {
      error: "No pudimos guardar tus metas. Intenta de nuevo o pide ayuda.",
    };
  revalidatePath("/bienestar");
  return { aviso: "Metas guardadas. Puedes cambiarlas cuando quieras." };
}
export async function registrarSeguimiento(
  _p: EstadoBienestar,
  d: FormData,
): Promise<EstadoBienestar> {
  const energia = String(d.get("energia") ?? "");
  const trato = String(d.get("trato") ?? "");
  const pago = String(d.get("pago") ?? "");
  const conexion = String(d.get("conexion") ?? "");
  if (
    !["bien", "ajustar", "pausa"].includes(energia) ||
    !["si", "no"].includes(trato) ||
    !["si", "no", "pendiente"].includes(pago)
  )
    return { error: "Responde las tres preguntas." };
  if (conexion && !/^[0-9a-f-]{36}$/i.test(conexion))
    return { error: "Elige uno de tus procesos." };
  if (MODO_DEMO)
    return {
      aviso:
        "Así quedaría tu seguimiento. La demostración no guarda respuestas.",
    };
  const { supabase, perfil } = await sesion();
  const { error } = await supabase.from("wellbeing_checkins").insert({
    talent_id: perfil.id,
    connection_id: conexion || null,
    energia,
    trato_respetuoso: trato === "si",
    pago_a_tiempo: pago === "pendiente" ? null : pago === "si",
    quiere_contacto: d.get("contacto") === "si",
  });
  if (error)
    return {
      error:
        "No pudimos guardar el seguimiento. Primero guarda tus metas y autoriza el uso de estos datos.",
    };
  revalidatePath("/bienestar");
  return {
    aviso:
      d.get("contacto") === "si"
        ? "Recibimos tu seguimiento y avisamos al equipo para que te contacte."
        : energia !== "bien" || trato === "no" || pago === "no"
          ? "Recibimos tu respuesta para revisión privada del equipo. No autorizaste contacto por este seguimiento. Puedes pedir ayuda cuando quieras."
          : "Seguimiento guardado.",
  };
}
