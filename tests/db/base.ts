import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite, type Transaction } from "@electric-sql/pglite";

const RAIZ = join(__dirname, "..", "..", "supabase");

// Base de datos en memoria con el stub de Supabase y todas las migraciones, en orden.
export async function crearBase() {
  const db = new PGlite();
  await db.exec(readFileSync(join(RAIZ, "tests", "stub-supabase.sql"), "utf8"));
  const migraciones = readdirSync(join(RAIZ, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const m of migraciones) {
    await db.exec(readFileSync(join(RAIZ, "migrations", m), "utf8"));
  }
  return db;
}

// Crea un usuario de Auth (el trigger le asigna el rol inicial) y, si se pide, le cambia el rol
// como lo haría un admin.
export async function crearUsuario(
  db: PGlite,
  rol: "talento" | "empresa" | "curador" | "gestor" | "admin",
) {
  const id = crypto.randomUUID();
  const meta = rol === "empresa" ? { rol: "empresa" } : {};
  await db.query("insert into auth.users (id, raw_user_meta_data) values ($1, $2)", [id, meta]);
  if (rol !== "talento" && rol !== "empresa") {
    await db.query("update user_roles set rol = $1 where user_id = $2", [rol, id]);
  }
  return id;
}

// Ejecuta como lo haría la API de Supabase: rol "anon" o "authenticated" con el sub del JWT.
// Todo corre en una transacción que se deshace al final, para que las pruebas no se mezclen.
export async function como<T>(
  db: PGlite,
  usuario: string | null,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  let resultado!: T;
  try {
    await db.transaction(async (tx) => {
      await tx.exec(`set local role ${usuario ? "authenticated" : "anon"}`);
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [usuario ?? ""]);
      resultado = await fn(tx);
      throw new Deshacer();
    });
  } catch (e) {
    if (!(e instanceof Deshacer)) throw e;
  }
  return resultado;
}

class Deshacer extends Error {}
