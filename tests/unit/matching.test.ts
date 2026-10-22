import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { coincidenciaBusqueda, ordenarPorBusqueda } from "@/lib/matching/busqueda";
import { CAMPOS_TALENTO, proponer, puntuar, type Necesidad, type TalentoParaMatching } from "@/lib/matching/puntaje";

// Regla 1 del CLAUDE.md: la edad nunca entra al matching. Fecha de nacimiento, foto, año de
// graduación y estado de pensión no son entradas del cálculo; esta prueba falla si aparecen.

const PROHIBIDOS = /nacimiento|\bedad\b|\bage\b|birth|foto|photo|graduaci|graduation|pension|jubila|retir/i;
const CARPETA = join(__dirname, "..", "..", "lib", "matching");

const talento = (sobre: Partial<TalentoParaMatching> = {}): TalentoParaMatching => ({
  id: "t1",
  etiquetas: [
    { capa: "situaciones", etiqueta: "Certificación sanitaria", taxonomyId: "s1" },
    { capa: "normas", etiqueta: "INVIMA", taxonomyId: "n1" },
    { capa: "contexto", etiqueta: "Empresa familiar", taxonomyId: "c1" },
  ],
  ofertas: [{ tipo: "proyecto", modalidad: "presencial", tarifa: 3_000_000 }],
  ubicacion: "Rionegro",
  evidencias: { referenciaVerificada: true, archivoVerificado: false, evaluaciones: [] },
  ...sobre,
});

const necesidad: Necesidad = {
  requisitos: [
    { capa: "situaciones", etiqueta: "Certificación sanitaria", taxonomyId: "s1", obligatorio: true },
    { capa: "normas", etiqueta: "INVIMA", taxonomyId: "n1", obligatorio: true },
    { capa: "contexto", etiqueta: "Alimentos", taxonomyId: "c2", obligatorio: false },
  ],
  formatos: ["proyecto"],
  modalidad: "presencial",
  ubicacion: "Rionegro",
  presupuesto: 4_000_000,
};

describe("regla 1: la edad nunca entra al matching", () => {
  it("el código del matching no menciona edad, nacimiento, foto, graduación ni pensión", () => {
    const archivos = readdirSync(CARPETA).filter((f) => f.endsWith(".ts"));
    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      const codigo = readFileSync(join(CARPETA, archivo), "utf8")
        // Los comentarios explican la regla y la nombran: se revisa solo el código.
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "");
      expect(codigo, archivo).not.toMatch(PROHIBIDOS);
    }
  });

  it("lo que el puntaje puede ver de una persona es una lista cerrada sin datos de edad", () => {
    expect([...CAMPOS_TALENTO].sort()).toEqual(["etiquetas", "evidencias", "id", "ofertas", "ubicacion"]);
    for (const campo of CAMPOS_TALENTO) expect(campo).not.toMatch(PROHIBIDOS);
  });

  it("agregar fecha de nacimiento, foto o pensión no cambia el resultado", () => {
    const limpio = puntuar(talento(), necesidad);
    const conEdad = puntuar(
      { ...talento(), fecha_nacimiento: "1950-01-01", foto_path: "x.jpg", pension: "sí", anio_graduacion: 1972 } as TalentoParaMatching,
      necesidad,
    );
    expect(conEdad).toEqual(limpio);
  });
});

