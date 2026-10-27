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
  foto_path?: string | null; // la vista solo la trae si la identidad es visible
  foto_url?: string | null; // enlace firmado de pocos minutos, solo en la ficha
  resumen: string | null;
  oficio: string | null;
  ubicacion: string | null;
  huella: { capa: Capa; etiqueta: string }[];
  ofertas: OfertaVista[];
  evidencias: number;
};

export type EvidenciaVista = {
  id: string;
  tipo: "referencia" | "archivo" | "evaluacion";
  descripcion: string | null;
  nota_equipo: string | null;
};

export type MiEmpresa = {
  id: string;
  nombre: string;
  nit: string | null;
  verificada: boolean;
  estado: "activa" | "pausada";
};

// Estados como los ve la empresa (company_connections_view).
export type EstadoEmpresa =
  | "esperando"
  | "no_disponible"
  | "le_interesa"
  | "sin_respuesta"
  | "abierta"
  | "conversacion"
  | "acuerdo"
  | "en_curso"
  | "cerrada"
  | "pausada";

// Lo que las dos partes ven del proceso después de abrirse: conversación, acuerdo y cierre.
export type DatosEtapas = {
  acuerdo_revisado_en?: string | null;
  conversacion_en: string | null;
  conversacion_modo: "llamada" | "videollamada" | "presencial" | null;
  conversacion_confirmada: boolean;
  acuerdo_forma: FormaContratar | null;
  acuerdo_horas_semana: number | null;
  acuerdo_valor: number | null;
  acuerdo_unidad: string | null;
  acuerdo_inicio: string | null;
  acuerdo_nota: string | null;
  acuerdo_aceptado_en: string | null;
  cierre_tipo: "terminado" | "no_sigue" | null;
  cerrada_por: "empresa" | "talento" | "equipo" | null;
  motivo_cierre: string | null; // solo si cerró la organización
  // Suben cada vez que la organización cambia el acuerdo o la fecha. La persona responde a la
  // versión que vio: si cambió mientras miraba, la base le pide revisarla de nuevo.
  acuerdo_version: number;
  conversacion_version: number;
};

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
  dias_esperando?: number | null;
  evaluacion_empresa?: number | null;
} & Partial<DatosEtapas>;

export type NecesidadVista = {
  revision_version?: number;
  jornada_horas?: number | null;
  remuneracion?: number | null;
  remuneracion_unidad?: string | null;
  condiciones?: string | null;
  dignidad_estado?: string;

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
  evaluacion_talento?: number | null;
} & Partial<DatosEtapas>;

// Fila de experiences (lo público; el equipo ve además el estado y la aprobación).
export type TipoCampo = "experiencia" | "oficio";

export type ExperienciaVista = {
  id: string;
  slug: string;
  tipo: TipoCampo;
  nombre: string;
  proposito: string;
  sabedora_nombre: string | null;
  sabedora_pueblo: string | null;
  temas: string[];
  para_quien: string | null;
  beneficios: string[];
  momentos: { titulo: string; descripcion: string }[];
  formatos: ("territorio" | "sede")[];
  lugar: string | null;
  duracion: string | null;
  grupo_min: number | null;
  grupo_max: number | null;
  precio_desde: number | null;
  porcentaje_sabedora: number | null;
  testimonio: string | null;
  estado: "borrador" | "publicada" | "pausada";
  aprobada_por_sabedora_en: string | null;
};

export type EstadoSolicitud =
  "recibida" | "cotizada" | "confirmada" | "realizada" | "reporte_enviado";

export type SolicitudExperiencia = {
  id: string;
  experiencia: string;
  tipo: TipoCampo;
  empresa: string;
  formato: "territorio" | "sede";
  personas: number;
  mes: string;
  nota: string | null;
  estado: EstadoSolicitud;
  valor_cotizado: number | null;
  creado_en: string;
  impacto: {
    personas_impactadas: number;
    horas: number;
    pago_persona: number;
  } | null;
};
