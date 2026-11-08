import { describe, expect, it } from "vitest";

import { traducirFrases } from "@/lib/huella/diccionario";
import { esOficioPresencial, modalidadDeLaForma, palabraValida } from "@/lib/oficios-presenciales";
import { borradorVacio, erroresDelPaso, leerBorrador, validarPerfil } from "@/lib/perfil/validar";

describe("oficios que siempre son presenciales", () => {
  it("reconoce el oficio sin importar tildes, mayúsculas ni terminación", () => {
    for (const oficio of ["Cuidadora", "CUIDADO DE NIÑOS", "Servicios generales", "Cocinera", "Albañil", "Mecánico de motos", "Conductor"]) {
      expect(esOficioPresencial(oficio), oficio).toBe(true);
    }
  });

  it("no se confunde con otros oficios", () => {
    for (const oficio of ["Contabilidad", "Maniobras financieras", "Tejido artesanal", "Docencia", "Ventas"]) {
      expect(esOficioPresencial(oficio), oficio).toBe(false);
    }
  });

  it("con oficio presencial, solo mentorías y talleres pueden ser desde la casa, y si la persona lo activa", () => {
    expect(modalidadDeLaForma("horas", "remoto", true, true)).toBe("presencial");
    expect(modalidadDeLaForma("mentoria", "remoto", true, false)).toBe("presencial");
    expect(modalidadDeLaForma("mentoria", "presencial", true, true)).toBe("mixto");
    expect(modalidadDeLaForma("experiencia", "presencial", true, true)).toBe("mixto");
    expect(modalidadDeLaForma("horas", "remoto", false, false)).toBe("remoto");
  });

  it("la palabra del panel se guarda como se compara", () => {
    expect(palabraValida("  Lavandería ")).toBe("lavanderia");
    expect(palabraValida("ab")).toBeNull();
    expect(palabraValida("123")).toBeNull();
  });
});

describe("diccionario de frases", () => {
  it("traduce frases de todos los días al lenguaje de empresa", () => {
    const r = traducirFrases("Yo hago visitas a las tiendas y llevaba las cuentas del negocio. Tenía gente a cargo.");
    expect(r).toEqual([
      { capa: "oficio", etiqueta: "Ventas" },
      { capa: "oficio", etiqueta: "Contabilidad" },
      { capa: "escala", etiqueta: "Personas a cargo" },
    ]);
  });

  it("no inventa etiquetas sin frase", () => {
    expect(traducirFrases("Me gusta leer y caminar por el parque.")).toEqual([]);
    expect(traducirFrases("Trabajé con un vendor extranjero")).toEqual([]);
  });
});

describe("registro en 3 preguntas y datos privados", () => {
  const base = { ...borradorVacio, nombre: "Rosa", ubicacion: "Pasto", oficio: "Cocina", requisito: "edad" as const, formas: ["horas"], autorizo: true };

  it("las horas aceptan dos cifras y el país viene en Colombia", () => {
    expect(erroresDelPaso({ ...base, horas: "20" }, 2)).toEqual({});
    expect(erroresDelPaso({ ...base, horas: "60" }, 2).horas).toBeTruthy();
    expect(borradorVacio.pais).toBe("Colombia");
  });

  it("la cédula es opcional y se limpia", () => {
    expect(erroresDelPaso(base, 3)).toEqual({});
    expect(erroresDelPaso({ ...base, cedula: "12@" }, 3).cedula).toBeTruthy();
    const r = validarPerfil({ ...base, cedula: "1.023.456" });
    expect(r.ok && r.perfil.cedula).toBe("1023456");
  });

  it("lee un borrador de antes (sin campos nuevos) sin romperse", () => {
    const b = leerBorrador(JSON.stringify({ nombre: "Rosa", sexo: "x", postura: "acostada" }));
    expect(b.pais).toBe("Colombia");
    expect(b.sexo).toBe("");
    expect(b.postura).toBe("");
    expect(b.distancia).toBe(false);
  });
});
