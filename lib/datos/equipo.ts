import "server-only";

import { redirect } from "next/navigation";

import { MODO_DEMO, necesidadEjemplo, perfilesEjemplo } from "@/lib/demo";
import type { Capa } from "@/lib/ia/tipos";
import { proponer, type TalentoParaMatching } from "@/lib/matching/puntaje";
import { crearClienteServidor } from "@/lib/supabase/server";

import type { NecesidadVista } from "./tipos";

// Lecturas del equipo (curador y admin). RLS les da acceso a las tablas; nada de esto pasa por
// talent_private: la fecha de nacimiento solo se ve con ver_datos_privados() y con motivo.

async function cliente() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return supabase;
}

export type Conteos = { necesidades: number; empresas: number; evidencias: number; reportes: number; ayuda: number; avisos: number; cotizaciones: number; etiquetas: number };
export type NecesidadEnCola = { id: string; problema: string; empresa: string; creado_en: string };

export async function panelEquipo(): Promise<{ conteos: Conteos; cola: NecesidadEnCola[] }> {
  if (MODO_DEMO) {
    return {
      conteos: { necesidades: 1, empresas: 1, evidencias: 2, reportes: 0, ayuda: 3, avisos: 1, cotizaciones: 1, etiquetas: 1 },
      cola: [{ id: necesidadEjemplo.id, problema: necesidadEjemplo.problema, empresa: "Alimentos del Oriente SAS", creado_en: necesidadEjemplo.creado_en }],
    };
  }
  const supabase = await cliente();
  const cuenta = { count: "exact" as const, head: true };
  const [r1, r2, r3, r4, r5, r6, r7, r8, { data: cola }] = await Promise.all([
    supabase.from("needs").select("*", cuenta).eq("estado", "en_curaduria"),
    supabase.from("companies").select("*", cuenta).is("verificada_en", null),
    supabase.from("evidence").select("*", cuenta).eq("estado", "pendiente"),
    supabase.from("company_reports").select("*", cuenta).eq("estado", "abierto"),
    supabase.from("help_requests").select("*", cuenta).eq("estado", "abierta"),
    supabase.from("notifications").select("*", cuenta).in("estado", ["pendiente", "omitido"]),
    supabase.from("experience_requests").select("*", cuenta).eq("estado", "recibida"),
    supabase.from("footprint_tags").select("*", cuenta).eq("confirmada", true).is("taxonomy_id", null).is("aprobada_en", null),
    supabase.from("needs").select("id, problema, creado_en, companies(nombre)").eq("estado", "en_curaduria").order("creado_en"),
  ]);
  const [necesidades, empresas, evidencias, reportes, ayuda, avisos, cotizaciones, etiquetas] = [r1, r2, r3, r4, r5, r6, r7, r8].map((r) => r.count ?? 0);
  return {
    conteos: { necesidades, empresas, evidencias, reportes, ayuda, avisos, cotizaciones, etiquetas },
    cola: (cola ?? []).map((n) => ({
      id: n.id as string,
      problema: n.problema as string,
      empresa: ((n.companies as unknown as { nombre: string } | null)?.nombre) ?? "",
      creado_en: n.creado_en as string,
    })),
  };
}

export type Propuesta = {
  id: string;
  talent_id: string;
  estado: string;
  puntaje: number;
  razon_curador: string | null;
  oficio: string | null;
  nombre: string;
  ubicacion: string | null;
  coincidencias: string[];
  faltan: string[];
};

