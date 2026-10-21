import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import type { GuiaTarifa } from "@/lib/formas";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioPerfil } from "./formulario";

export const metadata: Metadata = { title: "Cree su perfil" };

export default async function PerfilNuevo() {
  if (MODO_DEMO) return <FormularioPerfil guias={[]} />;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Quien ya tiene perfil lo edita desde Mi perfil.
  const { data: perfil } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (perfil) redirect("/mi-perfil");

  const { data: guias } = await supabase.from("rate_guides").select("tipo, unidad, minimo, maximo");
  return <FormularioPerfil guias={(guias ?? []) as GuiaTarifa[]} />;
}
