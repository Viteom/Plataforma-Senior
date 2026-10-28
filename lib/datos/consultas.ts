import "server-only";

import { redirect } from "next/navigation";

import {
  conexionesEjemplo,
  empresaEjemplo,
  MODO_DEMO,
  necesidadEjemplo,
  oportunidadesEjemplo,
  perfilesEjemplo,
} from "@/lib/demo";
import { vistaEmpresaDemo, vistaTalentoDemo } from "@/lib/demo-proceso";
import { leerProcesoDemo } from "@/lib/demo-proceso-cookie";
import type { FormaContratar } from "@/lib/formas";
import { ordenarPorBusqueda } from "@/lib/matching/busqueda";
import { rutaFotoValida } from "@/lib/privacidad/foto";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

import type { ConexionEmpresa, EvidenciaVista, MiEmpresa, NecesidadVista, Oportunidad, PerfilVista, RolOrganizacion } from "./tipos";

// Lecturas para las pantallas. En modo demostración devuelven los ejemplos de lib/demo.ts con la
// misma forma; con Supabase leen solo de las vistas pensadas para cada rol.

// Demostración: el primer proceso de cada lado es el que avanza (lib/demo-proceso.ts).
async function conexionesDemo(): Promise<ConexionEmpresa[]> {
  const viva = vistaEmpresaDemo(await leerProcesoDemo());
  return [...(viva ? [viva] : []), ...conexionesEjemplo.slice(1)];
}

async function cliente() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return { supabase, user };
}

// ── Empresa ─────────────────────────────────────────────────────────────────

export async function obtenerMiEmpresa(): Promise<MiEmpresa | null> {
  if (MODO_DEMO) return empresaEjemplo;
  const { supabase } = await cliente();
  // La organización de la que esta cuenta es parte (company_members), con su rol en ella.
  const [{ data: id }, { data: rol }] = await Promise.all([supabase.rpc("mi_empresa"), supabase.rpc("mi_rol_empresa")]);
  if (!id) return null;
  const { data } = await supabase
    .from("companies")
    .select("id, nombre, nit, verificada_en, estado")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    nombre: data.nombre,
    nit: data.nit,
    verificada: data.verificada_en !== null,
    estado: data.estado,
    rol: (rol as RolOrganizacion | null) ?? "lectura",
  };
}

export async function listarPerfiles(busqueda: string, formas: FormaContratar[]): Promise<PerfilVista[]> {
  let perfiles: PerfilVista[];
  if (MODO_DEMO) {
    perfiles = perfilesEjemplo;
  } else {
    const { supabase } = await cliente();
    const { data } = await supabase.from("company_talent_view").select("*").limit(300);
    perfiles = (data ?? []) as PerfilVista[];
  }
  const filtrados = formas.length ? perfiles.filter((p) => p.ofertas.some((o) => formas.includes(o.tipo))) : perfiles;
  return ordenarPorBusqueda(filtrados, busqueda);
}

export async function obtenerPerfil(id: string): Promise<{
  perfil: PerfilVista;
  evidencias: EvidenciaVista[];
  conexion: ConexionEmpresa | null;
} | null> {
  if (MODO_DEMO) {
    const perfil = perfilesEjemplo.find((p) => p.id === id);
    if (!perfil) return null;
    const evidencias: EvidenciaVista[] = perfil.evidencias
      ? [
          {
            id: "ev1",
            tipo: "referencia",
            descripcion: "Fue su jefe en la planta",
            nota_equipo: "Confirmó que lideró la certificación de la planta.",
          },
        ]
      : [];
    return {
      perfil,
      evidencias,
      conexion: (await conexionesDemo()).find((c) => c.talent_id === id) ?? null,
    };
  }
  const { supabase } = await cliente();
  const [{ data: perfil }, { data: evidencias }, { data: conexiones }] = await Promise.all([
    supabase.from("company_talent_view").select("*").eq("id", id).maybeSingle(),
    supabase.from("company_evidence_view").select("id, tipo, descripcion, nota_equipo").eq("talent_id", id),
    supabase
      .from("company_connections_view")
      .select("*")
      .eq("talent_id", id)
      .order("actualizado_en", { ascending: false })
      .limit(1),
  ]);
  if (!perfil) return null;
  // El bucket de fotos es privado. La vista ya decidió si esta empresa puede ver la foto (perfil
  // visible o conexión abierta); el enlace firmado lo crea el servidor y vence en 10 minutos.
  const fotoPath = (perfil as PerfilVista).foto_path;
  const permitida = Boolean(perfil.identidad_visible) && rutaFotoValida(perfil.id, fotoPath);
  const admin = permitida ? crearClienteAdmin() : null;
  const fotoUrl =
    admin && fotoPath
      ? ((await admin.storage.from("fotos").createSignedUrl(fotoPath, 600)).data?.signedUrl ?? null)
      : null;
  return {
    perfil: { ...(perfil as PerfilVista), foto_url: fotoUrl },
    evidencias: (evidencias ?? []) as EvidenciaVista[],
    conexion: ((conexiones ?? [])[0] as ConexionEmpresa) ?? null,
  };
}

