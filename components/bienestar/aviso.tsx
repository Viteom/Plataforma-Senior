import Link from "next/link";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { listarOportunidades } from "@/lib/datos/consultas";
import { resumenCarga } from "@/lib/bienestar/resumen";

export async function AvisoBienestar() {
  if (MODO_DEMO)
    return (
      <Link
        href="/bienestar"
        className="inline-flex min-h-action items-center rounded-md bg-surface p-4 font-bold underline"
      >
        Revisa tus metas, horas y bienestar
      </Link>
    );
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil) return null;
  const { data: meta } = await supabase
    .from("wellbeing_preferences")
    .select("horas_meta")
    .eq("talent_id", perfil.id)
    .maybeSingle();
  let mensaje = "Elige tus metas de tiempo e ingreso a tu ritmo.";
  if (meta) {
    const procesos = await listarOportunidades();
    const carga = resumenCarga(meta.horas_meta, procesos);
    const { data: ultimo } = await supabase
      .from("wellbeing_checkins")
      .select("creado_en,energia")
      .eq("talent_id", perfil.id)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (carga.horas > meta.horas_meta)
      mensaje =
        "Tus acuerdos superan las horas que elegiste. Revisa tu carga y pide un ajuste si lo necesitas.";
    else if (ultimo?.energia === "pausa")
      mensaje =
        "En tu último seguimiento pediste una pausa. Puedes revisar tu ritmo y pedir acompañamiento.";
    else if (
      procesos.some((p) => ["en_curso", "cerrada"].includes(p.estado)) &&
      (!ultimo ||
        Date.now() - new Date(ultimo.creado_en).getTime() > 7 * 86400000)
    )
      mensaje =
        "¿Cómo vas con tu trabajo? Si quieres, registra tu seguimiento y cuéntanos si necesitas apoyo.";
    else return null;
  }
  return (
    <aside className="flex flex-col gap-2 rounded-md border-2 border-border-subtle p-4">
      <h2 className="text-lg">Tu bienestar va primero</h2>
      <p>{mensaje}</p>
      <Link
        href="/bienestar"
        className="inline-flex min-h-tap items-center font-bold underline"
      >
        Revisar mi ritmo y seguimiento
      </Link>
    </aside>
  );
}
