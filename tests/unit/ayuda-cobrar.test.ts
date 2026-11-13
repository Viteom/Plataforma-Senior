import { describe, expect, it, vi } from "vitest";

import { FLUJOS, MENU, resultado, validar, valorHora } from "@/lib/ayuda/flujos";
import { baseDeConocimiento, responder } from "@/lib/ayuda/respuestas";

// Guía «Cuánto debo cobrar» del chat de ayuda, y lo que la IA puede y no puede hacer.

describe("guía de cuánto cobrar", () => {
  it("está en el menú y son dos preguntas con opciones", () => {
    expect(MENU).toContain("cobrar");
    expect(FLUJOS.cobrar.pasos.map((p) => p.tipo)).toEqual(["opciones", "opciones"]);
    expect(validar(FLUJOS.cobrar.pasos[0], "2000000")).toBeNull();
    expect(validar(FLUJOS.cobrar.pasos[1], "99")).toBeTruthy();
  });

  it("calcula el valor de la hora, redondeado a mil pesos", () => {
    expect(valorHora(2_000_000, 20)).toBe(23_000);
    expect(valorHora(1_000_000, 10)).toBe(23_000);
    expect(valorHora(3_000_000, 40)).toBe(17_000);
  });

  it("explica el resultado, lleva a Mi perfil y ofrece la llamada", () => {
    const r = resultado(FLUJOS.cobrar, { mensual: "2000000", horas: "20" });
    expect(r.texto).toMatch(/20 horas a la semana/);
    expect(r.texto).toMatch(/23\.000/);
    expect(r.texto).toMatch(/pago justo/);
    expect(r.enlace?.href).toBe("/mi-perfil");
    expect(r.ofrecer).toBe("llamada");
  });

  it("quien escribe «cuánto cobro» recibe el camino a la guía", () => {
    const r = responder("no sé cuánto cobrar");
    expect(r.tipo).toBe("respuesta");
    expect(r.texto).toMatch(/Cuánto debo cobrar/);
  });
});

describe("IA del chat de ayuda", () => {
  it("la base de conocimiento no trae datos de personas ni temas de riesgo", () => {
    const base = baseDeConocimiento();
    expect(base.length).toBeGreaterThan(500);
    expect(base).not.toMatch(/\d{7,}|@/);
  });

  it("apagada (por defecto) no responde ni consulta nada", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    const crearCliente = vi.fn();
    vi.doMock("@/lib/supabase/server", () => ({ crearClienteServidor: crearCliente }));
    vi.doMock("@/lib/demo", () => ({ MODO_DEMO: false }));
    vi.stubEnv("IA_PROVEEDOR", "apagado");
    const { responderConIA } = await import("@/app/ayuda/chat-acciones");
    expect(await responderConIA([{ de: "persona", texto: "¿Cómo cambio mi foto?" }])).toBeNull();
    expect(crearCliente).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
