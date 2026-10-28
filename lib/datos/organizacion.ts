import "server-only";

import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import type { RolOrganizacion } from "./tipos";

// Equipo de la organización: varias personas por organización (company_members), cada una con su
// cuenta y su rol. La base decide quién ve y quién cambia; aquí solo se leen los datos.

export type Miembro = {
  user_id: string;
  correo: string | null;
  nombre: string | null;
  rol: RolOrganizacion;
  desde: string;
  soy_yo: boolean;
};

export type Invitacion = {
  id: string;
  correo: string;
  rol: RolOrganizacion;
  creado_en: string;
  vence_en: string;
};

export const ROLES_ORGANIZACION: { valor: RolOrganizacion; nombre: string; descripcion: string }[] = [
  {
    valor: "admin",
    nombre: "Administración",
    descripcion: "Todo lo de procesos, y además invita personas y cambia los datos de la organización.",
  },
  { valor: "procesos", nombre: "Procesos", descripcion: "Publica retos, explora talento, conversa y propone acuerdos." },
  { valor: "lectura", nombre: "Solo lectura", descripcion: "Ve retos y procesos. No cambia nada." },
];

export const nombreRol = (rol: RolOrganizacion) => ROLES_ORGANIZACION.find((r) => r.valor === rol)?.nombre ?? rol;

const haceDias = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export async function equipoOrganizacion(): Promise<{ miembros: Miembro[]; invitaciones: Invitacion[] }> {
  if (MODO_DEMO) {
    return {
      miembros: [
        { user_id: "00000000-0000-4000-c000-000000000001", correo: "marta.rojas@ejemplo.co", nombre: "Marta Rojas", rol: "admin", desde: haceDias(40), soy_yo: true },
        { user_id: "00000000-0000-4000-c000-000000000002", correo: "julian.pardo@ejemplo.co", nombre: "Julián Pardo", rol: "procesos", desde: haceDias(20), soy_yo: false },
        { user_id: "00000000-0000-4000-c000-000000000003", correo: "luisa.cardenas@ejemplo.co", nombre: "Luisa Cárdenas", rol: "lectura", desde: haceDias(6), soy_yo: false },
      ],
      invitaciones: [
        { id: "00000000-0000-4000-c100-000000000001", correo: "andres.gil@ejemplo.co", rol: "procesos", creado_en: haceDias(2), vence_en: haceDias(-5) },
      ],
    };
  }
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?para=empresa");
  const [{ data: miembros }, { data: invitaciones }] = await Promise.all([
    supabase.rpc("miembros_de_mi_empresa"),
    // RLS: solo administración ve las invitaciones; para los demás llega vacío.
    supabase
      .from("company_invitations")
      .select("id, correo, rol, creado_en, vence_en")
      .is("aceptada_en", null)
      .is("cancelada_en", null)
      .gt("vence_en", new Date().toISOString())
      .order("creado_en", { ascending: false }),
  ]);
  return { miembros: (miembros ?? []) as Miembro[], invitaciones: (invitaciones ?? []) as Invitacion[] };
}
