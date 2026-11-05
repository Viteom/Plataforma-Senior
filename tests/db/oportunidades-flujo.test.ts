import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// El script de datos de prueba que crea una oportunidad en cada etapa debe correr contra el
// esquema actual y pasar todas las reglas de la base (empresa verificada, reto digno, acuerdo revisado).
const SCRIPT = readFileSync(join(__dirname, "..", "..", "supabase", "datos-prueba", "oportunidades-flujo.sql"), "utf8");
const BORRAR = readFileSync(join(__dirname, "..", "..", "supabase", "datos-prueba", "borrar.sql"), "utf8");

describe("datos de prueba: oportunidades del flujo", () => {
  it("crea cinco oportunidades, una por etapa, visibles para la persona; se repite y se borra", async () => {
    const db = await crearBase();
    // El stub de Auth es mínimo: le agregamos las columnas que sí existen en Supabase.
    await db.exec(`alter table auth.users add column instance_id uuid, add column aud text, add column role text,
      add column raw_app_meta_data jsonb, add column created_at timestamptz, add column updated_at timestamptz`);
    const talento = await crearUsuario(db, "talento");
    await db.query("update auth.users set email = 'Persona@Ejemplo.co' where id = $1", [talento]);
    await db.query(
      "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Ana', 'Contabilidad', 'reservado', 'publicado')",
      [talento],
    );

    const script = SCRIPT.replaceAll("CORREO-DE-LA-PERSONA", "persona@ejemplo.co");
    await db.exec(script);
    await db.exec(script); // correrlo dos veces no duplica nada

    const vistas = await como(db, talento, (tx) =>
      tx.query<{ estado: string }>("select estado from talent_opportunities_view order by empresa"),
    );
    expect(vistas.rows.map((r) => r.estado).sort()).toEqual(
      ["acuerdo", "conversacion", "en_curso", "enviada_talento", "visible_empresa"].sort(),
    );

    const acuerdo = await como(db, talento, (tx) =>
      tx.query<{ acuerdo_revisado_en: string | null }>(
        "select acuerdo_revisado_en from talent_opportunities_view where estado = 'acuerdo'",
      ),
    );
    expect(acuerdo.rows[0].acuerdo_revisado_en).not.toBeNull();

    await db.exec(BORRAR);
    const quedan = await db.query<{ n: number }>("select count(*)::int as n from connections");
    expect(quedan.rows[0].n).toBe(0);
  });
});
