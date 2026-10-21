"use server";

import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { leerBorrador, validarPerfil, VERSION_AUTORIZACION, type Errores } from "@/lib/perfil/validar";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoPerfil = { errores?: Errores; paso?: 1 | 2 | 3 };

// Guarda el perfil en 3 pasos: talent_profiles, talent_offers y, por función, el requisito de
// entrada y la autorización de datos en talent_private (nunca en el perfil: es dato de edad).
export async function guardarPerfil(_previo: EstadoPerfil, datos: FormData): Promise<EstadoPerfil> {
  const resultado = validarPerfil(leerBorrador(datos.get("borrador")));
  if (!resultado.ok) return { errores: resultado.errores, paso: resultado.paso };
  if (MODO_DEMO) redirect("/huella");

  const p = resultado.perfil;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const general = { errores: { general: "No pudimos guardar su perfil. Intente de nuevo o pida ayuda." }, paso: 3 as const };

  const campos = {
    nombre: p.nombre,
    ubicacion: p.ubicacion,
    oficio: p.oficio,
    visibilidad: p.visibilidad,
  };
  const { data: existente } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
  const { data: perfil, error } = existente
    ? await supabase.from("talent_profiles").update(campos).eq("id", existente.id).select("id").single()
    : await supabase.from("talent_profiles").insert({ ...campos, user_id: user.id }).select("id").single();
  if (error || !perfil) return general;

  // Formas de contratar: se reemplazan completas.
  await supabase.from("talent_offers").delete().eq("talent_id", perfil.id);
  const { error: errorOfertas } = await supabase.from("talent_offers").insert(
    p.formas.map((tipo) => ({
      talent_id: perfil.id,
      tipo,
      horas_semana: p.horas,
      modalidad: p.modalidad,
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

  if (p.orientacion) {
    await supabase.from("help_requests").insert({
      user_id: user.id,
      canal: "orientacion_tarifa",
      motivo: "Pidió orientación sobre cuánto cobrar al crear su perfil.",
    });
  }

  redirect("/huella");
}
