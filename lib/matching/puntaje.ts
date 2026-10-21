import type { FormaContratar } from "@/lib/formas";
import type { Capa } from "@/lib/ia/tipos";

// Puntaje v1 por reglas (brief, "Matching versión 1"). Sin IA.
//
// Regla 1: este módulo solo conoce los campos de TalentoParaMatching. No hay fecha de nacimiento,
// foto, año de graduación ni pensión, y tests/unit/matching.test.ts falla si aparecen aquí.

export const COMPONENTES = [
  "situaciones",
  "oficio_normas",
  "contexto_escala",
  "formato",
  "evidencia",
  "ubicacion",
  "economica",
  "proposito",
] as const;
export type Componente = (typeof COMPONENTES)[number];
export type Pesos = Record<Componente, number>;

export const PESOS_BRIEF: Pesos = {
  situaciones: 0.3,
  oficio_normas: 0.15,
  contexto_escala: 0.15,
  formato: 0.15,
  evidencia: 0.1,
  ubicacion: 0.05,
  economica: 0.05,
  proposito: 0.05,
};

export type Etiqueta = { capa: Capa; etiqueta: string; taxonomyId: string | null };

// Lista cerrada de lo que el puntaje puede ver de una persona.
export const CAMPOS_TALENTO = ["id", "etiquetas", "ofertas", "ubicacion", "evidencias"] as const;
export type TalentoParaMatching = {
  id: string;
  etiquetas: Etiqueta[]; // solo confirmadas
  ofertas: { tipo: FormaContratar; modalidad: string | null; tarifa: number | null }[];
  ubicacion: string | null;
  evidencias: { referenciaVerificada: boolean; archivoVerificado: boolean; evaluaciones: number[] };
};

export type Necesidad = {
  requisitos: (Etiqueta & { obligatorio: boolean })[];
  formatos: FormaContratar[];
  modalidad: string | null;
  ubicacion: string | null;
  presupuesto: number | null;
};

export type Resultado = {
  talentoId: string;
  puntaje: number; // 0 a 100
  desglose: Partial<Record<Componente, number>>; // 0 a 1 por componente evaluado
  coincidencias: string[];
  faltanObligatorios: string[];
};

const CAPAS_DE: Record<"situaciones" | "oficio_normas" | "contexto_escala", Capa[]> = {
  situaciones: ["situaciones"],
  oficio_normas: ["oficio", "normas"],
  contexto_escala: ["contexto", "escala"],
};

const clave = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const misma = (a: Etiqueta, b: Etiqueta) =>
  a.capa === b.capa && (a.taxonomyId && b.taxonomyId ? a.taxonomyId === b.taxonomyId : clave(a.etiqueta) === clave(b.etiqueta));

// Devuelve null si la persona no cumple el filtro duro (ninguna forma de contratar pedida).
export function puntuar(t: TalentoParaMatching, n: Necesidad, pesos: Pesos = PESOS_BRIEF): Resultado | null {
  const ofertasUtiles = n.formatos.length ? t.ofertas.filter((o) => n.formatos.includes(o.tipo)) : t.ofertas;
  if (n.formatos.length && !ofertasUtiles.length) return null;

  const desglose: Partial<Record<Componente, number>> = {};
  const coincidencias: string[] = [];
  const faltanObligatorios: string[] = [];

  // Etiquetas: los obligatorios cuentan doble. Un componente sin requisitos no se evalúa.
  for (const comp of ["situaciones", "oficio_normas", "contexto_escala"] as const) {
    const requisitos = n.requisitos.filter((r) => CAPAS_DE[comp].includes(r.capa));
    if (!requisitos.length) continue;
    let total = 0;
    let logrado = 0;
    for (const r of requisitos) {
      const peso = r.obligatorio ? 2 : 1;
      total += peso;
      if (t.etiquetas.some((e) => misma(e, r))) {
        logrado += peso;
        coincidencias.push(r.etiqueta);
      } else if (r.obligatorio) {
        faltanObligatorios.push(r.etiqueta);
      }
    }
    desglose[comp] = logrado / total;
  }

  desglose.formato = 1;

  const { referenciaVerificada, archivoVerificado, evaluaciones } = t.evidencias;
  const promedio = evaluaciones.length ? evaluaciones.reduce((a, b) => a + b, 0) / evaluaciones.length / 5 : 0;
  // Reparto del brief (A3): referencia 40 %, archivo 30 %, evaluaciones 30 %.
  desglose.evidencia = 0.4 * Number(referenciaVerificada) + 0.3 * Number(archivoVerificado) + 0.3 * promedio;

  if (n.modalidad === "remoto") {
    desglose.ubicacion = 1;
  } else if (n.ubicacion) {
    const mismaZona = t.ubicacion ? clave(t.ubicacion).includes(clave(n.ubicacion)) || clave(n.ubicacion).includes(clave(t.ubicacion)) : false;
    const trabajaRemoto = ofertasUtiles.some((o) => o.modalidad === "remoto" || o.modalidad === "mixto");
    desglose.ubicacion = mismaZona ? 1 : trabajaRemoto && n.modalidad === "mixto" ? 0.5 : 0;
  }

  const tarifas = ofertasUtiles.map((o) => o.tarifa).filter((x): x is number => typeof x === "number" && x > 0);
  if (n.presupuesto && tarifas.length) {
    const tarifa = Math.min(...tarifas);
    desglose.economica = tarifa <= n.presupuesto ? 1 : Math.max(0, 1 - (tarifa - n.presupuesto) / n.presupuesto);
  }

  // "Propósito y cultura" es opcional en v1: no se evalúa. Los pesos se reparten entre lo evaluado.
  const evaluados = COMPONENTES.filter((c) => desglose[c] !== undefined);
  const sumaPesos = evaluados.reduce((s, c) => s + pesos[c], 0);
  const puntaje = sumaPesos ? (evaluados.reduce((s, c) => s + pesos[c] * desglose[c]!, 0) / sumaPesos) * 100 : 0;

  return { talentoId: t.id, puntaje: Math.round(puntaje), desglose, coincidencias, faltanObligatorios };
}

// Los 10 mejores para que el curador elija hasta 5 (brief).
export function proponer(talentos: TalentoParaMatching[], n: Necesidad, pesos: Pesos = PESOS_BRIEF, cuantos = 10) {
  return talentos
    .map((t) => puntuar(t, n, pesos))
    .filter((r): r is Resultado => r !== null)
    .sort((a, b) => b.puntaje - a.puntaje || a.faltanObligatorios.length - b.faltanObligatorios.length)
    .slice(0, cuantos);
}
