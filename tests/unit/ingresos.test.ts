import { describe, expect, it } from "vitest";

import { ingresoMensual, leerAvisos, textoAviso } from "@/lib/ingresos";
import { borradorVacio, leerBorrador, validarPerfil } from "@/lib/perfil/validar";

describe("avisos por pensión o subsidio", () => {
  it("calcula el ingreso mensual como la base", () => {
    expect(ingresoMensual(1000000, "mes", null)).toBe(1000000);
    expect(ingresoMensual(7000, "hora", 10)).toBe(300000);
    expect(ingresoMensual(1400000, "proyecto", null)).toBeCloseTo(1500000);
    expect(ingresoMensual(100000, "conversacion", null)).toBeNull();
    expect(ingresoMensual(7000, "hora", null)).toBeNull();
  });

  it("solo acepta los avisos que conoce", () => {
    expect(leerAvisos(null)).toEqual([]);
    expect(leerAvisos([{ codigo: "aportes" }, { codigo: "otro" }, null, "x"])).toEqual([{ codigo: "aportes" }]);
  });

  it("explica cuándo se puede perder Colombia Mayor, con el tope del hogar", () => {
    const pierde = textoAviso({ codigo: "colombia_mayor", mensual: 500000, total: 800000, tope: 700000, hogar: null, supera: true });
    expect(pierde.importante).toBe(true);
    expect(pierde.texto).toMatch(/sin compañía/);
    expect(pierde.texto).toMatch(/con los trabajos que ya tienes/);
    const bien = textoAviso({ codigo: "colombia_mayor", mensual: 300000, total: 300000, tope: 1400000, hogar: "familia", supera: false });
    expect(bien.importante).toBe(false);
    expect(bien.texto).toMatch(/con tu familia/);
    expect(bien.texto).not.toMatch(/ya tienes/);
  });

  it("los textos no usan palabras de edad ni asumen el género", () => {
    for (const codigo of ["entidad_publica", "aportes"] as const) {
      expect(textoAviso({ codigo }).texto).not.toMatch(/adulto mayor|tercera edad|\bsola\b|\bsolo\b/i);
    }
  });
});

describe("la pregunta en el registro", () => {
  it("es opcional y descarta valores desconocidos", () => {
    const base = {
      ...borradorVacio,
      nombre: "Ana",
      ubicacion: "Pasto",
      oficio: "Cocina",
      requisito: "experiencia" as const,
      formas: ["horas"],
      autorizo: true,
    };
    const sin = validarPerfil(base);
    expect(sin.ok && sin.perfil.ingresos).toBeNull();

    const raro = leerBorrador(JSON.stringify({ ...base, ingresos: "jubilado", hogar: "x" }));
    expect(raro.ingresos).toBe("");
    expect(raro.hogar).toBe("");
  });

  it("guarda con quién vive solo cuando recibe Colombia Mayor", () => {
    const base = {
      ...borradorVacio,
      nombre: "Ana",
      ubicacion: "Pasto",
      oficio: "Cocina",
      requisito: "experiencia" as const,
      formas: ["horas"],
      autorizo: true,
    };
    const cm = validarPerfil({ ...base, ingresos: "colombia_mayor", hogar: "familia" });
    expect(cm.ok && [cm.perfil.ingresos, cm.perfil.hogar]).toEqual(["colombia_mayor", "familia"]);
    const pension = validarPerfil({ ...base, ingresos: "vejez_invalidez", hogar: "familia" });
    expect(pension.ok && pension.perfil.hogar).toBeNull();
  });
});
