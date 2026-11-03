import { expect, test } from "@playwright/test";

// Recorrido mínimo: la portada abre, se puede pedir ayuda y ningún script se bloquea.
test("la portada carga sin errores y ofrece ayuda", async ({ page }) => {
  const errores: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errores.push(m.text()); });
  page.on("pageerror", (e) => errores.push(e.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /ayuda/i }).first()).toBeVisible();
  expect(errores).toEqual([]);
});
