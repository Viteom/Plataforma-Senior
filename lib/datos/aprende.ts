import "server-only";

import { MODO_DEMO } from "@/lib/demo";
import type { TemaCurso } from "@/lib/emprende/ruta";
import { crearClienteServidor } from "@/lib/supabase/server";

// Aprende: catálogo enlazado de cursos de otras entidades (brief). El equipo lo cura.

export type Curso = {
  id: string;
  titulo: string;
  entidad: string;
  url: string;
  tema: TemaCurso;
  modalidad: "virtual" | "presencial" | "mixta" | null;
  gratuito: boolean;
  descripcion: string | null;
};

export const TEMAS: { valor: TemaCurso; etiqueta: string }[] = [
  { valor: "digital", etiqueta: "Herramientas digitales" },
  { valor: "cobrar", etiqueta: "Cobrar por su trabajo" },
  { valor: "mentoria", etiqueta: "Mentoría" },
  { valor: "negocio", etiqueta: "Su propio negocio" },
  { valor: "oficio", etiqueta: "Oficios" },
];

// Mismo punto de partida que la migración: la oferta del SENA.
const CURSOS_EJEMPLO: Curso[] = [
  {
    id: "00000000-0000-4000-9600-000000000001",
    titulo: "Cursos cortos gratuitos del SENA",
    entidad: "SENA (Sofía Plus)",
    url: "https://oferta.senasofiaplus.edu.co/",
    tema: "digital",
    modalidad: "virtual",
    gratuito: true,
    descripcion: "Busque cursos de herramientas digitales, emprendimiento y oficios. Se inscribe con su documento.",
  },
];

export async function listarCursos(tema?: TemaCurso): Promise<Curso[]> {
  let cursos: Curso[];
  if (MODO_DEMO) {
    cursos = CURSOS_EJEMPLO;
  } else {
    const supabase = await crearClienteServidor();
    const { data } = await supabase.from("courses").select("id, titulo, entidad, url, tema, modalidad, gratuito, descripcion").eq("publicado", true).order("titulo");
    cursos = (data ?? []) as Curso[];
  }
  return tema ? cursos.filter((c) => c.tema === tema) : cursos;
}
