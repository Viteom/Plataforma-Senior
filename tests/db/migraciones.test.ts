import { describe, expect, it } from "vitest";

import { crearBase } from "./base";

describe("migraciones", () => {
  it("corren completas y dejan RLS activada en todas las tablas", async () => {
    const db = await crearBase();
    const r = await db.query<{ tablename: string; rowsecurity: boolean }>(
      "select tablename, rowsecurity from pg_tables where schemaname = 'public'",
    );
    expect(r.rows.length).toBeGreaterThan(10);
    for (const t of r.rows) expect(t, t.tablename).toMatchObject({ rowsecurity: true });
  });

  it("la taxonomía semilla no tiene etiquetas largas ni que revelen la edad", async () => {
    const db = await crearBase();
    const r = await db.query<{ etiqueta: string; sinonimos: string[] }>("select etiqueta, sinonimos from taxonomy");
    expect(r.rows.length).toBeGreaterThan(50);
    for (const { etiqueta, sinonimos } of r.rows) {
      expect(etiqueta.split(/\s+/).length, etiqueta).toBeLessThanOrEqual(6);
      for (const texto of [etiqueta, ...sinonimos]) {
        expect(texto, texto).not.toMatch(/\baños\b|pension|jubila|\bedad\b|\b(19|20)\d\d\b/i);
      }
    }
  });
});