describe("puntaje v1", () => {
  it("cumple todo lo obligatorio y explica por qué", () => {
    const r = puntuar(talento(), necesidad)!;
    expect(r.puntaje).toBeGreaterThan(60);
    expect(r.coincidencias).toEqual(expect.arrayContaining(["Certificación sanitaria", "INVIMA"]));
    expect(r.faltanObligatorios).toEqual([]);
    expect(r.desglose.formato).toBe(1);
    expect(r.desglose.economica).toBe(1);
  });

  it("forma de contratar es filtro duro", () => {
    expect(puntuar(talento({ ofertas: [{ tipo: "mentoria", modalidad: null, tarifa: null }] }), necesidad)).toBeNull();
  });

  it("anota los obligatorios que faltan y baja el puntaje", () => {
    const sinInvima = talento({ etiquetas: [{ capa: "situaciones", etiqueta: "Certificación sanitaria", taxonomyId: "s1" }] });
    const r = puntuar(sinInvima, necesidad)!;
    expect(r.faltanObligatorios).toEqual(["INVIMA"]);
    expect(r.puntaje).toBeLessThan(puntuar(talento(), necesidad)!.puntaje);
  });

  it("sin evidencias no queda fuera, solo suma menos", () => {
    const r = puntuar(talento({ evidencias: { referenciaVerificada: false, archivoVerificado: false, evaluaciones: [] } }), necesidad)!;
    expect(r.desglose.evidencia).toBe(0);
    expect(r.puntaje).toBeGreaterThan(0);
  });

  it("componentes sin requisito no castigan: se reparten los pesos", () => {
    const soloSituaciones: Necesidad = { ...necesidad, requisitos: [necesidad.requisitos[0]], ubicacion: null, presupuesto: null };
    const r = puntuar(talento({ evidencias: { referenciaVerificada: true, archivoVerificado: true, evaluaciones: [5] } }), soloSituaciones)!;
    expect(r.puntaje).toBe(100);
  });

  it("propone máximo 10, de mayor a menor", () => {
    const muchos = Array.from({ length: 14 }, (_, i) =>
      talento({ id: `t${i}`, evidencias: { referenciaVerificada: i % 2 === 0, archivoVerificado: false, evaluaciones: [] } }),
    );
    const r = proponer(muchos, necesidad);
    expect(r).toHaveLength(10);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].puntaje).toBeGreaterThanOrEqual(r[i].puntaje);
  });
});

describe("búsqueda en Explorar", () => {
  const perfiles = [
    { id: "a", oficio: "Contabilidad", huella: [{ etiqueta: "NIIF para pymes" }] },
    { id: "b", oficio: "Producción de alimentos", huella: [{ etiqueta: "Certificación sanitaria" }, { etiqueta: "INVIMA" }] },
  ];

  it("ordena por coincidencia con lo escrito, sin importar tildes", () => {
    expect(ordenarPorBusqueda(perfiles, "certificacion invima").map((p) => p.id)).toEqual(["b"]);
    expect(coincidenciaBusqueda(perfiles[0], "contabilidad niif")).toBe(1);
  });

  it("sin búsqueda devuelve todos", () => {
    expect(ordenarPorBusqueda(perfiles, "  ")).toHaveLength(2);
  });
});

describe("cargar candidatos", () => {
  it("lee el número de la evaluación y solo cuenta etiquetas confirmadas y evidencias verificadas", async () => {
    const { aCandidato } = await import("@/lib/matching/cargar");
    const c = aCandidato({
      id: "t",
      ubicacion: "Rionegro",
      footprint_tags: [
        { capa: "normas", etiqueta: "INVIMA", taxonomy_id: "n1", confirmada: true, aprobada_en: null },
        { capa: "normas", etiqueta: "Sin confirmar", taxonomy_id: null, confirmada: false, aprobada_en: null },
      ],
      talent_offers: [{ tipo: "proyecto", modalidad: "presencial", tarifa_esperada: 100 }],
      evidence: [
        { tipo: "evaluacion", estado: "verificada", descripcion: "Evaluación de una empresa: 4 de 5" },
        { tipo: "referencia", estado: "pendiente", descripcion: "Jefe" },
      ],
    });
    expect(c.etiquetas).toHaveLength(1);
    expect(c.evidencias).toEqual({ referenciaVerificada: false, archivoVerificado: false, evaluaciones: [4] });
  });

  // M3 de docs/revision-seguridad.md: las etiquetas libres pasan por el equipo, también en el puntaje.
  it("una etiqueta escrita por la persona cuenta solo cuando el equipo la aprobó", async () => {
    const { aCandidato } = await import("@/lib/matching/cargar");
    const c = aCandidato({
      id: "t",
      ubicacion: null,
      footprint_tags: [
        { capa: "oficio", etiqueta: "Copia del requisito de la empresa", taxonomy_id: null, confirmada: true, aprobada_en: null },
        { capa: "oficio", etiqueta: "Telar de guanga", taxonomy_id: null, confirmada: true, aprobada_en: "2026-10-22T12:00:00Z" },
      ],
      talent_offers: [],
      evidence: [],
    });
    expect(c.etiquetas.map((e) => e.etiqueta)).toEqual(["Telar de guanga"]);
  });
});
