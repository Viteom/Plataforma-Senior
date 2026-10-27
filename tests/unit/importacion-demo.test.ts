import { readFile } from "node:fs/promises";
import { it, expect, vi } from "vitest";
const cliente = vi.hoisted(() =>
  vi.fn(() => {
    throw Error("La demostración no debe conectar a Supabase");
  }),
);
vi.mock("@/lib/demo", () => ({ MODO_DEMO: true }));
vi.mock("@/lib/supabase/server", () => ({ crearClienteServidor: cliente }));
import { leerHojaVida } from "@/app/(registro)/perfil/nuevo/importar";
it("la importación de PDF funciona en demostración sin credenciales ni base de datos", async () => {
  const d = new FormData();
  d.set(
    "hoja_vida",
    new File(
      [await readFile("tests/fixtures/hoja-vida-ejemplo.pdf")],
      "ejemplo.pdf",
      { type: "application/pdf" },
    ),
  );
  const r = await leerHojaVida(d);
  expect(r.error).toBeUndefined();
  expect(r.texto).toContain("cocina y formacion");
  expect(cliente).not.toHaveBeenCalled();
});
