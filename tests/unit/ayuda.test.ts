import { describe, expect, it } from "vitest";

import { responder } from "@/lib/ayuda/respuestas";

describe("chat de ayuda sin IA", () => {
  it.each([
    ["Me pidieron plata para el examen médico", "fraude"],
    ["me estafaron con una oferta", "fraude"],
    ["es una emergencia", "emergencia"],
    ["mi esposo me pega", "violencia"],
    ["estoy enfermo y no puedo ir", "salud"],
    ["¿cuánto me van a pagar por el contrato?", "pagos"],
  ])("«%s» pasa a una persona (%s) sin respuesta automática", (mensaje, categoria) => {
    const r = responder(mensaje);
    expect(r).toMatchObject({ tipo: "riesgo", categoria });
  });

  it("en una emergencia indica la línea 123", () => {
    expect(responder("es una urgencia").texto).toContain("123");
  });

  it("ante un posible fraude recuerda que nadie pide dinero", () => {
    expect(responder("me pidieron consignar").texto).toMatch(/Nadie .* dinero/);
  });

  it.each([
    ["No me llega el código", "/entrar"],
    ["¿Quién ve mi nombre?", "/mi-perfil"],
    ["No sé escribir bien, ¿puedo hablar?", "/huella"],
    ["quiero borrar mis datos", "/mi-perfil"],
  ])("responde preguntas frecuentes: «%s»", (mensaje, href) => {
    const r = responder(mensaje);
    expect(r.tipo).toBe("respuesta");
    if (r.tipo === "respuesta") expect(r.enlace?.href).toBe(href);
  });

  it("la edad nunca la ve una empresa", () => {
    expect(responder("¿las empresas ven mi edad?").texto).toMatch(/nunca ven su edad/);
  });

  it("si no entiende, lo dice y ofrece la llamada", () => {
    const r = responder("asdf qwer");
    expect(r.tipo).toBe("no_entendi");
    expect(r.texto).toMatch(/llamemos/);
  });
});
