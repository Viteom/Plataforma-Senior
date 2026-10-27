"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MODO_DEMO, necesidadEjemplo } from "@/lib/demo";
import { esProcesoDemo } from "@/lib/demo-proceso";
import { avanzarProcesoDemo } from "@/lib/demo-proceso-cookie";
import { leerEmpresa } from "@/lib/empresa/validar";
import { esForma } from "@/lib/formas";
import {
  leerAcuerdo,
  leerAgenda,
  leerEvaluacion,
  leerMotivo,
  mensajeProceso,
} from "@/lib/procesos-formularios";
import { CAPAS_LIBRES, componerReto, problemaRequisitoLibre } from "@/lib/reto";
import { crearClienteServidor } from "@/lib/supabase/server";

// Acciones de la empresa. Los pasos de una conexión pasan por funciones de la base que revisan
// quién lo pide y desde qué estado; la regla 9 la hace cumplir un trigger.

export type Estado = { error?: string; aviso?: string };

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
    "empresa",
    accion,
    extra as Record<string, unknown>,
  );
  if ("error" in r) return { error: r.error };
  revalidatePath("/", "layout");
  return { aviso };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const texto = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

async function sesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?para=empresa");
  return { supabase, user };
}

// Traduce los errores de la base a algo que la empresa entienda, sin detalles internos.
function mensaje(error: { message?: string } | null): string {
  const m = error?.message ?? "";
  if (/sin verificar|pausada/.test(m))
    return "Tu empresa todavía no está verificada o está en pausa. Te escribimos cuando quede lista.";
  if (/registrada/.test(m)) return "Primero registra los datos de tu empresa.";
  if (/una_conexion_viva|duplicate/.test(m))
    return "Ya pediste conocer este perfil. Lo verás en Mis procesos.";
  if (/no disponible/.test(m)) return "Este perfil ya no está disponible.";
  return "No pudimos guardar. Intenta de nuevo o pide ayuda.";
}

export async function registrarEmpresa(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const resultado = leerEmpresa(datos);
  if ("error" in resultado) return { error: resultado.error };
  if (MODO_DEMO) return DEMO;

  const { supabase, user } = await sesion();
  const { error } = await supabase
    .from("companies")
    .insert({ owner_id: user.id, ...resultado.datos });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa", "layout");
  return {
    aviso:
      "Listo. Nuestro equipo verifica el NIT en el RUES; mientras tanto puedes explorar perfiles.",
  };
}

