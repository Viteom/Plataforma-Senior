import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Privacidad (brief): nunca datos personales en la URL. Un <form> sin acción ni method="post"
// se envía por GET si la persona lo usa antes de que cargue la página, y lo escrito queda en la URL.

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return n.endsWith(".tsx") ? [ruta] : [];
  });
}

const formularios = ["app", "components"].flatMap(archivos).flatMap((ruta) => {
  const texto = readFileSync(ruta, "utf8");
  return [...texto.matchAll(/<form\b/g)].map((m) => ({
    ruta,
    // La etiqueta de apertura puede ocupar varias líneas; basta con revisar su comienzo.
    etiqueta: texto.slice(m.index, m.index + 400),
  }));
});

describe("formularios", () => {
  it("hay formularios para revisar", () => {
    expect(formularios.length).toBeGreaterThan(5);
  });

  // method="get" se acepta solo si está escrito a propósito (por ejemplo, un buscador sin datos
  // personales, como el de Explorar perfiles).
  it.each(formularios)("$ruta declara cómo se envía", ({ etiqueta }) => {
    expect(etiqueta).toMatch(/\baction=\{|method="(post|get)"/);
  });
});
