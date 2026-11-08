import { describe, expect, it } from "vitest";

import { separarEtiquetas } from "@/lib/capas";
import { lineasDatos, pdfDatos } from "@/lib/perfil/pdf-datos";

describe("etiquetas escritas en una sola línea", () => {
  it("separa por comas, punto y coma, saltos y puntos", () => {
    expect(separarEtiquetas("cocina, aseo; cuidado de niños\nplanchado. Jardinería")).toEqual([
      "cocina",
      "aseo",
      "cuidado de niños",
      "planchado",
      "Jardinería",
    ]);
  });
  it("no corta por «y» y no repite", () => {
    expect(separarEtiquetas("Corte y confección,  corte y confección , ")).toEqual(["Corte y confección"]);
  });
});

describe("descargar mis datos en PDF", () => {
  const datos = {
    descargado_en: "2026-11-07T15:00:00.000Z",
    cuenta: { celular: "+573001234567", correo: null },
    perfil: { nombre: "Gloria", oficio: "Cuidado de personas", visibilidad: "reservado" },
    huella: [{ capa: "oficio", etiqueta: "Cuidado", confirmada: true }],
    seguimiento_bienestar: [{ connection_id: "abc", energia: "bien" }],
    historias: [],
  };

  it("siempre lleva la nota de protección de datos", () => {
    const textos = lineasDatos(datos).map((l) => l.texto);
    expect(textos).toContain("Cómo cuidamos tus datos");
    expect(textos.some((t) => t.includes("Ley 1581"))).toBe(true);
  });

  it("muestra los datos con nombres claros y sin identificadores internos", () => {
    const textos = lineasDatos(datos).map((l) => l.texto);
    expect(textos).toContain("Nombre: Gloria");
    expect(textos).toContain("Confirmada: Sí");
    expect(textos).toContain("Correo: —");
    expect(textos.join(" ")).not.toMatch(/connection_id|abc/);
    expect(textos).toContain("Sin datos.");
  });

  it("produce un PDF válido aunque haya emojis", async () => {
    const pdf = await pdfDatos({ ...datos, perfil: { nombre: "Gloria 🌻", oficio: "Señora de la cerámica" } });
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
  });
});
