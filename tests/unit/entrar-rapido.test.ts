import { describe, expect, it } from "vitest";

import { borradorVacio, erroresDelPaso, validarPerfil } from "@/lib/perfil/validar";

// «Entrar ya y completar después»: la persona guarda lo mínimo, entra y el inicio le muestra lo que falta.
describe("entrar ya y completar después", () => {
  const minimo = { ...borradorVacio, nombre: "Rosa", ubicacion: "Pasto", oficio: "Cocina", requisito: "edad" as const, autorizo: true };

  it("la autorización se pide en el paso 1", () => {
    expect(erroresDelPaso({ ...minimo, autorizo: false }, 1).autorizo).toBeTruthy();
    expect(erroresDelPaso(minimo, 1)).toEqual({});
  });

  it("con lo mínimo se guarda sin formas de trabajar; sin el botón, no", () => {
    expect(validarPerfil(minimo)).toMatchObject({ ok: false, paso: 2 });
    const r = validarPerfil({ ...minimo, despues: true });
    expect(r.ok && r.perfil.formas).toEqual([]);
    expect(r.ok && r.perfil.visibilidad).toBe("reservado");
  });
});
