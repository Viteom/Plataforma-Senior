import { describe, expect, it } from "vitest";

import { sugerirPorPalabras, type EntradaTaxonomia } from "@/lib/ia/huella";

const tax: EntradaTaxonomia[] = [
  { id: "1", capa: "oficio", etiqueta: "Contabilidad", sinonimos: ["contador", "contadora"] },
  { id: "2", capa: "oficio", etiqueta: "Confección", sinonimos: ["costura", "modista"] },
  { id: "3", capa: "normas", etiqueta: "NIIF", sinonimos: [] },
  { id: "4", capa: "situaciones", etiqueta: "Inventario", sinonimos: [] },
  { id: "5", capa: "oficio", etiqueta: "Pensionado activo", sinonimos: ["pension"] },
  { id: "6", capa: "oficio", etiqueta: "Arte", sinonimos: ["art"] },
];

describe("sugerirPorPalabras (huella sin asistente)", () => {
  it("encuentra etiquetas y sinónimos sin importar tildes ni mayúsculas", () => {
    const r = sugerirPorPalabras("Fui CONTADORA en una fábrica de confeccion y llevé los inventarios.", tax);
    expect(r.map((t) => t.id).sort()).toEqual(["1", "2", "4"]);
  });

  it("no confunde partes de palabras ni términos muy cortos", () => {
    expect(sugerirPorPalabras("Trabajé en una empresa de artesanías y en el área de contabilización.", tax)).toEqual([]);
  });

  it("nunca propone etiquetas que revelan la edad", () => {
    expect(sugerirPorPalabras("Ahora vivo de mi pension y hago costura.", tax).map((t) => t.id)).toEqual(["2"]);
  });
});