export async function necesidadParaCurar(id: string): Promise<{
  necesidad: NecesidadVista;
  empresa: { nombre: string; verificada: boolean };
  propuestas: Propuesta[];
} | null> {
  if (MODO_DEMO) {
    if (id !== necesidadEjemplo.id) return null;
    const candidatos: TalentoParaMatching[] = perfilesEjemplo.map((p) => ({
      id: p.id,
      ubicacion: p.ubicacion,
      etiquetas: p.huella.map((h) => ({ ...h, taxonomyId: null })),
      ofertas: p.ofertas.map((o) => ({ tipo: o.tipo, modalidad: o.modalidad, tarifa: o.rango_min })),
      evidencias: { referenciaVerificada: p.evidencias > 0, archivoVerificado: false, evaluaciones: [] },
    }));
    const necesidad = { ...necesidadEjemplo, estado: "en_curaduria" as const };
    const resultados = proponer(candidatos, {
      requisitos: necesidad.requisitos.map((r) => ({ ...r, taxonomyId: null })),
      formatos: necesidad.formatos,
      modalidad: necesidad.modalidad,
      ubicacion: necesidad.ubicacion,
      presupuesto: necesidad.presupuesto,
    });
    return {
      necesidad,
      empresa: { nombre: "Alimentos del Oriente SAS", verificada: true },
      propuestas: resultados.map((r, i) => {
        const p = perfilesEjemplo.find((x) => x.id === r.talentoId)!;
        return {
          id: `00000000-0000-4000-f000-00000000000${i + 1}`,
          talent_id: p.id,
          estado: "propuesta",
          puntaje: r.puntaje,
          razon_curador: null,
          oficio: p.oficio,
          nombre: p.nombre ?? "Ana Gómez (ejemplo)",
          ubicacion: p.ubicacion,
          coincidencias: r.coincidencias,
          faltan: r.faltanObligatorios,
        };
      }),
    };
  }

  const supabase = await cliente();
  const { data: n } = await supabase
    .from("needs")
    .select("id, problema, formatos, modalidad, ubicacion, presupuesto, estado, creado_en, need_requirements(capa, etiqueta, obligatorio), companies(nombre, verificada_en)")
    .eq("id", id)
    .maybeSingle();
  if (!n) return null;
  const { data: conexiones } = await supabase
    .from("connections")
    .select("id, talent_id, estado, puntaje, razon_curador, detalle_curador, talent_profiles(nombre, oficio, ubicacion)")
    .eq("need_id", id)
    .order("puntaje", { ascending: false });

  const empresa = n.companies as unknown as { nombre: string; verificada_en: string | null };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se separa para no pasarlo a la vista
  const { need_requirements, companies: _empresa, ...resto } = n as unknown as NecesidadVista & {
    need_requirements: NecesidadVista["requisitos"];
    companies: unknown;
  };
  return {
    necesidad: { ...resto, requisitos: need_requirements ?? [] },
    empresa: { nombre: empresa?.nombre ?? "", verificada: Boolean(empresa?.verificada_en) },
    propuestas: (conexiones ?? []).map((c) => {
      const perfil = c.talent_profiles as unknown as { nombre: string; oficio: string | null; ubicacion: string | null };
      const detalle = (c.detalle_curador ?? {}) as { coincidencias?: string[]; faltan?: string[] };
      return {
        id: c.id as string,
        talent_id: c.talent_id as string,
        estado: c.estado as string,
        puntaje: Number(c.puntaje ?? 0),
        razon_curador: c.razon_curador as string | null,
        oficio: perfil?.oficio ?? null,
        nombre: perfil?.nombre ?? "",
        ubicacion: perfil?.ubicacion ?? null,
        coincidencias: detalle.coincidencias ?? [],
        faltan: detalle.faltan ?? [],
      };
    }),
  };
}

export type EmpresaPorVerificar = { id: string; nombre: string; nit: string | null; ciudad: string | null; contacto: string | null; verificada: boolean; estado: string };
export type Reporte = { id: string; empresa: string; motivo: string; estado: string; creado_en: string };

export async function empresasYReportes(): Promise<{ empresas: EmpresaPorVerificar[]; reportes: Reporte[] }> {
  if (MODO_DEMO) {
    return {
      empresas: [
        { id: "00000000-0000-4000-b000-000000000002", nombre: "Confecciones La Montaña SAS", nit: "901234567", ciudad: "Medellín", contacto: "Luz Marina Ríos", verificada: false, estado: "activa" },
      ],
      reportes: [],
    };
  }
  const supabase = await cliente();
  const [{ data: empresas }, { data: reportes }] = await Promise.all([
    supabase.from("companies").select("id, nombre, nit, ciudad, contacto, verificada_en, estado").order("verificada_en", { nullsFirst: true }).limit(100),
    supabase.from("company_reports").select("id, motivo, estado, creado_en, companies(nombre)").order("creado_en", { ascending: false }).limit(100),
  ]);
  return {
    empresas: (empresas ?? []).map((e) => ({ ...e, verificada: e.verificada_en !== null })) as EmpresaPorVerificar[],
    reportes: (reportes ?? []).map((r) => ({
      id: r.id as string,
      motivo: r.motivo as string,
      estado: r.estado as string,
      creado_en: r.creado_en as string,
      empresa: ((r.companies as unknown as { nombre: string } | null)?.nombre) ?? "",
    })),
  };
}

export type EvidenciaPendiente = {
  id: string;
  tipo: "referencia" | "archivo";
  descripcion: string | null;
  referencia_nombre: string | null;
  referencia_telefono: string | null;
  enlace: string | null; // URL firmada de 10 minutos para ver el archivo
  persona: string;
};
export type GuiaEditable = { tipo: string; unidad: string; minimo: number; maximo: number; fuente: string } | null;

