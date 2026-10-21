import type { Capa } from "@/lib/ia/tipos";

// Cómo se nombra cada capa de la huella en la interfaz.
export const nombreCapa: Record<Capa, string> = {
  situaciones: "Situaciones que ha resuelto",
  contexto: "Dónde lo hizo",
  escala: "Tamaño de lo que manejó",
  oficio: "Su oficio",
  normas: "Normas que conoce",
  transferir: "Cómo enseña lo que sabe",
};
