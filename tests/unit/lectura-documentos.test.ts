import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { it, expect } from "vitest";
const ejecutar = promisify(execFile);
it.each(["pdf", "docx"])(
  "extrae texto real de un archivo %s sin devolver HTML ni ejecutar el documento",
  async (extension) => {
    const { stdout } = await ejecutar(
      process.execPath,
      [
        "--max-old-space-size=192",
        "scripts/leer-hoja-vida.mjs",
        `tests/fixtures/hoja-vida-ejemplo.${extension}`,
        extension,
      ],
      { encoding: "utf8", timeout: 15000, maxBuffer: 256 * 1024 },
    );
    const r = JSON.parse(stdout);
    expect(r.texto).toContain("cocina y formacion");
    expect(r.texto).not.toContain("<w:");
  },
);
it("rechaza contenido que no corresponde al formato declarado", async () => {
  await expect(
    ejecutar(
      process.execPath,
      [
        "scripts/leer-hoja-vida.mjs",
        "tests/fixtures/hoja-vida-ejemplo.docx",
        "pdf",
      ],
      { timeout: 15000 },
    ),
  ).rejects.toThrow();
});
