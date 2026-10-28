"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { COOKIE_ACTIVIDAD, opcionesCookieActividad } from "@/lib/auth/inactividad";
import { ENTRADA_EQUIPO, esRolEquipo, type Rol } from "@/lib/auth/rutas";
import { normalizarCorreo } from "@/lib/auth/destino";
import { crearClienteServidor } from "@/lib/supabase/server";

// Entrada del equipo: correo y clave, y después el código de una app de verificación (TOTP).
// Sin el segundo paso la base no le da permisos de equipo a la sesión (mi_rol() exige aal2).

export type EstadoEntradaEquipo = { error?: string };

const NO_ES_EQUIPO =
  "Esta entrada es solo para el equipo de Kánna. Si eres talento o una organización, entra por la entrada general.";

export async function entrarConClave(_previo: EstadoEntradaEquipo, datos: FormData): Promise<EstadoEntradaEquipo> {
  const correo = normalizarCorreo(String(datos.get("correo") ?? ""));
  const clave = String(datos.get("clave") ?? "");
  if (!correo || !clave) return { error: "Escribe tu correo del equipo y tu clave." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
  if (error) {
    if (error.status === 429) return { error: "Hubo muchos intentos seguidos. Espera unos minutos y vuelve a intentar." };
    // El mismo mensaje si el correo no existe o la clave no coincide: no revela quién es del equipo.
    return { error: "El correo o la clave no coinciden. Revísalos e intenta de nuevo." };
  }

  const { data: rol } = await supabase.rpc("mi_rol_registrado");
  if (!esRolEquipo((rol as Rol | null) ?? null)) {
    await supabase.auth.signOut();
    return { error: NO_ES_EQUIPO };
  }
  redirect(ENTRADA_EQUIPO);
}

export async function verificarSegundoFactor(
  _previo: EstadoEntradaEquipo,
  datos: FormData,
): Promise<EstadoEntradaEquipo> {
  const codigo = String(datos.get("codigo") ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { error: "El código tiene 6 números." };

  const supabase = await crearClienteServidor();
  const { data: factores, error: errorFactores } = await supabase.auth.mfa.listFactors();
  if (errorFactores) redirect(ENTRADA_EQUIPO);
  // Si ya tiene un factor activo se usa ese; si no, el que acaba de crear al escanear el código.
  const factor =
    factores.totp[0] ?? factores.all.find((f) => f.factor_type === "totp" && f.status === "unverified");
  if (!factor) redirect(ENTRADA_EQUIPO);

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: codigo });
  if (error) {
    if (error.status === 429) return { error: "Hubo muchos intentos seguidos. Espera unos minutos y vuelve a intentar." };
    return { error: "El código no es correcto o ya cambió. Escribe el que muestra la app ahora." };
  }

  // Sin esta marca el middleware cierra la sesión: es el inicio de los 30 minutos de actividad.
  (await cookies()).set(COOKIE_ACTIVIDAD, String(Date.now()), opcionesCookieActividad);
  redirect("/equipo");
}

// Volver al paso 1 con otra cuenta, o salir del panel.
export async function salirEquipo() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  (await cookies()).delete(COOKIE_ACTIVIDAD);
  redirect(ENTRADA_EQUIPO);
}

// Modo demostración: solo navega entre los pasos, por POST.
export async function pasoDemo(datos: FormData) {
  const paso = datos.get("siguiente");
  redirect(paso === "panel" ? "/equipo" : `${ENTRADA_EQUIPO}?paso=${paso === "activar" ? "activar" : "codigo"}`);
}
