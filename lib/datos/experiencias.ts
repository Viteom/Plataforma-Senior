import "server-only";

import { experienciaEjemplo, MODO_DEMO, solicitudesEjemplo } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import type { ExperienciaVista, SolicitudExperiencia } from "./tipos";

// Experiencias con saberes. Las empresas ven solo las publicadas (RLS); el equipo ve todas.

const COLUMNAS =
  "id, slug, nombre, proposito, sabedora_nombre, sabedora_pueblo, temas, para_quien, beneficios, momentos, formatos, lugar, duracion, grupo_min, grupo_max, precio_desde, porcentaje_sabedora, testimonio, estado, aprobada_por_sabedora_en";

export async function listarExperiencias(): Promise<ExperienciaVista[]> {
  if (MODO_DEMO) return [experienciaEjemplo];
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("experiences").select(COLUMNAS).order("creado_en");
  return (data ?? []) as ExperienciaVista[];
}

export async function obtenerExperiencia(slugOId: string): Promise<ExperienciaVista | null> {
  if (MODO_DEMO) return slugOId === experienciaEjemplo.slug || slugOId === experienciaEjemplo.id ? experienciaEjemplo : null;
  const supabase = await crearClienteServidor();
  const campo = /^[0-9a-f-]{36}$/i.test(slugOId) ? "id" : "slug";
  const { data } = await supabase.from("experiences").select(COLUMNAS).eq(campo, slugOId).maybeSingle();
  return (data as ExperienciaVista | null) ?? null;
}

// Solicitudes: la empresa ve las suyas; el equipo, todas (RLS decide).
export async function listarSolicitudes(): Promise<SolicitudExperiencia[]> {
  if (MODO_DEMO) return solicitudesEjemplo;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("experience_requests")
    .select("id, formato, personas, mes, nota, estado, valor_cotizado, creado_en, experiences(nombre), companies(nombre), impact_records(personas_impactadas, horas, pago_persona)")
    .order("creado_en", { ascending: false });
  return (data ?? []).map((s) => {
    const impacto = (s.impact_records as unknown as SolicitudExperiencia["impacto"][] | null)?.[0] ?? null;
    return {
      id: s.id as string,
      experiencia: ((s.experiences as unknown as { nombre: string } | null)?.nombre) ?? "",
      empresa: ((s.companies as unknown as { nombre: string } | null)?.nombre) ?? "",
      formato: s.formato as SolicitudExperiencia["formato"],
      personas: s.personas as number,
      mes: s.mes as string,
      nota: s.nota as string | null,
      estado: s.estado as SolicitudExperiencia["estado"],
      valor_cotizado: s.valor_cotizado as number | null,
      creado_en: s.creado_en as string,
      impacto,
    };
  });
}