export async function listarConexiones(): Promise<{
  conexiones: ConexionEmpresa[];
  perfiles: Map<string, PerfilVista>;
  necesidades: NecesidadVista[];
}> {
  if (MODO_DEMO) {
    return {
      conexiones: await conexionesDemo(),
      perfiles: new Map(perfilesEjemplo.map((p) => [p.id, p])),
      necesidades: [necesidadEjemplo],
    };
  }
  const { supabase } = await cliente();
  const [{ data: conexiones }, { data: necesidades }] = await Promise.all([
    supabase.from("company_connections_view").select("*").order("actualizado_en", { ascending: false }),
    supabase
      .from("needs")
      .select("id, problema, formatos, modalidad, ubicacion, presupuesto, estado, creado_en, dignidad_estado, semaforo_motivos")
      .order("creado_en", { ascending: false }),
  ]);
  const ids = [...new Set((conexiones ?? []).map((c) => c.talent_id as string))];
  const { data: perfiles } = ids.length
    ? await supabase.from("company_talent_view").select("*").in("id", ids)
    : { data: [] };
  return {
    conexiones: (conexiones ?? []) as ConexionEmpresa[],
    perfiles: new Map(((perfiles ?? []) as PerfilVista[]).map((p) => [p.id, p])),
    necesidades: ((necesidades ?? []) as NecesidadVista[]).map((n) => ({
      ...n,
      requisitos: [],
    })),
  };
}

export async function obtenerNecesidad(id: string): Promise<{
  necesidad: NecesidadVista;
  conexiones: ConexionEmpresa[];
  perfiles: Map<string, PerfilVista>;
} | null> {
  if (MODO_DEMO) {
    if (id !== necesidadEjemplo.id) return null;
    return {
      necesidad: necesidadEjemplo,
      conexiones: (await conexionesDemo()).filter((c) => c.need_id === id),
      perfiles: new Map(perfilesEjemplo.map((p) => [p.id, p])),
    };
  }
  const { supabase } = await cliente();
  const { data: necesidad } = await supabase
    .from("needs")
    .select(
      "id, problema, formatos, modalidad, ubicacion, presupuesto, estado, creado_en, dignidad_estado, semaforo_motivos, need_requirements(capa, etiqueta, obligatorio)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!necesidad) return null;
  const { data: conexiones } = await supabase.from("company_connections_view").select("*").eq("need_id", id);
  const ids = (conexiones ?? []).map((c) => c.talent_id as string);
  const { data: perfiles } = ids.length
    ? await supabase.from("company_talent_view").select("*").in("id", ids)
    : { data: [] };
  const { need_requirements, ...resto } = necesidad as NecesidadVista & {
    need_requirements: NecesidadVista["requisitos"];
  };
  return {
    necesidad: { ...resto, requisitos: need_requirements ?? [] },
    conexiones: (conexiones ?? []) as ConexionEmpresa[],
    perfiles: new Map(((perfiles ?? []) as PerfilVista[]).map((p) => [p.id, p])),
  };
}

// ── Talento ─────────────────────────────────────────────────────────────────

export async function listarOportunidades(): Promise<Oportunidad[]> {
  if (MODO_DEMO) return [vistaTalentoDemo(await leerProcesoDemo()), ...oportunidadesEjemplo.slice(1)];
  const { supabase } = await cliente();
  const { data } = await supabase
    .from("talent_opportunities_view")
    .select("*")
    .order("creado_en", { ascending: false });
  return (data ?? []) as Oportunidad[];
}
