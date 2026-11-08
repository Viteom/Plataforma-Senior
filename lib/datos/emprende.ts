import "server-only";

import { MODO_DEMO } from "@/lib/demo";
import { esEtapa, esNecesidad, type Etapa, type Necesidad } from "@/lib/emprende/ruta";
import { crearClienteServidor } from "@/lib/supabase/server";

// Perfil de emprender: lo último que la persona respondió, los pasos que ya hizo y los cursos que
// abrió desde Kánna. Así, si va a un curso y vuelve, encuentra su ruta donde la dejó.

export type CursoVisto = { id: string; titulo: string; entidad: string; ultimo: string };
export type MiEmprendimiento = {
  etapa: Etapa;
  necesidades: Necesidad[];
  idea: string | null;
  asesoria: boolean;
  pasosHechos: string[];
  respuestas: Record<string, string>;
  actualizado: string;
  cursos: CursoVisto[];
};

const EJEMPLO: MiEmprendimiento = {
  etapa: "idea",
  necesidades: ["precios", "digital"],
  idea: "Vender cerámica pintada a mano: materas y platos con diseños de Nariño.",
  asesoria: false,
  pasosHechos: ["idea-frase"],
  respuestas: { "idea-frase": "Materas y platos pintados a mano para quienes quieren un regalo de Nariño." },
  actualizado: "2026-11-05T15:00:00.000Z",
  cursos: [
    { id: "00000000-0000-4000-9600-000000000001", titulo: "Cursos cortos gratuitos del SENA", entidad: "SENA (Sofía Plus)", ultimo: "2026-11-05T15:20:00.000Z" },
  ],
};

export async function miEmprendimiento(): Promise<MiEmprendimiento | null> {
  if (MODO_DEMO) return EJEMPLO;
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) return null;

  const [{ data: d }, { data: vistos }] = await Promise.all([
    supabase
      .from("entrepreneurship_diagnostics")
      .select("etapa, necesidades, idea, quiere_asesoria, pasos_hechos, respuestas_pasos, actualizado_en")
      .eq("talent_id", perfil.id)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("course_views")
      .select("ultimo_visto_en, courses(id, titulo, entidad)")
      .eq("talent_id", perfil.id)
      .order("ultimo_visto_en", { ascending: false })
      .limit(20),
  ]);
  if (!d || !esEtapa(d.etapa)) return null;

  const cursos: CursoVisto[] = [];
  for (const v of vistos ?? []) {
    const c = (Array.isArray(v.courses) ? v.courses[0] : v.courses) as { id: string; titulo: string; entidad: string } | null;
    if (c) cursos.push({ id: c.id, titulo: c.titulo, entidad: c.entidad, ultimo: v.ultimo_visto_en as string });
  }
  return {
    etapa: d.etapa,
    necesidades: ((d.necesidades as string[] | null) ?? []).filter(esNecesidad),
    idea: (d.idea as string | null) ?? null,
    asesoria: Boolean(d.quiere_asesoria),
    pasosHechos: (d.pasos_hechos as string[] | null) ?? [],
    respuestas: Object.fromEntries(
      Object.entries((d.respuestas_pasos as Record<string, unknown> | null) ?? {}).filter(
        (e): e is [string, string] => typeof e[1] === "string",
      ),
    ),
    actualizado: d.actualizado_en as string,
    cursos,
  };
}

// Solo los identificadores, para marcar en Aprende los cursos que ya abrió.
export async function misCursosVistos(): Promise<Set<string>> {
  if (MODO_DEMO) return new Set(EJEMPLO.cursos.map((c) => c.id));
  const supabase = await crearClienteServidor();
  // La política solo deja ver las filas propias (o todas, al equipo, que no entra a esta pantalla).
  const { data } = await supabase.from("course_views").select("course_id");
  return new Set((data ?? []).map((v) => v.course_id as string));
}
