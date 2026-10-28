import { describe, expect, it } from "vitest";

import { hashDestino, normalizarCelular, normalizarCorreo } from "@/lib/auth/destino";
import { decidirRuta, inicioDe } from "@/lib/auth/rutas";

describe("normalizarCelular", () => {
  it.each([
    ["300 123 4567", "+573001234567"],
    ["300-123-4567", "+573001234567"],
    ["+57 300 123 4567", "+573001234567"],
    ["573001234567", "+573001234567"],
  ])("%s → %s", (entrada, esperado) => {
    expect(normalizarCelular(entrada)).toBe(esperado);
  });

  it.each(["604 444 5555", "30012345", "3001234567890", "abc"])("rechaza %s", (entrada) => {
    expect(normalizarCelular(entrada)).toBeNull();
  });
});

describe("normalizarCorreo", () => {
  it("pasa a minúsculas y quita espacios", () => {
    expect(normalizarCorreo("  Ana@Correo.COM ")).toBe("ana@correo.com");
  });
  it("rechaza lo que no es correo", () => {
    expect(normalizarCorreo("ana@correo")).toBeNull();
  });
});

describe("hashDestino", () => {
  it("da 64 caracteres y no contiene el número", async () => {
    const h = await hashDestino("+573001234567");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("3001234567");
  });
});

describe("decidirRuta", () => {
  it("sin sesión: lo público abre, lo demás manda a /entrar", () => {
    expect(decidirRuta("/", null)).toBeNull();
    expect(decidirRuta("/ayuda", null)).toBeNull();
    expect(decidirRuta("/entrar/codigo", null)).toBeNull();
    for (const web of ["/talento", "/organizaciones", "/campo", "/confianza"]) {
      expect(decidirRuta(web, null)).toBeNull();
    }
    // Talento del campo de la empresa sigue protegido, aunque la web tenga /campo.
    expect(decidirRuta("/empresa/campo", null)).toBe("/entrar");
    expect(decidirRuta("/inicio", null)).toBe("/entrar");
    expect(decidirRuta("/empresa/explorar", null)).toBe("/entrar");
    expect(decidirRuta("/equipo", null)).toBe("/equipo/entrar");
    expect(decidirRuta("/equipo/entrar", null)).toBeNull();
  });

  it("cada rol queda en su área", () => {
    expect(decidirRuta("/empresa/perfil/1", "talento")).toBe("/inicio");
    expect(decidirRuta("/inicio", "empresa")).toBe("/empresa/explorar");
    expect(decidirRuta("/equipo", "empresa")).toBe("/empresa/explorar");
    expect(decidirRuta("/equipo/ayuda", "gestor")).toBe("/gestor/registrar");
    expect(decidirRuta("/gestor/registrar", "curador", true)).toBe("/equipo");
    expect(decidirRuta("/huella", "talento")).toBeNull();
    expect(decidirRuta("/empresa/procesos", "empresa")).toBeNull();
  });

  it("el equipo solo pasa con segundo factor; su entrada no es para otros roles", () => {
    for (const rol of ["curador", "admin"] as const) {
      expect(decidirRuta("/equipo", rol)).toBe("/equipo/entrar");
      expect(decidirRuta("/equipo/bienestar", rol)).toBe("/equipo/entrar");
      expect(decidirRuta("/inicio", rol)).toBe("/equipo/entrar");
      expect(decidirRuta("/equipo/entrar", rol)).toBeNull();
      expect(decidirRuta("/ayuda", rol)).toBeNull();
      expect(decidirRuta("/equipo", rol, true)).toBeNull();
      expect(decidirRuta("/equipo/entrar", rol, true)).toBe("/equipo");
      expect(decidirRuta("/entrar", rol)).toBe("/equipo");
    }
    expect(decidirRuta("/equipo/entrar", "talento")).toBe("/inicio");
    expect(decidirRuta("/equipo/entrar", "empresa")).toBe("/empresa/explorar");
    expect(decidirRuta("/gestor/registrar", "gestor")).toBeNull();
  });

  it("no confunde prefijos parecidos", () => {
    expect(decidirRuta("/empresariales", null)).toBeNull();
    expect(decidirRuta("/equipos", "talento")).toBeNull();
  });

  it("ayuda abre para todos los roles", () => {
    for (const rol of ["talento", "empresa", "curador", "gestor", "admin"] as const) {
      expect(decidirRuta("/ayuda", rol)).toBeNull();
    }
  });

  it("con sesión, /entrar lleva al inicio de su rol", () => {
    expect(decidirRuta("/entrar", "empresa")).toBe(inicioDe("empresa"));
  });

  it("admin con segundo factor entra a todas las áreas", () => {
    for (const r of ["/inicio", "/empresa/explorar", "/equipo", "/gestor/registrar"]) {
      expect(decidirRuta(r, "admin", true)).toBeNull();
    }
  });
});

describe("enmascarar", () => {
  it("oculta la mitad del celular y del correo", async () => {
    const { enmascarar } = await import("@/lib/auth/destino");
    expect(enmascarar({ tipo: "celular", valor: "+573001234567" })).toBe("300 *** 4567");
    expect(enmascarar({ tipo: "correo", valor: "ana@correo.com" })).toBe("a***@correo.com");
  });
});
