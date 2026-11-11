import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const resolveMx = vi.fn();
vi.mock("node:dns/promises", () => ({ resolveMx: (d: string) => resolveMx(d) }));

import { dominioRecibeCorreo, problemaConElCorreo, sugerenciaCorreo } from "@/lib/auth/dominio";

describe("el correo debe tener un dominio que exista", () => {
  it("propone la corrección de los errores de dedo comunes", () => {
    expect(sugerenciaCorreo("rosa@gamil.com")).toBe("rosa@gmail.com");
    expect(sugerenciaCorreo("rosa@hotmial.com")).toBe("rosa@hotmail.com");
    expect(sugerenciaCorreo("rosa@gmail.com")).toBeNull();
    expect(sugerenciaCorreo("rosa@vasees.co")).toBeNull();
  });

  it("rechaza un dominio que no existe o no recibe correo", async () => {
    resolveMx.mockRejectedValueOnce(Object.assign(new Error("no"), { code: "ENOTFOUND" }));
    expect(await dominioRecibeCorreo("rosa@noexiste-kanna.co")).toBe(false);
    resolveMx.mockResolvedValueOnce([]);
    expect(await dominioRecibeCorreo("rosa@sincorreo.co")).toBe(false);
    resolveMx.mockRejectedValueOnce(Object.assign(new Error("no"), { code: "ENOTFOUND" }));
    expect(await problemaConElCorreo("rosa@tampoco-existe-kanna.co")).toMatch(/No encontramos/);
  });

  it("recuerda la respuesta de un dominio y no vuelve a consultarlo", async () => {
    resolveMx.mockClear();
    expect(await dominioRecibeCorreo("otra@noexiste-kanna.co")).toBe(false);
    expect(resolveMx).not.toHaveBeenCalled();
  });

  it("acepta un dominio real y no deja a nadie por fuera si la red falla", async () => {
    resolveMx.mockResolvedValueOnce([{ exchange: "mx.vasees.co", priority: 10 }]);
    expect(await problemaConElCorreo("rosa@vasees.co")).toBeNull();
    resolveMx.mockRejectedValueOnce(Object.assign(new Error("red"), { code: "ETIMEOUT" }));
    expect(await dominioRecibeCorreo("rosa@red-caida.co")).toBe(true);
  });

  it("el error de dedo se avisa sin consultar la red", async () => {
    resolveMx.mockClear();
    expect(await problemaConElCorreo("rosa@gamil.com")).toMatch(/rosa@gmail.com/);
    expect(resolveMx).not.toHaveBeenCalled();
  });
});
