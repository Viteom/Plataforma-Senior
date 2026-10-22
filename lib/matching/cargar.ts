import type { FormaContratar } from "@/lib/formas";
import type { Capa } from "@/lib/ia/tipos";

import type { TalentoParaMatching } from "./puntaje";

// Arma lo que el puntaje puede ver de cada persona a partir de filas de la base. La consulta pide
// solo estas columnas: tests/unit/matching.test.ts revisa también este archivo (regla 1).
export const COLUMNAS_CANDIDATOS =
  "id, ubicacion, footprint_tags(capa, etiqueta, taxonomy_id, confirmada, aprobada_en), talent_offers(tipo, modalidad, tarifa_esperada), evidence(tipo, estado, descripcion)";

type FilaCandidato = {
  id: string;
  ubicacion: string | null;
  footprint_tags: { capa: Capa; etiqueta: string; taxonomy_id: string | null; confirmada: boolean; aprobada_en: string | null }[];
  talent_offers: { tipo: FormaContratar; modalidad: string | null; tarifa_esperada: number | null }[];
  evidence: { tipo: string; estado: string; descripcion: string | null }[];
};

export function aCandidato(fila: FilaCandidato): TalentoParaMatching {
  const verificadas = fila.evidence.filter((e) => e.estado === "verificada");
  return {
    id: fila.id,
    ubicacion: fila.ubicacion,
    // Igual que company_talent_view: una etiqueta escrita por la persona cuenta solo cuando el
    // equipo la aprobó. Si no, bastaría copiar el texto de un requisito para subir el puntaje.
    etiquetas: fila.footprint_tags
      .filter((t) => t.confirmada && (t.taxonomy_id !== null || t.aprobada_en !== null))
      .map((t) => ({ capa: t.capa, etiqueta: t.etiqueta, taxonomyId: t.taxonomy_id })),
    ofertas: fila.talent_offers.map((o) => ({ tipo: o.tipo, modalidad: o.modalidad, tarifa: o.tarifa_esperada })),
    evidencias: {
      referenciaVerificada: verificadas.some((e) => e.tipo === "referencia"),
      archivoVerificado: verificadas.some((e) => e.tipo === "archivo"),
      // La función actuar_conexion guarda la evaluación como "Evaluación de una empresa: N de 5".
      evaluaciones: verificadas
        .filter((e) => e.tipo === "evaluacion")
        .map((e) => Number(/(\d)\s+de\s+5/.exec(e.descripcion ?? "")?.[1]))
        .filter((n) => n >= 1 && n <= 5),
    },
  };
}
