import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { crearBase } from "./base";

// Ninguna función de trigger se puede llamar desde la API (/rest/v1/rpc), ni sin cuenta ni con ella.

let db: PGlite;

beforeAll(async () => {
  db = await crearBase();
});

describe("funciones de trigger", () => {
  it("anon y authenticated no las pueden ejecutar", async () => {
    const { rows } = await db.query<{ proname: string }>(`
      select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
        and (has_function_privilege('anon', p.oid, 'execute')
          or has_function_privilege('authenticated', p.oid, 'execute'))`);
    expect(rows.map((r) => r.proname)).toEqual([]);
  });
});
