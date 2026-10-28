"use server";

import { revalidatePath } from "next/cache";

import { normalizarCorreo } from "@/lib/auth/destino";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

// Equipo de la organización. Cada función de la base exige el rol de administración; aquí solo se
// valida la forma y se traducen los errores.

type Estado = { error?: string; aviso?: string };

const DEMO: Estado = { aviso: "En la demostración no se guarda nada." };
const ROLES = new Set(["admin", "procesos", "lectura"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mensaje(error: { message?: string } | null): string {
  const m = error?.message ?? "";
  if (/Solo administración/.test(m)) return "Solo administración de la organización puede hacer esto.";
  if (/al menos una/.test(m)) return "Debe quedar al menos una persona con administración.";
  if (/ya es parte/.test(m)) return "Esa persona ya es parte del equipo.";
  if (/demasiadas/.test(m)) return "Hay muchas invitaciones abiertas. Cancela alguna antes de invitar a más personas.";
  return "No pudimos guardar. Intenta de nuevo o pide ayuda.";
}

export async function invitarPersona(_p: Estado, datos: FormData): Promise<Estado> {
  const correo = normalizarCorreo(String(datos.get("correo") ?? ""));
  const rol = String(datos.get("rol") ?? "");
  if (!correo) return { error: "Revisa el correo. Debe tener una @ y terminar en algo como .com o .co." };
  if (!ROLES.has(rol)) return { error: "Elige qué puede hacer esta persona." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("invitar_a_mi_empresa", { correo, rol });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa/equipo");
  return { aviso: `Listo. Pídele a ${correo} que entre a Kánna con ese correo: queda en el equipo al entrar.` };
}

export async function cancelarInvitacion(_p: Estado, datos: FormData): Promise<Estado> {
  const id = String(datos.get("invitacion") ?? "");
  if (!UUID.test(id)) return { error: "Invitación no válida." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cancelar_invitacion", { invitacion: id });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa/equipo");
  return { aviso: "Invitación cancelada." };
}

export async function cambiarRol(_p: Estado, datos: FormData): Promise<Estado> {
  const usuario = String(datos.get("usuario") ?? "");
  const rol = String(datos.get("rol") ?? "");
  if (!UUID.test(usuario) || !ROLES.has(rol)) return { error: "Elige un rol." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cambiar_rol_miembro", { usuario, rol });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa", "layout");
  return { aviso: "Rol actualizado." };
}

export async function quitarPersona(_p: Estado, datos: FormData): Promise<Estado> {
  const usuario = String(datos.get("usuario") ?? "");
  if (!UUID.test(usuario)) return { error: "Persona no válida." };
  if (MODO_DEMO) return DEMO;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("quitar_miembro", { usuario });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa/equipo");
  return { aviso: "Ya no tiene acceso a la organización." };
}
