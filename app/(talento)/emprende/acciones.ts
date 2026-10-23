"use server";

import { MODO_DEMO } from "@/lib/demo";
import { esEtapa, esNecesidad, rutaPara, type Paso } from "@/lib/emprende/ruta";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoDiagnostico = { error?: string; ruta?: Paso[]; asesoria?: boolean };

export async function guardarDiagnostico(_p: EstadoDiagnostico, datos: FormData): Promise<EstadoDiagnostico> {
  const etapa = datos.get("etapa");
  const necesidades = datos.getAll("necesidades").filter(esNecesidad);
  const asesoria = datos.get("asesoria") === "si";
  if (!esEtapa(etapa)) return { error: "Elige en qué va tu negocio." };
  const ruta = rutaPara(etapa, necesidades);
  if (MODO_DEMO) return { ruta, asesoria };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = user
    ? await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle()
    : { data: null };
  // Sin perfil igual se muestra la ruta; solo no se guarda.
  if (user && perfil) {
    await supabase.from("entrepreneurship_diagnostics").insert({ talent_id: perfil.id, etapa, necesidades, quiere_asesoria: asesoria });
    if (asesoria) {
      await supabase.from("help_requests").insert({
        user_id: user.id,
        canal: "asesoria_emprende",
        motivo: `Pidió asesoría para emprender (etapa: ${etapa}).`,
      });
    }
  }
  return { ruta, asesoria };
}
