import type { EstadoSolicitud, TipoCampo } from "@/lib/datos/tipos";

// Talento del campo: talleres y experiencias, u oficios por encargo. Los mismos campos de la base
// se nombran distinto según el tipo.
export const TEXTO_TIPO: Record<
  TipoCampo,
  {
    nombre: string;
    plural: string;
    quien: string;
    duracion: string;
    grupo: string;
    unidad: string;
    cantidad: string;
    proceso: string;
    recibe: string;
    formato: Record<"territorio" | "sede", string>;
  }
> = {
  experiencia: {
    nombre: "Taller o experiencia",
    plural: "Talleres y experiencias",
    quien: "Sabedora o sabedor",
    duracion: "Duración",
    grupo: "Grupo",
    unidad: "personas",
    cantidad: "¿Cuántas personas?",
    proceso: "Cómo transcurre",
    recibe: "Lo que se lleva tu equipo",
    formato: { territorio: "En el territorio", sede: "En tu sede" },
  },
  oficio: {
    nombre: "Oficio por encargo",
    plural: "Oficios por encargo",
    quien: "Quién lo hace",
    duracion: "Tiempo de entrega",
    grupo: "Pedido",
    unidad: "piezas o trabajos",
    cantidad: "¿Cuántas piezas o trabajos?",
    proceso: "Cómo se hace",
    recibe: "Lo que recibes",
    formato: { territorio: "Se hace en el territorio", sede: "Se entrega o se hace en tu sede" },
  },
};

export const TEXTO_FORMATO = TEXTO_TIPO.experiencia.formato;

// Estado de una solicitud de cotización, en palabras (brief: recibida → cotizada → confirmada →
// realizada → reporte de impacto enviado).
export const TEXTO_SOLICITUD: Record<EstadoSolicitud, string> = {
  recibida: "Recibida: te enviamos la cotización pronto",
  cotizada: "Cotizada: esperamos tu confirmación",
  confirmada: "Confirmada",
  realizada: "Realizada",
  reporte_enviado: "Realizada, con reporte de impacto",
};

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