export async function evidenciasYTarifas(): Promise<{ evidencias: EvidenciaPendiente[]; guias: Record<string, GuiaEditable> }> {
  if (MODO_DEMO) {
    return {
      evidencias: [
        { id: "00000000-0000-4000-9100-000000000001", tipo: "referencia", descripcion: "Fue mi jefe en la planta", referencia_nombre: "Carlos Pérez", referencia_telefono: "+573001112233", enlace: null, persona: "Ana Gómez (ejemplo)" },
        { id: "00000000-0000-4000-9100-000000000002", tipo: "archivo", descripcion: "Certificado de buenas prácticas", referencia_nombre: null, referencia_telefono: null, enlace: null, persona: "Gloria Restrepo" },
      ],
      guias: {},
    };
  }
  const supabase = await cliente();
  const [{ data: evidencias }, { data: guias }] = await Promise.all([
    supabase
      .from("evidence")
      .select("id, tipo, descripcion, referencia_nombre, referencia_telefono, archivo_path, talent_profiles(nombre)")
      .eq("estado", "pendiente")
      .in("tipo", ["referencia", "archivo"])
      .order("creado_en")
      .limit(50),
    supabase.from("rate_guides").select("tipo, unidad, minimo, maximo, fuente"),
  ]);
  const conEnlace = await Promise.all(
    (evidencias ?? []).map(async (e) => {
      let enlace: string | null = null;
      if (e.archivo_path) {
        const { data } = await supabase.storage.from("evidencias").createSignedUrl(e.archivo_path as string, 600);
        enlace = data?.signedUrl ?? null;
      }
      return {
        id: e.id as string,
        tipo: e.tipo as "referencia" | "archivo",
        descripcion: e.descripcion as string | null,
        referencia_nombre: e.referencia_nombre as string | null,
        referencia_telefono: e.referencia_telefono as string | null,
        enlace,
        persona: ((e.talent_profiles as unknown as { nombre: string } | null)?.nombre) ?? "",
      };
    }),
  );
  return {
    evidencias: conEnlace,
    guias: Object.fromEntries((guias ?? []).map((g) => [g.tipo as string, g as GuiaEditable])),
  };
}

export type SolicitudAyuda = { id: string; canal: string; motivo: string; estado: string; creado_en: string };
export type AvisoEnCola = { id: string; estado: string; motivo_omitido: string | null; creado_en: string; persona: string };

export async function ayudaYAvisos(): Promise<{ solicitudes: SolicitudAyuda[]; avisos: AvisoEnCola[] }> {
  if (MODO_DEMO) {
    return {
      solicitudes: [
        { id: "00000000-0000-4000-9200-000000000001", canal: "conexion_abierta", motivo: "Conexión abierta: poner en contacto a la empresa con la persona.", estado: "abierta", creado_en: "2026-10-21T14:00:00Z" },
        { id: "00000000-0000-4000-9200-000000000002", canal: "orientacion_tarifa", motivo: "Pidió orientación sobre cuánto cobrar al crear su perfil.", estado: "abierta", creado_en: "2026-10-21T12:00:00Z" },
      ],
      avisos: [{ id: "00000000-0000-4000-9300-000000000001", estado: "pendiente", motivo_omitido: null, creado_en: "2026-10-21T14:00:00Z", persona: "Ana Gómez (ejemplo)" }],
    };
  }
  const supabase = await cliente();
  const [{ data: solicitudes }, { data: avisos }] = await Promise.all([
    supabase.from("help_requests").select("id, canal, motivo, estado, creado_en").neq("estado", "cerrada").order("creado_en").limit(100),
    supabase.from("notifications").select("id, estado, motivo_omitido, creado_en, talent_profiles(nombre)").in("estado", ["pendiente", "omitido"]).order("creado_en").limit(100),
  ]);
  return {
    solicitudes: (solicitudes ?? []) as SolicitudAyuda[],
    avisos: (avisos ?? []).map((a) => ({
      id: a.id as string,
      estado: a.estado as string,
      motivo_omitido: a.motivo_omitido as string | null,
      creado_en: a.creado_en as string,
      persona: ((a.talent_profiles as unknown as { nombre: string } | null)?.nombre) ?? "",
    })),
  };
}

export type EtiquetaPorRevisar = { id: string; capa: Capa; etiqueta: string; oficio: string | null };

// Etiquetas escritas por la persona con sus palabras: las empresas no las ven hasta que el equipo
// las aprueba (puede haber un celular o la edad escritos ahí).
export async function etiquetasPorRevisar(): Promise<EtiquetaPorRevisar[]> {
  if (MODO_DEMO) {
    return [{ id: "00000000-0000-4000-9500-000000000001", capa: "oficio", etiqueta: "Tejido en telar de guanga", oficio: "Tejedora" }];
  }
  const supabase = await cliente();
  const { data } = await supabase
    .from("footprint_tags")
    .select("id, capa, etiqueta, talent_profiles(oficio)")
    .eq("confirmada", true)
    .is("taxonomy_id", null)
    .is("aprobada_en", null)
    .order("capa")
    .limit(100);
  return (data ?? []).map((t) => ({
    id: t.id as string,
    capa: t.capa as Capa,
    etiqueta: t.etiqueta as string,
    oficio: ((t.talent_profiles as unknown as { oficio: string | null } | null)?.oficio) ?? null,
  }));
}
