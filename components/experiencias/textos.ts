import type { EstadoSolicitud } from "@/lib/datos/tipos";

export const TEXTO_FORMATO = { territorio: "En el territorio", sede: "En tu sede" } as const;

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
