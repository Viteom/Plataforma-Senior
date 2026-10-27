import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MODO_DEMO } from "@/lib/demo";
import { iaDisponible } from "@/lib/ia/entorno";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioHuella } from "./formulario";

export const metadata: Metadata = { title: "Tu historia" };

// La disponibilidad de la IA se revisa aquí, en el servidor (docs/ia-desde-moai.md, sección 5).
export default async function Huella({ searchParams }: { searchParams: Promise<{ fuente?: string }> }) {
  if (MODO_DEMO) return <FormularioHuella ia nombre={null} />;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("talent_profiles")
    .select("id, nombre")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/perfil/nuevo");

  const params = await searchParams;
  const inicial =
    params.fuente === "hoja-vida"
      ? (
          await supabase
            .from("stories")
            .select("texto")
            .eq("talent_id", perfil.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        ).data?.texto
      : undefined;
  return <FormularioHuella ia={iaDisponible()} nombre={perfil.nombre as string} historiaInicial={inicial} />;
}
