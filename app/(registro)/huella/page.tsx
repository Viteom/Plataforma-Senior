import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MODO_DEMO, taxonomiaEjemplo } from "@/lib/demo";
import { iaDisponible } from "@/lib/ia/entorno";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioHuella } from "./formulario";

export const metadata: Metadata = { title: "Tu historia" };

// La disponibilidad de la IA se revisa aquí, en el servidor (docs/ia-desde-moai.md, sección 5).
export default async function Huella() {
  if (MODO_DEMO) return <FormularioHuella taxonomia={taxonomiaEjemplo} ia nombre={null} />;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase.from("talent_profiles").select("nombre").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/perfil/nuevo");

  const { data: taxonomia } = await supabase.from("taxonomy").select("id, capa, etiqueta, sinonimos").order("etiqueta");
  return (
    <FormularioHuella
      taxonomia={(taxonomia ?? []) as EntradaTaxonomia[]}
      ia={iaDisponible()}
      nombre={perfil.nombre as string}
    />
  );
}
