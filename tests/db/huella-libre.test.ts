import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Etiquetas escritas con las palabras de la persona: llegan a las empresas solo cuando el equipo
// las aprueba, y una etiqueta de la lista no se puede disfrazar con otro texto.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let u: Record<"talento" | "empresa" | "curador", string>;
let perfil: string;

const huellaParaEmpresa = async () => {
  const [p] = await como(db, u.empresa, (tx) => filas(tx, "select huella from company_talent_view where id = $1", [perfil]));
  return p.huella as { capa: string; etiqueta: string }[];
};

beforeEach(async () => {
  db = await crearBase();
  u = {
    talento: await crearUsuario(db, "talento"),
    empresa: await crearUsuario(db, "empresa"),
    curador: await crearUsuario(db, "curador"),
  };
  [{ id: perfil }] = (await filas(
    db,
    "insert into talent_profiles (user_id, nombre, ubicacion, estado) values ($1, 'Rosa', 'Pasto', 'publicado') returning id",
    [u.talento],
  )) as { id: string }[];
});

// Inserta como la persona y deja la fila guardada (como() deshace todo al final).
const insertarComoPersona = async (sql: string, params: unknown[]) => {
  await db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [u.talento]);
    await tx.query(sql, params);
  });
};

describe("etiquetas con palabras propias", () => {
  it("no llegan a la empresa hasta que el equipo las aprueba", async () => {
    await insertarComoPersona(
      "insert into footprint_tags (talent_id, capa, etiqueta, confirmada) values ($1, 'oficio', 'Tejido en telar de guanga', true)",
      [perfil],
    );
    expect(await huellaParaEmpresa()).toEqual([]);

    await db.query("update footprint_tags set aprobada_en = now() where talent_id = $1", [perfil]);
    expect(await huellaParaEmpresa()).toEqual([{ capa: "oficio", etiqueta: "Tejido en telar de guanga" }]);
  });

  it("la persona no puede aprobarse sola", async () => {
    await insertarComoPersona(
      "insert into footprint_tags (talent_id, capa, etiqueta, confirmada, aprobada_en) values ($1, 'oficio', 'Escríbame al 3001234567', true, now())",
      [perfil],
    );
    await como(db, u.talento, (tx) => tx.query("update footprint_tags set aprobada_en = now() where talent_id = $1", [perfil]));
    const [t] = await filas(db, "select aprobada_en from footprint_tags where talent_id = $1", [perfil]);
    expect(t.aprobada_en).toBeNull();
    expect(await huellaParaEmpresa()).toEqual([]);
  });

  it("si cambia el texto de una aprobada, vuelve a revisión", async () => {
    await insertarComoPersona(
      "insert into footprint_tags (talent_id, capa, etiqueta, confirmada) values ($1, 'oficio', 'Tejido en telar', true)",
      [perfil],
    );
    await db.query("update footprint_tags set aprobada_en = now() where talent_id = $1", [perfil]);
    await insertarComoPersona("update footprint_tags set etiqueta = 'Tengo 62 años' where talent_id = $1", [perfil]);
    expect(await huellaParaEmpresa()).toEqual([]);
  });

  it("el equipo sí puede aprobar", async () => {
    await insertarComoPersona(
      "insert into footprint_tags (talent_id, capa, etiqueta, confirmada) values ($1, 'contexto', 'Taller en la vereda', true)",
      [perfil],
    );
    await db.transaction(async (tx) => {
      await tx.exec("set local role authenticated");
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [u.curador]);
      await tx.query("update footprint_tags set aprobada_en = now() where talent_id = $1", [perfil]);
    });
    expect(await huellaParaEmpresa()).toEqual([{ capa: "contexto", etiqueta: "Taller en la vereda" }]);
  });

  it("una etiqueta de la lista siempre muestra el texto de la lista", async () => {
    await insertarComoPersona(
      `insert into footprint_tags (talent_id, capa, etiqueta, taxonomy_id, confirmada)
       values ($1, 'situaciones', 'Escríbame al 3001234567', (select id from taxonomy where etiqueta = 'Taller propio'), true)`,
      [perfil],
    );
    expect(await huellaParaEmpresa()).toEqual([{ capa: "contexto", etiqueta: "Taller propio" }]);
  });
});

describe("taxonomía para todos los oficios", () => {
  it("tiene opciones para artesanos e independientes", async () => {
    const r = await filas(
      db,
      "select etiqueta from taxonomy where etiqueta in ('Ebanistería y carpintería', 'Tejido artesanal', 'Por mi cuenta, independiente', 'Trabajo individual')",
    );
    expect(r).toHaveLength(4);
  });
});
