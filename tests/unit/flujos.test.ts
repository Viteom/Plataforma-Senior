import { describe, expect, it } from "vitest";

import { FLUJOS, MENU, motivoParaEquipo, resultado, resumen, textoRespuesta, validar } from "@/lib/ayuda/flujos";

// Chat guiado: una pregunta a la vez, confirmando cada respuesta, sin pedir datos sensibles.

describe("chat guiado", () => {
  it("el menú ofrece los cuatro temas y cada flujo pregunta de a una cosa", () => {
    expect(MENU).toEqual(["codigo", "llamada", "estafa", "historia"]);
    for (const id of MENU) {
      const f = FLUJOS[id];
      expect(f.pasos.length).toBeGreaterThan(0);
      for (const p of f.pasos) expect(p.pregunta.match(/\?/g)?.length ?? 0).toBeLessThanOrEqual(1);
    }
  });

  it("nunca pide nombre, documento, fecha de nacimiento ni datos del banco", () => {
    const preguntas = MENU.flatMap((id) => FLUJOS[id].pasos.map((p) => p.pregunta)).join(" ");
    expect(preguntas).not.toMatch(/nombre|c[eé]dula|documento|nacimiento|edad|cuenta bancaria|contrase/i);
  });

  it("valida el celular y lo repite enmascarado", () => {
    const celular = FLUJOS.llamada.pasos[0];
    expect(validar(celular, "123")).toMatch(/10 números/);
    expect(validar(celular, "300 123 4567")).toBeNull();
    expect(textoRespuesta(celular, "3001234567")).toBe("300 *** 4567");
  });

  it("las opciones solo aceptan valores de la lista", () => {
    const franja = FLUJOS.llamada.pasos[1];
    expect(validar(franja, "noche")).toMatch(/opciones/);
    expect(validar(franja, "tarde")).toBeNull();
    expect(textoRespuesta(franja, "tarde")).toBe("En la tarde (2 a 6)");
  });

  it("el detalle de una estafa es opcional y no deja escribir cuentas ni teléfonos", () => {
    const detalle = FLUJOS.estafa.pasos[2];
    expect(validar(detalle, "")).toBeNull();
    expect(validar(detalle, "me pidieron consignar a la cuenta 123456789")).toMatch(/números de cuenta/);
    expect(validar(detalle, "Me pidieron plata para un examen médico")).toBeNull();
  });

  it("antes de enviar muestra un resumen con todas las respuestas", () => {
    const r = { celular: "3001234567", franja: "manana", tema: "Una oportunidad" };
    expect(resumen(FLUJOS.llamada, r)).toEqual([
      "A qué celular te llamamos: 300 *** 4567",
      "A qué hora te queda bien: En la mañana (8 a 12)",
      "Sobre qué quieres hablar: Una oportunidad",
    ]);
  });

  it("si ya entregó algo en una estafa, indica la línea 123 y el banco", () => {
    expect(resultado(FLUJOS.estafa, { que: "Me pidieron dinero", pago: "si" }).texto).toMatch(/123.*banco/);
    expect(resultado(FLUJOS.estafa, { que: "Me pidieron dinero", pago: "no" }).texto).toMatch(/No pagues/);
  });

  it("el código por correo lleva a revisar spam; si ya lo intentó todo, ofrece la llamada", () => {
    expect(resultado(FLUJOS.codigo, { medio: "correo", espero: "si" }).texto).toMatch(/spam/);
    expect(resultado(FLUJOS.codigo, { medio: "sms", espero: "si" }).ofrecer).toBe("llamada");
  });

  it("lo que recibe el equipo no lleva el celular", () => {
    const motivo = motivoParaEquipo(FLUJOS.llamada, { celular: "3001234567", franja: "tarde", tema: "Mi perfil o mi historia" });
    expect(motivo).not.toMatch(/300|4567/);
    expect(motivo).toMatch(/Mi perfil/);
  });
});
