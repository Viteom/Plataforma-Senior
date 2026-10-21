import { z } from "zod";

// Contrato de extracción del brief ("Huella de experiencia"). Las capas coinciden con el
// enum capa_huella de la base, más "dudas" para precisar lo que pasó.
export const CAPAS = ["situaciones", "contexto", "escala", "oficio", "normas", "transferir"] as const;
export type Capa = (typeof CAPAS)[number];

export const EsquemaExtraccion = z.object({
  situaciones: z.array(z.string()),
  contexto: z.array(z.string()),
  escala: z.array(z.string()),
  oficio: z.array(z.string()),
  normas: z.array(z.string()),
  transferir: z.array(z.string()),
  dudas: z.array(z.string()),
});
export type Extraccion = z.infer<typeof EsquemaExtraccion>;

export type ProveedorIA = {
  nombre: "Claude" | "Gemini";
  modelo: string;
  // Devuelve la salida ya validada contra EsquemaExtraccion, o lanza FalloIA.
  extraer: (sistema: string, texto: string) => Promise<Extraccion>;
};

export type MotivoFallo = "red" | "proveedor" | "forma" | "rechazo" | "cortada";

// Error genérico: nunca lleva el texto que devolvió el proveedor (puede traer datos o detalles
// internos). El motivo sirve para el registro de uso, no para mostrarlo a la persona.
export class FalloIA extends Error {
  constructor(public motivo: MotivoFallo) {
    super(`Fallo de IA: ${motivo}`);
    this.name = "FalloIA";
  }
}

export class ConfiguracionIAIncompleta extends Error {
  constructor(public variables: string[]) {
    super(`Configuración de IA incompleta: ${variables.join(", ")}`);
    this.name = "ConfiguracionIAIncompleta";
  }
}
