import "server-only";

import { experienciaEjemplo, MODO_DEMO, oficioEjemplo, solicitudesEjemplo } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import type { ExperienciaVista, SolicitudExperiencia, TipoCampo } from "./tipos";

// Talento del campo: talleres y experiencias, y oficios por encargo. Las empresas ven solo lo
// publicado (RLS); el equipo ve todo.

const COLUMNAS =
  "id, slug, tipo, nombre, proposito, sabedora_nombre, sabedora_pueblo, temas, para_quien, beneficios, momentos, formatos, lugar, duracion, grupo_min, grupo_max, precio_desde, porcentaje_sabedora, testimonio, estado, aprobada_por_sabedora_en";

export async function listarExperiencias(tipo?: TipoCampo): Promise<ExperienciaVista[]> {
  if (MODO_DEMO) return [experienciaEjemplo, oficioEjemplo].filter((e) => !tipo || e.tipo === tipo);
  const supabase = await crearClienteServidor();
  let consulta = supabase.from("experiences").select(COLUMNAS).order("creado_en");
  if (tipo) consulta = consulta.eq("tipo", tipo);
  const { data } = await consulta;
  return (data ?? []) as ExperienciaVista[];
}

export async function obtenerExperiencia(slugOId: string): Promise<ExperienciaVista | null> {
  if (MODO_DEMO) return [experienciaEjemplo, oficioEjemplo].find((e) => e.slug === slugOId || e.id === slugOId) ?? null;
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
    .select("id, formato, personas, mes, nota, estado, valor_cotizado, creado_en, experiences(nombre, tipo), companies(nombre), impact_records(personas_impactadas, horas, pago_persona)")
    .order("creado_en", { ascending: false });
  return (data ?? []).map((s) => {
    const impacto = (s.impact_records as unknown as SolicitudExperiencia["impacto"][] | null)?.[0] ?? null;
    return {
      id: s.id as string,
      experiencia: ((s.experiences as unknown as { nombre: string } | null)?.nombre) ?? "",
      tipo: ((s.experiences as unknown as { tipo: TipoCampo } | null)?.tipo) ?? "experiencia",
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
