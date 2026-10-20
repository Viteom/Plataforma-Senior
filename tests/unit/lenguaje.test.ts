import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Regla 2 y 5 del CLAUDE.md: palabras que no pueden aparecer en la interfaz.
const PROHIBIDAS = [/adulto[s]? mayor(es)?/i, /tercera edad/i, /\babuel[oa]s?\b/i, /\bvacantes?\b/i];
const CARPETAS = ["app", "components", "lib"];

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.(tsx?|mdx?)$/.test(n) ? [ruta] : [];
  });
}

describe("lenguaje de la interfaz", () => {
  const rutas = CARPETAS.flatMap(archivos);

  it("encuentra archivos para revisar", () => {
    expect(rutas.length).toBeGreaterThan(10);
  });

  it.each(rutas)("%s no usa palabras prohibidas", (ruta) => {
    const texto = readFileSync(ruta, "utf8");
    for (const patron of PROHIBIDAS) {
      expect(texto, `"${patron}" en ${ruta}`).not.toMatch(patron);
    }
  });
});
