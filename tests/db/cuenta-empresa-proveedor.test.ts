import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { crearBase, crearUsuario } from "./base";

// Entrar con Google o Microsoft: la cuenta nace como talento. Solo una cuenta recién creada y sin
// perfil puede pasar a rol de organización; nunca una que ya se usa, ni hacia el equipo.

let db: PGlite;

async function comoConfirmado<T>(usuario: string, fn: (tx: { query: PGlite["query"] }) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [usuario]);
    return fn(tx);
  });
}
const rolDe = async (usuario: string) =>
  (await db.query<{ rol: string }>("select rol from user_roles where user_id = $1", [usuario])).rows[0].rol;
const pasar = (usuario: string) =>
  comoConfirmado(usuario, (tx) => tx.query<{ r: boolean }>("select usar_cuenta_como_empresa() as r")).then((x) => x.rows[0].r);

beforeEach(async () => {
  db = await crearBase();
});

describe("cuenta nueva que entra como organización", () => {
  it("una cuenta recién creada y sin perfil pasa a rol de organización", async () => {
    const nueva = await crearUsuario(db, "talento");
    await db.query("update auth.users set created_at = now() where id = $1", [nueva]);
    expect(await pasar(nueva)).toBe(true);
    expect(await rolDe(nueva)).toBe("empresa");
  });

  it("una cuenta con perfil de talento no cambia", async () => {
    const talento = await crearUsuario(db, "talento");
    await db.query("update auth.users set created_at = now() where id = $1", [talento]);
    await db.query("insert into talent_profiles (user_id, nombre) values ($1, 'Rosa')", [talento]);
    expect(await pasar(talento)).toBe(false);
    expect(await rolDe(talento)).toBe("talento");
  });

  it("una cuenta de hace rato no cambia, y el equipo tampoco", async () => {
    const vieja = await crearUsuario(db, "talento");
    await db.query("update auth.users set created_at = now() - interval '1 hour' where id = $1", [vieja]);
    expect(await pasar(vieja)).toBe(false);
    expect(await rolDe(vieja)).toBe("talento");

    const curador = await crearUsuario(db, "curador");
    await db.query("update auth.users set created_at = now() where id = $1", [curador]);
    expect(await pasar(curador)).toBe(false);
    expect(await rolDe(curador)).toBe("curador");
  });
});
