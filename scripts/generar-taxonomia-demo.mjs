// Genera lib/taxonomia-demo.ts a partir de las migraciones que siembran la taxonomía, para que la
// demostración ofrezca las mismas opciones que la base real. Uso: node scripts/generar-taxonomia-demo.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ARCHIVOS = [
  "supabase/migrations/20261022000002_taxonomia_semilla.sql",
  "supabase/migrations/20261025000002_huella_inclusiva.sql",
];

// ('capa', 'etiqueta', '{"sinónimo uno","sinónimo dos"}', sector)
const FILA = /\('(\w+)',\s*'((?:[^']|'')+)',\s*'\{([^}]*)\}'/g;

const vistas = new Set();
const filas = [];
for (const archivo of ARCHIVOS) {
  const sql = readFileSync(archivo, "utf8");
  for (const [, capa, etiquetaSql, sinonimosSql] of sql.matchAll(FILA)) {
    const etiqueta = etiquetaSql.replace(/''/g, "'");
    const clave = `${capa}|${etiqueta}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    const sinonimos = [...sinonimosSql.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    filas.push({ capa, etiqueta, sinonimos });
  }
}

const id = (i) => `00000000-0000-4000-9000-${String(i + 1).padStart(12, "0")}`;
const cuerpo = filas
  .map((f, i) => `  { id: "${id(i)}", capa: "${f.capa}", etiqueta: ${JSON.stringify(f.etiqueta)}, sinonimos: ${JSON.stringify(f.sinonimos)} },`)
  .join("\n");

writeFileSync(
  "lib/taxonomia-demo.ts",
  `// Generado por scripts/generar-taxonomia-demo.mjs desde las migraciones de la taxonomía. No editar a mano.
import type { EntradaTaxonomia } from "@/lib/ia/huella";

export const taxonomiaDemo: EntradaTaxonomia[] = [
${cuerpo}
];
`,
);
console.log(`${filas.length} etiquetas`);
