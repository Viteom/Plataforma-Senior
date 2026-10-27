import { readFile } from "node:fs/promises";
import { it, expect, vi } from "vitest";
const cliente = vi.hoisted(() =>
  vi.fn(() => {
    throw Error("La demostración no debe conectar a Supabase");
  }),
);
const subproceso = vi.hoisted(() => vi.fn());
vi.mock("@/lib/demo", () => ({ MODO_DEMO: true }));
vi.mock("@/lib/supabase/server", () => ({ crearClienteServidor: cliente }));
vi.mock("node:child_process", () => ({ execFile: subproceso }));
import { leerHojaVida } from "@/app/(registro)/perfil/nuevo/importar";

// Sin cuenta ni tope diario, la demostración no abre documentos: devuelve un ejemplo fijo.
it("en demostración no se lee el archivo ni se conecta a la base", async () => {
  const d = new FormData();
  d.set(
    "hoja_vida",
    new File([await readFile("tests/fixtures/hoja-vida-ejemplo.pdf")], "ejemplo.pdf", { type: "application/pdf" }),
  );
  const r = await leerHojaVida(d);
  expect(r.error).toBeUndefined();
  expect(r.demo).toBe(true);
  expect(r.texto).toContain("Cocina de producción");
  expect(cliente).not.toHaveBeenCalled();
  expect(subproceso).not.toHaveBeenCalled();
});

it("en demostración también rechaza tipos y tamaños no permitidos", async () => {
  const d = new FormData();
  d.set("hoja_vida", new File(["hola"], "foto.png", { type: "image/png" }));
  expect((await leerHojaVida(d)).error).toMatch(/PDF o Word/);
});
