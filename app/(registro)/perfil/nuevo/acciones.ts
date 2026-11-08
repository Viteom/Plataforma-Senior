"use server";

import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { esOficioPresencial, modalidadDeLaForma, OFICIOS_PRESENCIALES_BASE } from "@/lib/oficios-presenciales";
import { experienciaHojaVida } from "@/lib/perfil/hoja-vida";
import { leerBorrador, validarPerfil, VERSION_AUTORIZACION, type Errores } from "@/lib/perfil/validar";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoPerfil = { errores?: Errores; paso?: 1 | 2 | 3 };

// Guarda el perfil en 3 pasos: talent_profiles, talent_offers y, por función, el requisito de
// entrada y la autorización de datos en talent_private (nunca en el perfil: es dato de edad).
export async function guardarPerfil(_previo: EstadoPerfil, datos: FormData): Promise<EstadoPerfil> {
  const resultado = validarPerfil(leerBorrador(datos.get("borrador")));
  if (!resultado.ok) return { errores: resultado.errores, paso: resultado.paso };
  const cv = String(datos.get("historia_cv") ?? "");
  const experienciaCv = cv ? experienciaHojaVida(cv, resultado.perfil.nombre) : "";
  if (cv && (cv.length > 6000 || experienciaCv.length < 40))
    return {
      errores: {
        general: "Revisa la experiencia importada: usa entre 40 y 6.000 letras.",
      },
      paso: 1,
    };
  if (MODO_DEMO) redirect("/huella");

  const p = resultado.perfil;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const general = {
    errores: {
      general: "No pudimos guardar tu perfil. Intenta de nuevo o pide ayuda.",
    },
    paso: 3 as const,
  };

  const campos = {
    nombre: p.nombre,
    ubicacion: p.ubicacion,
    oficio: p.oficio,
    visibilidad: p.visibilidad,
    zona_local:
      String(datos.get("zona_local") ?? "")
        .trim()
        .slice(0, 100) || null,
  };
  const { data: existente } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
  const { data: perfil, error } = existente
    ? await supabase.from("talent_profiles").update(campos).eq("id", existente.id).select("id").single()
    : await supabase
        .from("talent_profiles")
        .insert({ ...campos, user_id: user.id })
        .select("id")
        .single();
  if (error || !perfil) return general;

  // Con un oficio que siempre es presencial no se ofrece trabajo desde la casa (salvo mentorías y
  // talleres, si la persona lo activó). La lista la mantiene el equipo; si no responde, la base.
  const { data: palabras } = await supabase.from("oficios_presenciales").select("palabra");
  const presencial = esOficioPresencial(
    p.oficio,
    palabras?.length ? palabras.map((x) => x.palabra as string) : OFICIOS_PRESENCIALES_BASE,
  );

  // Formas de contratar: se reemplazan completas.
  await supabase.from("talent_offers").delete().eq("talent_id", perfil.id);
  const { error: errorOfertas } = await supabase.from("talent_offers").insert(
    p.formas.map((tipo) => ({
      talent_id: perfil.id,
      tipo,
      horas_semana: p.horas,
      modalidad: modalidadDeLaForma(tipo, p.modalidad, presencial, p.distancia),
      tarifa_esperada: p.tarifas[tipo] ?? null,
      quiere_orientacion: p.orientacion,
    })),
  );
  if (errorOfertas) return general;

  const { error: errorPrivado } = await supabase.rpc("guardar_datos_privados", {
    perfil: perfil.id,
    fecha_nacimiento: null,
    autorizacion_version: VERSION_AUTORIZACION,
    autorizacion_medio: "pantalla",
    pension: null,
    requisito_entrada: p.requisito,
  });
  if (errorPrivado) return general;

  // Cédula, país, ciudad donde quiere trabajar, sexo y cómo le gusta trabajar: privados. Si no se
  // guardan (por ejemplo, la base aún no tiene la función), el perfil sigue y se completan después.
  const { error: errorRegistro } = await supabase.rpc("guardar_datos_registro", {
    cedula: p.cedula,
    pais: p.pais,
    ciudad_trabajo: p.ciudadTrabajo,
    sexo: p.sexo,
    postura: p.postura,
    movilidad: p.movilidad,
  });
  if (errorRegistro) console.error("guardar_datos_registro", errorRegistro.code, errorRegistro.message);

  // Pensión o subsidio (opcional): solo para avisarle antes de aceptar un acuerdo. Si no se
  // guarda, el perfil sigue: la persona puede contarlo después en Mi perfil.
  if (p.ingresos) {
    const { error: errorIngresos } = await supabase.rpc("guardar_situacion_ingresos", {
      situacion: p.ingresos,
      hogar: p.hogar,
    });
    if (errorIngresos) console.error("guardar_situacion_ingresos", errorIngresos.code, errorIngresos.message);
  }

  if (p.orientacion) {
    await supabase.from("help_requests").insert({
      user_id: user.id,
      canal: "orientacion_tarifa",
      motivo: "Pidió orientación sobre cuánto cobrar al crear su perfil.",
    });
  }

  if (cv) {
    const experiencia = experienciaCv;
    const { error: errorHistoria } = await supabase
      .from("stories")
      .insert({ talent_id: perfil.id, texto: experiencia, origen: "escrito" });
    if (errorHistoria) return general;
    redirect("/huella?fuente=hoja-vida");
  }
  redirect("/huella");
}
