"use server";
import { revalidatePath } from "next/cache";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";
export async function gestionarCaso(_p: { error?: string; aviso?: string }, datos: FormData) {
  const caso = String(datos.get("caso") ?? "");
  const accion = String(datos.get("accion") ?? "");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caso) ||
    !["tomar", "cerrar"].includes(accion)
  )
    return { error: "Caso no válido." };
  if (MODO_DEMO) return { aviso: "La demostración no asigna casos reales." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("gestionar_caso_bienestar", {
    caso,
    accion,
  });
  if (error)
    return {
      error: "No pudimos guardar. El caso puede haber cambiado o estar asignado a otra persona.",
    };
  revalidatePath("/equipo/bienestar");
  revalidatePath("/bienestar");
  return {
    aviso:
      accion === "tomar"
        ? "Caso asignado a ti. Revisa el permiso de contacto antes de actuar."
        : "Revisión marcada como finalizada.",
  };
}
