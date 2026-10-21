import { describe, expect, it } from "vitest";

import { decidirEnvios, diaColombia, horaColombia, necesitanSeguimiento, textoOportunidad } from "@/lib/avisos/programar";

// 10 a. m. en Colombia = 15:00 UTC.
const enHorario = new Date("2026-10-21T15:00:00Z");
const deNoche = new Date("2026-10-22T02:00:00Z"); // 9 p. m. del 21 en Colombia

const pendiente = (id: string, userId: string | null) => ({ id, userId, creadoEn: enHorario });

describe("avisos por SMS", () => {
  it("calcula la hora y el día de Colombia (UTC-5)", () => {
    expect(horaColombia(enHorario)).toBe(10);
    expect(horaColombia(deNoche)).toBe(21);
    expect(diaColombia(deNoche)).toBe("2026-10-21");
  });

  it("el texto no lleva el nombre de la empresa y recuerda que nadie pide dinero", () => {
    const t = textoOportunidad("https://ejemplo.co/o");
    expect(t).toContain("Nadie le va a pedir dinero");
    expect(t).not.toMatch(/SAS|Ltda|empresa \w+/);
    expect(t.length).toBeLessThanOrEqual(160);
  });

  it("solo envía entre 8 a. m. y 7 p. m.", () => {
    expect(decidirEnvios([pendiente("a", "u1")], deNoche, new Set(), "x").esperar).toEqual(["a"]);
    expect(decidirEnvios([pendiente("a", "u1")], enHorario, new Set(), "x").enviar).toHaveLength(1);
  });

  it("máximo un SMS al día por persona, y agrupa varias oportunidades en uno", () => {
    const d = decidirEnvios([pendiente("a", "u1"), pendiente("b", "u1"), pendiente("c", "u2")], enHorario, new Set(["u2"]), "x");
    expect(d.enviar).toEqual([{ userId: "u1", ids: ["a", "b"], texto: expect.any(String) }]);
    expect(d.esperar).toEqual(["c"]);
  });

  it("sin cuenta propia no hay SMS: se omite para que el equipo llame", () => {
    const d = decidirEnvios([pendiente("a", null)], enHorario, new Set(), "x");
    expect(d.omitir).toEqual([{ id: "a", motivo: expect.stringMatching(/llamarla/) }]);
  });

  it("sin respuesta en 3 días, pide seguimiento una sola vez", () => {
    const ahora = new Date("2026-10-24T15:00:00Z");
    const conexiones = [
      { id: "vieja", enviadaEn: new Date("2026-10-21T14:00:00Z"), conSeguimiento: false },
      { id: "nueva", enviadaEn: new Date("2026-10-23T14:00:00Z"), conSeguimiento: false },
      { id: "ya", enviadaEn: new Date("2026-10-20T14:00:00Z"), conSeguimiento: true },
    ];
    expect(necesitanSeguimiento(conexiones, ahora).map((c) => c.id)).toEqual(["vieja"]);
  });
});
