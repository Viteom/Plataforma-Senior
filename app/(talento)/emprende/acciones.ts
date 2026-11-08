"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { esCategoria, esClavePaso, esEtapa, esNecesidad, IDEA_MAX, RESPUESTA_MAX, rutaPara, type Paso } from "@/lib/emprende/ruta";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoDiagnostico = { error?: string; ruta?: Paso[]; asesoria?: boolean; idea?: string };

export async function guardarDiagnostico(_p: EstadoDiagnostico, datos: FormData): Promise<EstadoDiagnostico> {
  const etapa = datos.get("etapa");
  const necesidades = datos.getAll("necesidades").filter(esNecesidad);
  const asesoria = datos.get("asesoria") === "si";
  const crudo = datos.get("categoria");
  const categoria = esCategoria(crudo) ? crudo : null;
  const oportunidades = datos.get("oportunidades") === "si";
  const idea = String(datos.get("idea") ?? "").replace(/\s+/g, " ").trim().slice(0, IDEA_MAX) || null;
  if (!esEtapa(etapa)) return { error: "Elige en qué va tu negocio." };
  const ruta = rutaPara(etapa, necesidades);
  if (MODO_DEMO) return { ruta, asesoria, idea: idea ?? undefined };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = user
    ? await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  // Sin perfil igual se muestra la ruta; solo no se guarda.
  if (!user || !perfil) return { ruta, asesoria, idea: idea ?? undefined };

  // Si cambia sus respuestas, los pasos que ya hizo y siguen en la ruta nueva no se pierden.
  const { data: anterior } = await supabase
    .from("entrepreneurship_diagnostics")
    .select("pasos_hechos, respuestas_pasos")
    .eq("talent_id", perfil.id)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  const claves = new Set(ruta.map((p) => p.clave));
  const pasosHechos = ((anterior?.pasos_hechos as string[] | null) ?? []).filter((c) => claves.has(c));
  const respuestasPasos = Object.fromEntries(
    Object.entries((anterior?.respuestas_pasos as Record<string, string> | null) ?? {}).filter(([c]) => claves.has(c)),
  );

  const { error } = await supabase
    .from("entrepreneurship_diagnostics")
    .insert({ talent_id: perfil.id, etapa, necesidades, quiere_asesoria: asesoria, idea, categoria, quiere_oportunidades: oportunidades, pasos_hechos: pasosHechos, respuestas_pasos: respuestasPasos });
  if (error) return { error: "No pudimos guardar tu ruta. Intenta de nuevo o pide ayuda." };
  if (asesoria) {
    await supabase.from("help_requests").insert({
      user_id: user.id,
      canal: "asesoria_emprende",
      motivo: `Pidió asesoría para emprender (etapa: ${etapa}).`,
    });
  }
  revalidatePath("/emprende");
  redirect("/emprende");
}

export async function marcarPaso(clave: string, hecho: boolean): Promise<{ ok: boolean }> {
  if (!esClavePaso(clave)) return { ok: false };
  if (MODO_DEMO) return { ok: true };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("marcar_paso_emprender", { paso: clave, hecho });
  if (error) return { ok: false };
  revalidatePath("/emprende");
  return { ok: true };
}

export async function guardarRespuesta(clave: string, texto: string): Promise<{ ok: boolean; error?: string }> {
  if (!esClavePaso(clave)) return { ok: false };
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length > RESPUESTA_MAX) return { ok: false, error: `Usa máximo ${RESPUESTA_MAX} letras.` };
  if (MODO_DEMO) return { ok: true };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("guardar_respuesta_paso", { paso: clave, texto: limpio });
  if (error) return { ok: false };
  revalidatePath("/emprende");
  return { ok: true };
}
