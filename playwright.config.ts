import { defineConfig, devices } from "@playwright/test";

// Pruebas de punta a punta. Viven en e2e/ porque tests/ es de Vitest.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // Solo Chromium por ahora.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    // next dev compila la primera página al pedirla: puede tardar.
    timeout: 120_000,
  },
});
