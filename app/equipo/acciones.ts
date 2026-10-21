"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { esForma } from "@/lib/formas";
import type { Capa } from "@/lib/ia/tipos";
import { aCandidato, COLUMNAS_CANDIDATOS } from "@/lib/matching/cargar";
import { PESOS_BRIEF, proponer, type Necesidad, type Pesos } from "@/lib/matching/puntaje";
import { crearClienteServidor } from "@/lib/supabase/server";

// Acciones del equipo (curador y admin). RLS les permite escribir estas tablas; la regla 9 la
// sigue haciendo cumplir el trigger de connections.

export type Estado = { error?: string; aviso?: string };

const DEMO = { aviso: "En la demostración no se guarda nada." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const texto = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

async function equipo() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

// ── Curaduría ───────────────────────────────────────────────────────────────

export async function calcularPropuestos(_p: Estado, datos: FormData): Promise<Estado> {
  const need = String(datos.get("need") ?? "");
  if (!UUID.test(need)) return { error: "Búsqueda no válida." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();

  const { data: n } = await supabase
    .from("needs")
    .select("company_id, formatos, modalidad, ubicacion, presupuesto, need_requirements(capa, etiqueta, taxonomy_id, obligatorio)")
    .eq("id", need)
    .single();
  if (!n) return { error: "No encontramos la búsqueda." };

  const necesidad: Necesidad = {
    requisitos: ((n.need_requirements ?? []) as { capa: Capa; etiqueta: string; taxonomy_id: string | null; obligatorio: boolean }[]).map((r) => ({
      capa: r.capa,
      etiqueta: r.etiqueta,
      taxonomyId: r.taxonomy_id,
      obligatorio: r.obligatorio,
    })),
    formatos: ((n.formatos ?? []) as string[]).filter(esForma),
    modalidad: n.modalidad,
    ubicacion: n.ubicacion,
    presupuesto: n.presupuesto,
  };

  const [{ data: filas }, { data: pesosFilas }, { data: yaConectados }] = await Promise.all([
    supabase.from("talent_profiles").select(COLUMNAS_CANDIDATOS).eq("estado", "publicado").limit(2000),
    supabase.from("matching_weights").select("componente, peso"),
    supabase.from("connections").select("talent_id").eq("need_id", need).neq("estado", "propuesta"),
  ]);
  const excluir = new Set((yaConectados ?? []).map((c) => c.talent_id as string));
  const pesos: Pesos = { ...PESOS_BRIEF, ...Object.fromEntries((pesosFilas ?? []).map((p) => [p.componente, Number(p.peso)])) };
  const candidatos = (filas ?? []).map((f) => aCandidato(f as never)).filter((c) => !excluir.has(c.id));
  const resultados = proponer(candidatos, necesidad, pesos);

  await supabase.from("connections").delete().eq("need_id", need).eq("estado", "propuesta");
  if (resultados.length) {
    const { error } = await supabase.from("connections").insert(
      resultados.map((r) => ({
        company_id: n.company_id,
        talent_id: r.talentoId,
        need_id: need,
        origen: "problema",
        estado: "propuesta",
        puntaje: r.puntaje,
        desglose: r.desglose,
        detalle_curador: { coincidencias: r.coincidencias, faltan: r.faltanObligatorios },
      })),
    );
    if (error) return { error: "No pudimos guardar los propuestos." };
  }
  revalidatePath(`/equipo/problema/${need}`);
  return { aviso: resultados.length ? `Listo: ${resultados.length} propuestos.` : "Nadie cumple la forma de contratar pedida." };
}

export async function enviarElegidos(_p: Estado, datos: FormData): Promise<Estado> {
  const need = String(datos.get("need") ?? "");
  const elegidos = datos.getAll("elegido").map(String).filter((v) => UUID.test(v));
  if (!UUID.test(need)) return { error: "Búsqueda no válida." };
  if (!elegidos.length) return { error: "Elija al menos una persona." };
  if (elegidos.length > 5) return { error: "Máximo 5 personas por búsqueda." };
  const razones = Object.fromEntries(elegidos.map((id) => [id, texto(datos.get(`razon-${id}`), 200)]));
  if (Object.values(razones).some((r) => r.length < 5)) return { error: "Escriba una línea de por qué para cada persona elegida." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();

  for (const id of elegidos) {
    const { error: e1 } = await supabase.from("connections").update({ estado: "elegida", razon_curador: razones[id] }).eq("id", id).eq("estado", "propuesta");
    if (e1) return { error: "No pudimos guardar la elección." };
    const { error: e2 } = await supabase.from("connections").update({ estado: "enviada_talento" }).eq("id", id);
    if (e2) {
      return {
        error: /sin verificar|pausada/.test(e2.message)
          ? "La empresa no está verificada o está en pausa: verifíquela en Empresas antes de enviar."
          : "No pudimos enviar a las personas elegidas.",
      };
    }
  }
  await supabase.from("connections").delete().eq("need_id", need).eq("estado", "propuesta");
  await supabase.from("needs").update({ estado: "enviada" }).eq("id", need);
  revalidatePath(`/equipo/problema/${need}`);
  revalidatePath("/equipo");
  return { aviso: `Enviado a ${elegidos.length} ${elegidos.length === 1 ? "persona" : "personas"}. Quedaron en la cola de avisos.` };
}

// ── Empresas y reportes ─────────────────────────────────────────────────────

export async function verificarEmpresa(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const fuente = texto(datos.get("fuente"), 200);
  if (!UUID.test(id)) return { error: "Empresa no válida." };
  if (fuente.length < 3) return { error: "Anote dónde lo verificó, por ejemplo «RUES, matrícula activa»." };
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { error } = await supabase
    .from("companies")
    .update({ verificada_en: new Date().toISOString(), verificada_por: user.id, verificada_fuente: fuente })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar la verificación." };
  revalidatePath("/equipo/empresas");
  return { aviso: "Empresa verificada." };
}

export async function resolverReporte(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const decision = datos.get("decision") === "confirmado" ? "confirmado" : "descartado";
  if (!UUID.test(id)) return { error: "Reporte no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { error } = await supabase.from("company_reports").update({ estado: decision, resuelto_por: user.id }).eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/empresas");
  return { aviso: decision === "confirmado" ? "Confirmado. Con dos confirmados la empresa queda en pausa." : "Descartado." };
}

// ── Evidencias y guía de tarifas ────────────────────────────────────────────

export async function revisarEvidencia(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const decision = datos.get("decision") === "verificada" ? "verificada" : "rechazada";
  const nota = texto(datos.get("nota"), 200);
  if (!UUID.test(id)) return { error: "Evidencia no válida." };
  if (decision === "verificada" && nota.length < 5) return { error: "Escriba una línea de lo que confirmó. La verá la empresa." };
  // La nota la ven empresas: no puede revelar la edad (regla 1).
  if (/\baños\b|\bedad\b|naci[óo]|pension|jubil|\b(19|20)\d\d\b/i.test(nota)) {
    return { error: "La nota no puede mencionar edad, años ni fechas: la ven las empresas." };
  }
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { error } = await supabase.from("evidence").update({ estado: decision, nota_equipo: nota || null, verificada_por: user.id }).eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/evidencias");
  return { aviso: decision === "verificada" ? "Verificada." : "Marcada como no verificable." };
}

export async function guardarGuia(_p: Estado, datos: FormData): Promise<Estado> {
  const tipo = String(datos.get("tipo") ?? "");
  const unidad = String(datos.get("unidad") ?? "");
  const minimo = Number(String(datos.get("minimo") ?? "").replace(/[^\d]/g, ""));
  const maximo = Number(String(datos.get("maximo") ?? "").replace(/[^\d]/g, ""));
  const fuente = texto(datos.get("fuente"), 200);
  if (!esForma(tipo)) return { error: "Forma de contratar no válida." };
  if (!["hora", "conversacion", "mes", "proyecto", "persona"].includes(unidad)) return { error: "Unidad no válida." };
  if (!(minimo > 0) || !(maximo >= minimo)) return { error: "El mínimo debe ser mayor que cero y no mayor que el máximo." };
  if (fuente.length < 3) return { error: "Anote de dónde sale el rango." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase
    .from("rate_guides")
    .upsert({ tipo, unidad, minimo, maximo, fuente, revisado_en: new Date().toISOString().slice(0, 10) }, { onConflict: "tipo" });
  if (error) return { error: "No pudimos guardar el rango." };
  revalidatePath("/equipo/evidencias");
  return { aviso: "Rango guardado. Ya lo ve el talento al poner su tarifa." };
}

// ── Ayuda y avisos ──────────────────────────────────────────────────────────

export async function atenderSolicitud(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  if (!UUID.test(id)) return { error: "Solicitud no válida." };
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { error } = await supabase.from("help_requests").update({ estado: "cerrada", atendido_por: user.id }).eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/ayuda");
  return { aviso: "Atendida." };
}

// Mientras no haya SMS (es de pago), el equipo avisa por llamada y lo deja anotado.
export async function avisadoPorLlamada(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  if (!UUID.test(id)) return { error: "Aviso no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase
    .from("notifications")
    .update({ estado: "omitido", motivo_omitido: "Avisado por llamada del equipo.", enviado_en: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/ayuda");
  return { aviso: "Anotado." };
}
