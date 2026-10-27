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
const texto = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

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
    .select(
      "company_id, formatos, modalidad, ubicacion, presupuesto, need_requirements(capa, etiqueta, taxonomy_id, obligatorio)",
    )
    .eq("id", need)
    .single();
  if (!n) return { error: "No encontramos la búsqueda." };

  const necesidad: Necesidad = {
    requisitos: (
      (n.need_requirements ?? []) as {
        capa: Capa;
        etiqueta: string;
        taxonomy_id: string | null;
        obligatorio: boolean;
      }[]
    ).map((r) => ({
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
  const pesos: Pesos = {
    ...PESOS_BRIEF,
    ...Object.fromEntries((pesosFilas ?? []).map((p) => [p.componente, Number(p.peso)])),
  };
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
        detalle_curador: {
          coincidencias: r.coincidencias,
          faltan: r.faltanObligatorios,
        },
      })),
    );
    if (error) return { error: "No pudimos guardar los propuestos." };
  }
  revalidatePath(`/equipo/problema/${need}`);
  return {
    aviso: resultados.length ? `Listo: ${resultados.length} propuestos.` : "Nadie cumple la forma de contratar pedida.",
  };
}

export async function enviarElegidos(_p: Estado, datos: FormData): Promise<Estado> {
  const need = String(datos.get("need") ?? "");
  const elegidos = datos
    .getAll("elegido")
    .map(String)
    .filter((v) => UUID.test(v));
  if (!UUID.test(need)) return { error: "Búsqueda no válida." };
  if (!elegidos.length) return { error: "Elige al menos una persona." };
  if (elegidos.length > 5) return { error: "Máximo 5 personas por búsqueda." };
  const razones = Object.fromEntries(elegidos.map((id) => [id, texto(datos.get(`razon-${id}`), 200)]));
  if (Object.values(razones).some((r) => r.length < 5))
    return { error: "Escribe una línea de por qué para cada persona elegida." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();

  for (const id of elegidos) {
    const { error: e1 } = await supabase
      .from("connections")
      .update({ estado: "elegida", razon_curador: razones[id] })
      .eq("id", id)
      .eq("estado", "propuesta");
    if (e1) return { error: "No pudimos guardar la elección." };
    const { error: e2 } = await supabase.from("connections").update({ estado: "enviada_talento" }).eq("id", id);
    if (e2) {
      return {
        error: /sin verificar|pausada/.test(e2.message)
          ? "La empresa no está verificada o está en pausa: verifícala en Empresas antes de enviar."
          : "No pudimos enviar a las personas elegidas.",
      };
    }
  }
  await supabase.from("connections").delete().eq("need_id", need).eq("estado", "propuesta");
  await supabase.from("needs").update({ estado: "enviada" }).eq("id", need);
  revalidatePath(`/equipo/problema/${need}`);
  revalidatePath("/equipo");
  return {
    aviso: `Enviado a ${elegidos.length} ${elegidos.length === 1 ? "persona" : "personas"}. Quedaron en la cola de avisos.`,
  };
}

// ── Empresas y reportes ─────────────────────────────────────────────────────

export async function verificarEmpresa(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const fuente = texto(datos.get("fuente"), 200);
  if (!UUID.test(id)) return { error: "Empresa no válida." };
  if (fuente.length < 3)
    return {
      error: "Anota dónde lo verificaste, por ejemplo «RUES, matrícula activa».",
    };
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { error } = await supabase
    .from("companies")
    .update({
      verificada_en: new Date().toISOString(),
      verificada_por: user.id,
      verificada_fuente: fuente,
    })
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
  const { error } = await supabase
    .from("company_reports")
    .update({ estado: decision, resuelto_por: user.id })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/empresas");
  return {
    aviso: decision === "confirmado" ? "Confirmado. Con dos confirmados la empresa queda en pausa." : "Descartado.",
  };
}

// ── Evidencias y guía de tarifas ────────────────────────────────────────────

export async function revisarEvidencia(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const decision = datos.get("decision") === "verificada" ? "verificada" : "rechazada";
  const nota = texto(datos.get("nota"), 200);
  if (!UUID.test(id)) return { error: "Evidencia no válida." };
  if (decision === "verificada" && nota.length < 5)
    return {
      error: "Escribe una línea de lo que confirmaste. La verá la empresa.",
    };
  // La nota la ven empresas: no puede revelar la edad (regla 1).
  if (/\baños\b|\bedad\b|naci[óo]|pension|jubil|\b(19|20)\d\d\b/i.test(nota)) {
    return {
      error: "La nota no puede mencionar edad, años ni fechas: la ven las empresas.",
    };
  }
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { error } = await supabase
    .from("evidence")
    .update({
      estado: decision,
      nota_equipo: nota || null,
      verificada_por: user.id,
    })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/evidencias");
  return {
    aviso: decision === "verificada" ? "Verificada." : "Marcada como no verificable.",
  };
}

export async function guardarGuia(_p: Estado, datos: FormData): Promise<Estado> {
  const tipo = String(datos.get("tipo") ?? "");
  const unidad = String(datos.get("unidad") ?? "");
  const minimo = Number(String(datos.get("minimo") ?? "").replace(/[^\d]/g, ""));
  const maximo = Number(String(datos.get("maximo") ?? "").replace(/[^\d]/g, ""));
  const fuente = texto(datos.get("fuente"), 200);
  if (!esForma(tipo)) return { error: "Forma de contratar no válida." };
  if (!["hora", "conversacion", "mes", "proyecto", "persona"].includes(unidad)) return { error: "Unidad no válida." };
  if (!(minimo > 0) || !(maximo >= minimo))
    return {
      error: "El mínimo debe ser mayor que cero y no mayor que el máximo.",
    };
  if (fuente.length < 3) return { error: "Anota de dónde sale el rango." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.from("rate_guides").upsert(
    {
      tipo,
      unidad,
      minimo,
      maximo,
      fuente,
      revisado_en: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "tipo" },
  );
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
  const { data, error } = await supabase
    .from("help_requests")
    .update({ estado: "cerrada", atendido_por: user.id })
    .eq("id", id)
    .is("wellbeing_case_id", null)
    .select("id");
  if (error || !data?.length)
    return {
      error: "No pudimos guardar. Los casos de bienestar se gestionan desde su cola privada.",
    };
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
    .update({
      estado: "omitido",
      motivo_omitido: "Avisado por llamada del equipo.",
      enviado_en: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "No pudimos guardar." };
  revalidatePath("/equipo/ayuda");
  return { aviso: "Anotado." };
}

// ── Experiencias con saberes ────────────────────────────────────────────────

const lineas = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const numero = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return String(v ?? "").trim() && Number.isFinite(n) ? n : null;
};

const aSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export async function guardarExperiencia(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const tipo = datos.get("tipo") === "oficio" ? "oficio" : "experiencia";
  const nombre = texto(datos.get("nombre"), 120);
  const proposito = texto(datos.get("proposito"), 2000);
  const formatos = datos
    .getAll("formatos")
    .map(String)
    .filter((f) => f === "territorio" || f === "sede");
  if (nombre.length < 3) return { error: "Escribe el nombre de la oferta." };
  if (proposito.length < 20) return { error: "Cuenta el propósito en al menos una frase." };
  if (!formatos.length) return { error: "Elige al menos un formato." };

  // "Título: descripción" por línea.
  const momentos = lineas(datos.get("momentos")).map((l) => {
    const [titulo, ...resto] = l.split(":");
    return { titulo: titulo.trim(), descripcion: resto.join(":").trim() };
  });
  const grupoMin = numero(datos.get("grupo_min"));
  const grupoMax = numero(datos.get("grupo_max"));
  if (grupoMin && grupoMax && grupoMax < grupoMin) return { error: "El máximo no puede ser menor que el mínimo." };
  const porcentaje = numero(datos.get("porcentaje_sabedora"));
  if (porcentaje !== null && (porcentaje < 0 || porcentaje > 100))
    return { error: "El porcentaje para quien lo hace va de 0 a 100." };

  const campos = {
    tipo,
    nombre,
    proposito,
    sabedora_nombre: texto(datos.get("sabedora_nombre"), 120) || null,
    sabedora_pueblo: texto(datos.get("sabedora_pueblo"), 120) || null,
    para_quien: texto(datos.get("para_quien"), 200) || null,
    temas: String(datos.get("temas") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    beneficios: lineas(datos.get("beneficios")),
    momentos,
    formatos,
    lugar: texto(datos.get("lugar"), 200) || null,
    duracion: texto(datos.get("duracion"), 80) || null,
    grupo_min: grupoMin,
    grupo_max: grupoMax,
    precio_desde: numero(datos.get("precio_desde")),
    porcentaje_sabedora: porcentaje,
    testimonio: texto(datos.get("testimonio"), 1000) || null,
    // Se guarda la fecha de la aprobación: sin ella la base no deja publicar.
    aprobada_por_sabedora_en: datos.get("aprobada") === "si" ? new Date().toISOString() : null,
  };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();

  if (UUID.test(id)) {
    const { data: actual } = await supabase
      .from("experiences")
      .select("estado, aprobada_por_sabedora_en")
      .eq("id", id)
      .single();
    // Conserva la fecha original si ya estaba aprobada; si se quita la aprobación, deja de estar publicada.
    const aprobada = campos.aprobada_por_sabedora_en
      ? (actual?.aprobada_por_sabedora_en ?? campos.aprobada_por_sabedora_en)
      : null;
    const estado = !aprobada && actual?.estado === "publicada" ? "borrador" : actual?.estado;
    const { error } = await supabase
      .from("experiences")
      .update({ ...campos, aprobada_por_sabedora_en: aprobada, estado })
      .eq("id", id);
    if (error) return { error: "No pudimos guardar la oferta." };
  } else {
    const { error } = await supabase.from("experiences").insert({
      ...campos,
      slug: `${aSlug(nombre)}-${crypto.randomUUID().slice(0, 4)}`,
    });
    if (error) return { error: "No pudimos crear la oferta." };
  }
  revalidatePath("/equipo/experiencias");
  revalidatePath("/empresa/campo");
  return { aviso: "Guardada." };
}

export async function cambiarEstadoExperiencia(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const estado = ["borrador", "publicada", "pausada"].includes(String(datos.get("estado")))
    ? String(datos.get("estado"))
    : null;
  if (!UUID.test(id) || !estado) return { error: "Datos no válidos." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.from("experiences").update({ estado }).eq("id", id);
  if (error) {
    return {
      error: /check/.test(error.message)
        ? "Falta la aprobación de quien lo hace: márcala al editar la oferta."
        : "No pudimos cambiar el estado.",
    };
  }
  revalidatePath("/equipo/experiencias");
  revalidatePath("/empresa/campo");
  return {
    aviso: estado === "publicada" ? "Publicada: ya la ven las empresas." : "Listo.",
  };
}

const SIGUIENTE_SOLICITUD: Record<string, string> = {
  recibida: "cotizada",
  cotizada: "confirmada",
  confirmada: "realizada",
};

export async function avanzarSolicitud(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const actual = String(datos.get("actual") ?? "");
  const siguiente = SIGUIENTE_SOLICITUD[actual];
  if (!UUID.test(id) || !siguiente) return { error: "Datos no válidos." };
  const valor = numero(datos.get("valor"));
  if (siguiente === "cotizada" && !(valor && valor > 0)) return { error: "Escribe el valor de la cotización." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const cambios = siguiente === "cotizada" ? { estado: siguiente, valor_cotizado: valor } : { estado: siguiente };
  const { error } = await supabase.from("experience_requests").update(cambios).eq("id", id).eq("estado", actual);
  if (error) return { error: "No pudimos actualizar la solicitud." };
  revalidatePath("/equipo/experiencias");
  return {
    aviso: "Actualizada. Recuerda avisarle a la empresa por correo o teléfono.",
  };
}

export async function registrarImpacto(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const personas = numero(datos.get("personas"));
  const horas = numero(datos.get("horas"));
  const pago = numero(datos.get("pago"));
  if (!UUID.test(id)) return { error: "Solicitud no válida." };
  if (personas === null || horas === null || pago === null)
    return { error: "Completa personas, horas y pago a quien lo hizo." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.from("impact_records").insert({
    experience_request_id: id,
    personas_impactadas: personas,
    horas,
    pago_persona: pago,
    notas: texto(datos.get("notas"), 1000) || null,
  });
  if (error) return { error: "No pudimos guardar el impacto." };
  await supabase.from("experience_requests").update({ estado: "reporte_enviado" }).eq("id", id);
  revalidatePath("/equipo/experiencias");
  return {
    aviso: "Impacto registrado. La empresa ya ve su reporte en Mis procesos.",
  };
}

// ── Etiquetas nuevas ────────────────────────────────────────────────────────

// Aprobar deja que las empresas la vean. «Sumar a la lista» además la vuelve opción para todas
// las personas y la conecta con la taxonomía (así cuenta en el puntaje).
export async function revisarEtiqueta(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("id") ?? "");
  const decision = String(datos.get("decision") ?? "");
  if (!UUID.test(id) || !["aprobar", "sumar", "quitar"].includes(decision)) return { error: "Etiqueta no válida." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();

  if (decision === "quitar") {
    const { error } = await supabase.from("footprint_tags").delete().eq("id", id);
    if (error) return { error: "No pudimos quitarla." };
    revalidatePath("/equipo/etiquetas");
    return { aviso: "Quitada del perfil." };
  }

  const { data: etiqueta } = await supabase.from("footprint_tags").select("capa, etiqueta").eq("id", id).maybeSingle();
  if (!etiqueta) return { error: "Esa etiqueta ya no existe." };
  // Lo que ven las empresas no puede revelar la edad (regla 1).
  if (/\baños\b|\bedad\b|naci[óo]|pension|jubil|\b(19|20)\d\d\b|\d{5,}|@/i.test(etiqueta.etiqueta as string)) {
    return { error: "Tiene edad, fechas o datos de contacto. Quítala." };
  }

  let taxonomyId: string | null = null;
  if (decision === "sumar") {
    const { data: existente } = await supabase
      .from("taxonomy")
      .select("id")
      .eq("capa", etiqueta.capa)
      .ilike("etiqueta", etiqueta.etiqueta as string)
      .maybeSingle();
    if (existente) {
      taxonomyId = existente.id as string;
    } else {
      const { data: nueva, error } = await supabase
        .from("taxonomy")
        .insert({ capa: etiqueta.capa, etiqueta: etiqueta.etiqueta })
        .select("id")
        .single();
      if (error || !nueva) return { error: "No pudimos sumarla a la lista." };
      taxonomyId = nueva.id as string;
    }
  }

  const { error } = await supabase
    .from("footprint_tags")
    .update({
      aprobada_en: new Date().toISOString(),
      ...(taxonomyId ? { taxonomy_id: taxonomyId } : {}),
    })
    .eq("id", id);
  if (error) return { error: "No pudimos aprobarla." };
  revalidatePath("/equipo/etiquetas");
  return {
    aviso: decision === "sumar" ? "Aprobada y sumada a la lista." : "Aprobada.",
  };
}

export async function revisarCondicionesReto(_p: Estado, datos: FormData): Promise<Estado> {
  const reto = String(datos.get("reto") ?? "");
  if (!UUID.test(reto)) return { error: "Reto no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.rpc("autorizar_reto", {
    reto,
    aprobado: datos.get("decision") === "aprobar",
    version: Number(datos.get("version")),
  });
  if (error)
    return {
      error: "No pudimos autorizarlo. Completa las condiciones y revisa el acceso del equipo.",
    };
  revalidatePath(`/equipo/problema/${reto}`);
  return { aviso: "Revisión guardada." };
}

export async function completarCondicionesReto(_p: Estado, datos: FormData): Promise<Estado> {
  const reto = String(datos.get("reto") ?? "");
  const jornada_horas = Number(datos.get("jornada_horas"));
  const remuneracion = Number(datos.get("remuneracion"));
  const remuneracion_unidad = String(datos.get("remuneracion_unidad") ?? "");
  const condiciones = String(datos.get("condiciones") ?? "").trim();
  if (
    !UUID.test(reto) ||
    !Number.isInteger(jornada_horas) ||
    jornada_horas < 1 ||
    jornada_horas > 48 ||
    !Number.isFinite(remuneracion) ||
    remuneracion < 1 ||
    remuneracion > 1000000000 ||
    !["hora", "mes", "proyecto"].includes(remuneracion_unidad) ||
    condiciones.length < 20 ||
    condiciones.length > 1500
  )
    return { error: "Revisa las condiciones del reto." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { data, error } = await supabase
    .from("needs")
    .update({ jornada_horas, remuneracion, remuneracion_unidad, condiciones })
    .eq("id", reto)
    .eq("revision_version", Number(datos.get("version")))
    .select("id");
  if (error || !data?.length)
    return {
      error: "No pudimos guardar. Revisa tu acceso y vuelve a cargar el reto por si cambió.",
    };
  revalidatePath(`/equipo/problema/${reto}`);
  return { aviso: "Condiciones guardadas. Revísalas antes de autorizarlas." };
}

export async function revisarAcuerdoTrabajo(_p: Estado, datos: FormData): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  if (!UUID.test(conexion)) return { error: "Proceso no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.rpc("autorizar_acuerdo", {
    conexion,
    version: Number(datos.get("version")),
  });
  if (error)
    return {
      error: "El acuerdo cambió o no tienes permiso. Vuelve a revisar sus condiciones.",
    };
  revalidatePath("/equipo/condiciones");
  return {
    aviso: "Condiciones revisadas. La persona ya puede decidir si acepta.",
  };
}

// ── Semáforo de trabajo digno ───────────────────────────────────────────────

export async function revisarMuestra(_p: Estado, datos: FormData): Promise<Estado> {
  const reto = String(datos.get("reto") ?? "");
  if (!UUID.test(reto)) return { error: "Reto no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.rpc("revisar_muestra", { reto });
  if (error) return { error: "No pudimos marcarlo. Puede que otra persona ya lo haya revisado." };
  revalidatePath(`/equipo/problema/${reto}`);
  revalidatePath("/equipo");
  return { aviso: "Listo: la aprobación automática quedó confirmada." };
}

// Solo administración: RLS rechaza a cualquier otra persona aunque llegue hasta aquí.
export async function guardarParametro(_p: Estado, datos: FormData): Promise<Estado> {
  const clave = texto(datos.get("clave"), 60);
  const valor = Number(String(datos.get("valor") ?? "").replace(",", "."));
  if (!/^[a-z_]+$/.test(clave) || !Number.isFinite(valor) || valor < 0) return { error: "Escribe un número válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase, user } = await equipo();
  const { data, error } = await supabase
    .from("parametros_trabajo_digno")
    .update({ valor, actualizado_por: user.id, actualizado_en: new Date().toISOString() })
    .eq("clave", clave)
    .select("clave");
  if (error || !data?.length) return { error: "No pudimos guardarlo. Solo administración cambia los umbrales." };
  revalidatePath("/equipo/semaforo");
  return { aviso: "Guardado. Aplica a los retos y acuerdos nuevos o que cambien." };
}

export async function crearReglaTexto(_p: Estado, datos: FormData): Promise<Estado> {
  const patron = texto(datos.get("patron"), 200).toLowerCase();
  const motivo = texto(datos.get("motivo"), 200);
  const color = datos.get("color") === "rojo" ? "rojo" : "amarillo";
  if (patron.length < 3 || motivo.length < 5) return { error: "Escribe la expresión y el motivo." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { error } = await supabase.from("reglas_texto_digno").insert({ patron, motivo, color });
  if (error)
    return {
      error: error.message.includes("no es válida")
        ? "La expresión no es válida. Revisa paréntesis y barras."
        : "No pudimos guardarla. Solo administración cambia las reglas.",
    };
  revalidatePath("/equipo/semaforo");
  return { aviso: "Regla guardada." };
}

export async function cambiarReglaTexto(_p: Estado, datos: FormData): Promise<Estado> {
  const id = Number(datos.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Regla no válida." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await equipo();
  const { data, error } = await supabase
    .from("reglas_texto_digno")
    .update({ activa: datos.get("activa") === "si" })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { error: "No pudimos cambiarla. Solo administración cambia las reglas." };
  revalidatePath("/equipo/semaforo");
  return { aviso: datos.get("activa") === "si" ? "Regla activada." : "Regla apagada." };
}
