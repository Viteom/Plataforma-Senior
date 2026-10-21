import { describe, expect, it } from "vitest";

import { NECESIDADES, rutaPara } from "@/lib/emprende/ruta";

describe("ruta de Emprende", () => {
  it("cada etapa empieza distinto", () => {
    expect(rutaPara("idea", [])[0].titulo).toMatch(/idea/);
    expect(rutaPara("creciendo", [])[0].titulo).toMatch(/ganancia/);
  });

  it("agrega un paso por necesidad, sin repetir y en orden", () => {
    const r = rutaPara("vendiendo", ["digital", "precios", "precios"]);
    expect(r.map((p) => p.titulo)).toEqual(["Anote lo que vende cada semana", "Calcule su precio", "Muestre lo que hace por WhatsApp"]);
  });

  it("el paso de crédito advierte sobre pedir plata por adelantado", () => {
    const [paso] = rutaPara("idea", ["dinero"]).slice(-1);
    expect(paso.descripcion).toMatch(/Desconfíe/);
  });

  it("todas las necesidades tienen un paso", () => {
    const r = rutaPara("idea", NECESIDADES.map((n) => n.valor));
    expect(r).toHaveLength(2 + NECESIDADES.length);
  });
});