export async function pedirConexion(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const talento = String(datos.get("talento") ?? "");
  if (!UUID.test(talento)) return { error: "Perfil no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await sesion();
  const { error } = await supabase.rpc("pedir_conexion", { talento });
  if (error) return { error: mensaje(error) };
  revalidatePath(`/empresa/perfil/${talento}`);
  return {
    aviso:
      "Listo. Le contamos a la persona; si le interesa, abrimos la conversación.",
  };
}

export async function quieroConocer(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  if (!UUID.test(conexion)) return { error: "Conexión no válida." };
  if (MODO_DEMO)
    return pasoDemo(
      conexion,
      "quiero_conocer",
      {},
      "Listo. Nuestro equipo los pone en contacto en las próximas 24 horas hábiles.",
    );
  const { supabase } = await sesion();
  const { error } = await supabase.rpc("actuar_conexion", {
    conexion,
    accion: "quiero_conocer",
  });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa", "layout");
  return {
    aviso:
      "Listo. Nuestro equipo los pone en contacto en las próximas 24 horas hábiles.",
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
  if (!UUID.test(conexion)) return { error: "Conexión no válida." };
  if (MODO_DEMO) return pasoDemo(conexion, accion, extra, aviso);
  const { supabase } = await sesion();
  const { error } = await supabase.rpc("avanzar_proceso", {
    conexion,
    accion,
    datos: extra,
  });
  if (error) return { error: mensajeProceso(error) };
  revalidatePath("/empresa", "layout");
  return { aviso };
}

export async function agendarConversacion(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const agenda = leerAgenda(datos);
  if ("error" in agenda) return agenda;
  return paso(
    datos,
    "agendar",
    agenda.datos,
    "Listo. Le avisamos a la persona para que confirme la fecha.",
  );
}

export async function proponerAcuerdo(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const acuerdo = leerAcuerdo(datos);
  if ("error" in acuerdo) return acuerdo;
  return paso(
    datos,
    "proponer_acuerdo",
    acuerdo.datos,
    "Listo. Le enviamos el acuerdo a la persona para que lo revise.",
  );
}

export async function noSeguirEmpresa(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const motivo = leerMotivo(datos, "empresa");
  if ("error" in motivo) return motivo;
  return paso(
    datos,
    "no_seguir",
    { motivo: motivo.datos },
    "Listo. Le avisamos a la persona con cuidado.",
  );
}

export async function terminarProceso(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const evaluacion = leerEvaluacion(datos);
  if ("error" in evaluacion) return evaluacion;
  return paso(
    datos,
    "terminar",
    { evaluacion: evaluacion.datos },
    "Gracias. Tu calificación ayuda a otras organizaciones a confiar.",
  );
}

export async function calificarProceso(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const evaluacion = leerEvaluacion(datos);
  if ("error" in evaluacion) return evaluacion;
  return paso(
    datos,
    "calificar",
    { evaluacion: evaluacion.datos },
    "Gracias. Tu calificación ayuda a otras organizaciones a confiar.",
  );
}

// Requisitos escritos a mano: «capa|etiqueta». Sin taxonomía; el equipo los revisa al curar.
function leerLibres(datos: FormData, campo: string) {
  return datos
    .getAll(campo)
    .map(String)
    .map((v) => {
      const [capa, ...resto] = v.split("|");
      return { capa, etiqueta: texto(resto.join("|"), 60) };
    })
    .filter(
      (l) =>
        (CAPAS_LIBRES as string[]).includes(l.capa) &&
        !problemaRequisitoLibre(l.etiqueta),
    )
    .slice(0, 10);
}

// Contar un reto. Los requisitos se eligen de la taxonomía (sin IA: la IA está apagada) o se
// escriben a mano. Lo que intentaron y el plazo van en el mismo texto del reto.
export async function crearNecesidad(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const reto = texto(datos.get("problema"), 2000);
  const problema = componerReto(
    reto,
    texto(datos.get("intentado"), 800),
    String(datos.get("plazo") ?? ""),
  );
  const formatos = datos.getAll("formatos").map(String).filter(esForma);
  const modalidad = ["presencial", "remoto", "mixto"].includes(
    String(datos.get("modalidad")),
  )
    ? String(datos.get("modalidad"))
    : null;
  const ubicacion = texto(datos.get("ubicacion"), 80) || null;
  const presupuestoCrudo = String(datos.get("presupuesto") ?? "").replace(
    /[^\d]/g,
    "",
  );
  const presupuesto = presupuestoCrudo ? Number(presupuestoCrudo) : null;
  const obligatorios = datos
    .getAll("obligatorio")
    .map(String)
    .filter((v) => UUID.test(v));
  const deseables = datos
    .getAll("deseable")
    .map(String)
    .filter((v) => UUID.test(v) && !obligatorios.includes(v));
  const libres = [
    ...leerLibres(datos, "libre_obligatorio").map((l) => ({
      ...l,
      obligatorio: true,
    })),
    ...leerLibres(datos, "libre_deseable").map((l) => ({
      ...l,
      obligatorio: false,
    })),
  ];

  if (reto.length < 20)
    return { error: "Cuéntanos el reto con un poco más de detalle." };
  if (!formatos.length)
    return { error: "Elige al menos una forma de contratar." };
  if (!obligatorios.length && !deseables.length && !libres.length) {
    return {
      error: "Elige o escribe al menos una cosa que deba saber la persona.",
    };
  }
  const jornada_horas = Number(datos.get("jornada_horas"));
  const remuneracion = Number(datos.get("remuneracion"));
  const remuneracion_unidad = String(datos.get("remuneracion_unidad") ?? "");
  const condiciones = String(datos.get("condiciones") ?? "").trim();
  if (
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
    return {
      error:
        "Completa jornada, remuneración y condiciones para que Kánna revise el reto.",
    };
  if (MODO_DEMO) redirect(`/empresa/problema/${necesidadEjemplo.id}`);

  const { supabase } = await sesion();
  const { data: empresa } = await supabase.rpc("mi_empresa");
  if (!empresa) return { error: "Primero registra los datos de tu empresa." };

  const { data: necesidad, error } = await supabase
    .from("needs")
    .insert({
      company_id: empresa,
      problema,
      formatos,
      modalidad,
      ubicacion,
      presupuesto,
      jornada_horas,
      remuneracion,
      remuneracion_unidad,
      condiciones,
    })
    .select("id")
    .single();
  if (error || !necesidad) return { error: mensaje(error) };

  const { data: tax } = await supabase
    .from("taxonomy")
    .select("id, capa, etiqueta")
    .in("id", [...obligatorios, ...deseables]);
  if (tax?.length) {
    const { error: errorReq } = await supabase.from("need_requirements").insert(
      tax.map((t) => ({
        need_id: necesidad.id,
        capa: t.capa,
        etiqueta: t.etiqueta,
        taxonomy_id: t.id,
        obligatorio: obligatorios.includes(t.id),
      })),
    );
    if (errorReq) return { error: mensaje(errorReq) };
  }
  if (libres.length) {
    const { error: errorLibres } = await supabase
      .from("need_requirements")
      .insert(
        libres.map((l) => ({
          need_id: necesidad.id,
          capa: l.capa,
          etiqueta: l.etiqueta,
          taxonomy_id: null,
          obligatorio: l.obligatorio,
        })),
      );
    if (errorLibres) return { error: mensaje(errorLibres) };
  }
  redirect(`/empresa/problema/${necesidad.id}`);
}

// Solicitud de cotización de una experiencia. En v1 no hay pagos en línea: el equipo cotiza y
// confirma por fuera, y lo registra en su panel.
export async function pedirCotizacion(
  _p: Estado,
  datos: FormData,
): Promise<Estado> {
  const experiencia = String(datos.get("experiencia") ?? "");
  const formato = datos.get("formato") === "territorio" ? "territorio" : "sede";
  const personas = Number(datos.get("personas"));
  const mes = texto(datos.get("mes"), 20);
  const nota = texto(datos.get("nota"), 1000) || null;
  if (!UUID.test(experiencia)) return { error: "Experiencia no válida." };
  if (!Number.isInteger(personas) || personas < 1 || personas > 500)
    return { error: "Escribe la cantidad, de 1 a 500." };
  if (!mes) return { error: "Elige el mes." };
  if (MODO_DEMO) return DEMO;

  const { supabase } = await sesion();
  const { data: empresa } = await supabase.rpc("mi_empresa");
  if (!empresa)
    return {
      error: "Primero registra los datos de tu empresa en «Mi empresa».",
    };
  const { error } = await supabase.from("experience_requests").insert({
    experience_id: experiencia,
    company_id: empresa,
    formato,
    personas,
    mes,
    nota,
  });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa/procesos");
  return {
    aviso:
      "Listo. Te enviamos la cotización en los próximos días hábiles. La verás en Mis procesos.",
  };
}
