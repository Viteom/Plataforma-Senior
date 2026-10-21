import { describe, expect, it } from "vitest";

import { borradorVacio, leerBorrador, validarPerfil, type BorradorPerfil } from "@/lib/perfil/validar";

const completo: BorradorPerfil = {
  ...borradorVacio,
  nombre: "  Ana   Gómez ",
  ubicacion: "Rionegro",
  oficio: "Producción de alimentos",
  requisito: "experiencia",
  formas: ["conversacion", "proyecto"],
  horas: "15",
  modalidad: "mixto",
  tarifas: { conversacion: "150000", horas: "999" },
  orientacion: true,
  visibilidad: "reservado",
  autorizo: true,
};

describe("validarPerfil", () => {
  it("acepta un perfil completo y limpia los textos", () => {
    const r = validarPerfil(completo);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.perfil.nombre).toBe("Ana Gómez");
    expect(r.perfil.tarifas).toEqual({ conversacion: 150000 });
    expect(r.perfil.horas).toBe(15);
  });

  it("devuelve el primer paso con errores", () => {
    expect(validarPerfil({ ...completo, oficio: "" })).toMatchObject({ ok: false, paso: 1 });
    expect(validarPerfil({ ...completo, formas: [] })).toMatchObject({ ok: false, paso: 2 });
    expect(validarPerfil({ ...completo, autorizo: false })).toMatchObject({ ok: false, paso: 3 });
  });

  it("no deja seguir sin cumplir el requisito de entrada", () => {
    expect(validarPerfil({ ...completo, requisito: "ninguno" })).toMatchObject({ ok: false, paso: 1 });
  });

  it("rechaza formas de contratar inventadas y horas fuera de rango", () => {
    expect(validarPerfil({ ...completo, formas: ["vacante"] })).toMatchObject({ ok: false, paso: 2 });
    expect(validarPerfil({ ...completo, horas: "80" })).toMatchObject({ ok: false, paso: 2 });
  });
});

describe("leerBorrador", () => {
  it("no confía en lo que llega del navegador", () => {
    const b = leerBorrador(JSON.stringify({ nombre: 5, requisito: "admin", autorizo: "true", formas: "horas" }));
    expect(b.nombre).toBe("");
    expect(b.requisito).toBe("");
    expect(b.autorizo).toBe(false);
    expect(b.formas).toEqual([]);
  });

  it("tolera basura", () => {
    expect(leerBorrador("{no es json")).toEqual(leerBorrador(null));
  });
});

describe("formato de tarifas", () => {
  it("muestra pesos con puntos de mil y la unidad", async () => {
    const { pesos, textoUnidad, unidadPorDefecto } = await import("@/lib/formas");
    expect(pesos(150000).replace(/\s/g, " ")).toMatch(/\$ ?150\.000/);
    expect(textoUnidad(unidadPorDefecto.conversacion)).toBe("por conversación");
    expect(textoUnidad(unidadPorDefecto.fraccional)).toBe("al mes");
  });

  it("la conversación de una hora es la primera forma de contratar", async () => {
    const { formasContratar } = await import("@/lib/formas");
    expect(formasContratar[0].valor).toBe("conversacion");
  });
});
