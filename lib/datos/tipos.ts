import type { FormaContratar } from "@/lib/formas";
import type { Capa } from "@/lib/ia/tipos";

// Formas de los datos que usan las pantallas. Las mismas en modo real (vistas de Supabase) y en
// modo demostración (lib/demo.ts). Ninguna incluye edad.

export type OfertaVista = {
  tipo: FormaContratar;
  horas_semana: number | null;
  modalidad: string | null;
  rango_min: number | null;
  rango_max: number | null;
};

// Fila de company_talent_view.
export type PerfilVista = {
  id: string;
  visibilidad: "reservado" | "visible";
  identidad_visible: boolean;
  nombre: string | null;
  resumen: string | null;
  oficio: string | null;
  ubicacion: string | null;
  huella: { capa: Capa; etiqueta: string }[];
  ofertas: OfertaVista[];
  evidencias: number;
};

export type EvidenciaVista = { id: string; tipo: "referencia" | "archivo" | "evaluacion"; descripcion: string | null; nota_equipo: string | null };

export type MiEmpresa = { id: string; nombre: string; nit: string | null; verificada: boolean; estado: "activa" | "pausada" };

// Estados como los ve la empresa (company_connections_view).
export type EstadoEmpresa = "esperando" | "no_disponible" | "le_interesa" | "abierta" | "cerrada" | "pausada";

export type ConexionEmpresa = {
  id: string;
  talent_id: string;
  need_id: string | null;
  origen: "exploracion" | "problema";
  estado: EstadoEmpresa;
  puntaje: number | null;
  desglose: Record<string, number> | null;
  razon_curador: string | null;
  actualizado_en: string;
};

export type NecesidadVista = {
  id: string;
  problema: string;
  formatos: FormaContratar[];
  modalidad: string | null;
  ubicacion: string | null;
  presupuesto: number | null;
  estado: "en_curaduria" | "enviada" | "cerrada";
  creado_en: string;
  requisitos: { capa: Capa; etiqueta: string; obligatorio: boolean }[];
};

// Fila de talent_opportunities_view.
export type Oportunidad = {
  id: string;
  origen: "exploracion" | "problema";
  estado: string;
  empresa: string;
  sector: string | null;
  ciudad: string | null;
  empresa_verificada: boolean;
  problema: string | null;
  formatos: FormaContratar[] | null;
  modalidad: string | null;
  creado_en: string;
};
