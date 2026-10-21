"use server";

import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { obtenerProveedor } from "@/lib/ia/entorno";
import { extraerHuella } from "@/lib/ia/extraer";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import type { Capa } from "@/lib/ia/tipos";
import { crearClienteServidor } from "@/lib/supabase/server";

// Historia → etiquetas sin confirmar → la persona confirma (brief, "Huella de experiencia").
// La vía manual (elegir de la taxonomía) existe siempre: con la IA apagada, sin cuota o con error.

export type EtiquetaParaConfirmar = {
  id: string; // id en footprint_tags
  capa: Capa;
  etiqueta: string;
  nueva: boolean; // fuera de la taxonomía: el equipo la revisa
};

export type EstadoHuella = {
  error?: string;
  historiaId?: string;
  modo?: "ia" | "manual";
  motivoManual?: "apagada" | "cuota" | "error";
  etiquetas?: EtiquetaParaConfirmar[];
  dudas?: string[];
};

const MIN = 40;
const MAX = 6000;

// Los ids llegan del formulario y terminan en un filtro de PostgREST: solo UUID válidos.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const soloUuid = (valores: FormDataEntryValue[]) => valores.map(String).filter((v) => UUID.test(v));

export async function guardarHistoria(_previo: EstadoHuella, datos: FormData): Promise<EstadoHuella> {
  const historia = String(datos.get("historia") ?? "").trim();
  const origen = datos.get("origen") === "dictado" ? "dictado" : "escrito";
  if (historia.length < MIN) {
    return { error: "Cuéntenos un poco más: qué pasó, qué hizo usted y cómo terminó." };
  }
  if (historia.length > MAX) return { error: "La historia es muy larga. Intente resumirla un poco." };

  if (MODO_DEMO) {
    // Ejemplo fijo para revisar la pantalla de confirmación sin IA ni base de datos.
    return {
      historiaId: "demo",
      modo: "ia",
      etiquetas: [
        { id: "00000000-0000-4000-8000-000000000001", capa: "situaciones", etiqueta: "Apertura de una planta nueva", nueva: false },
        { id: "00000000-0000-4000-8000-000000000002", capa: "contexto", etiqueta: "Empresa familiar", nueva: false },
        { id: "00000000-0000-4000-8000-000000000003", capa: "escala", etiqueta: "Equipo de 40 personas", nueva: true },
        { id: "00000000-0000-4000-8000-000000000004", capa: "oficio", etiqueta: "Producción de alimentos", nueva: false },
        { id: "00000000-0000-4000-8000-000000000005", capa: "normas", etiqueta: "INVIMA", nueva: false },
        { id: "00000000-0000-4000-8000-000000000006", capa: "transferir", etiqueta: "Formó a supervisores", nueva: false },
      ],
      dudas: ["¿Cuántas personas tenía a cargo?"],
    };
  }

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase.from("talent_profiles").select("id, nombre").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/perfil/nuevo");

  // La historia original queda guardada para la persona y el equipo; a la IA va la versión preparada.
  const { data: guardada, error } = await supabase
    .from("stories")
    .insert({ talent_id: perfil.id, texto: historia, origen })
    .select("id")
    .single();
  if (error || !guardada) return { error: "No pudimos guardar su historia. Intente de nuevo o pida ayuda." };

  const { data: tax } = await supabase.from("taxonomy").select("id, capa, etiqueta, sinonimos");
  const taxonomia = (tax ?? []) as EntradaTaxonomia[];

  const resultado = await extraerHuella({
    historia,
    nombrePersona: perfil.nombre,
    taxonomia,
    proveedor: obtenerProveedor(),
    cuota: {
      reservar: async (tarea, modelo) => {
        const { data } = await supabase.rpc("reservar_uso_ia", { tarea, modelo });
        return (data as string | null) ?? null;
      },
      cerrar: async (uso, resultado) => {
        await supabase.rpc("cerrar_uso_ia", { uso, resultado });
      },
    },
  });

  if (resultado.estado === "manual") {
    return { historiaId: guardada.id, modo: "manual", motivoManual: resultado.motivo, etiquetas: [] };
  }

  // Las etiquetas llegan sin confirmar; la persona quita las que no son suyas.
  const { data: insertadas } = await supabase
    .from("footprint_tags")
    .insert(
      resultado.etiquetas.map((e) => ({
        talent_id: perfil.id,
        story_id: guardada.id,
        capa: e.capa,
        etiqueta: e.etiqueta,
        taxonomy_id: e.taxonomyId,
        confirmada: false,
      })),
    )
    .select("id, capa, etiqueta, taxonomy_id");

  return {
    historiaId: guardada.id,
    modo: "ia",
    etiquetas: (insertadas ?? []).map((e) => ({
      id: e.id as string,
      capa: e.capa as Capa,
      etiqueta: e.etiqueta as string,
      nueva: e.taxonomy_id === null,
    })),
    dudas: resultado.dudas,
  };
}

export async function confirmarHuella(_previo: { error?: string }, datos: FormData): Promise<{ error?: string }> {
  const historiaCruda = String(datos.get("historiaId") ?? "");
  const historiaId = UUID.test(historiaCruda) ? historiaCruda : null;
  const seleccionadas = soloUuid(datos.getAll("seleccionada"));
  const agregadas = soloUuid(datos.getAll("agregada"));

  if (!seleccionadas.length && !agregadas.length) {
    return { error: "Elija al menos una etiqueta que describa su experiencia." };
  }
  if (MODO_DEMO) redirect("/mi-perfil");

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: perfil } = await supabase.from("talent_profiles").select("id, estado").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/perfil/nuevo");

  const fallo = { error: "No pudimos guardar sus etiquetas. Intente de nuevo o pida ayuda." };

  // Las que la persona quitó se borran; las que dejó quedan confirmadas.
  if (historiaId) {
    let borrar = supabase.from("footprint_tags").delete().eq("story_id", historiaId).eq("confirmada", false);
    if (seleccionadas.length) borrar = borrar.not("id", "in", `(${seleccionadas.join(",")})`);
    const { error: errorBorrar } = await borrar;
    if (errorBorrar) return fallo;
  }

  if (seleccionadas.length) {
    const { error } = await supabase.from("footprint_tags").update({ confirmada: true }).in("id", seleccionadas);
    if (error) return fallo;
  }

  if (agregadas.length) {
    const { data: tax } = await supabase.from("taxonomy").select("id, capa, etiqueta").in("id", agregadas);
    const { error } = await supabase.from("footprint_tags").insert(
      (tax ?? []).map((t) => ({
        talent_id: perfil.id,
        story_id: historiaId,
        capa: t.capa,
        etiqueta: t.etiqueta,
        taxonomy_id: t.id,
        confirmada: true,
      })),
    );
    if (error) return fallo;
  }

  // Con la huella confirmada, el perfil queda disponible para las empresas según su visibilidad.
  if (perfil.estado === "borrador") {
    await supabase.from("talent_profiles").update({ estado: "publicado" }).eq("id", perfil.id);
  }

  redirect("/mi-perfil");
}
