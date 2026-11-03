import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/vacio.ts", import.meta.url)),
    },
  },
  test: {
    // e2e/ es de Playwright: sus *.spec.ts no corren con Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // PGlite arranca Postgres en memoria: la primera vez tarda unos segundos.
    // Las pruebas que arman la base dentro del test (no en un hook) necesitan el mismo margen,
    // sobre todo si el computador está ocupado con la app local.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
