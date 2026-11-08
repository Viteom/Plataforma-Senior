import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Registro más corto: cédula, país, ciudad de trabajo, sexo y cómo le gusta trabajar quedan en
// talent_private (solo la persona y el equipo). La lista de oficios presenciales la cambia el equipo.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let talento: string;
let otraPersona: string;
let empresa: string;
let perfil: string;

async function comoConfirmado<T>(usuario: string, fn: (tx: { query: PGlite["query"] }) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [usuario]);
    return fn(tx);
  });
}

beforeEach(async () => {
  db = await crearBase();
  talento = await crearUsuario(db, "talento");
  otraPersona = await crearUsuario(db, "talento");
  empresa = await crearUsuario(db, "empresa");
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Rosa', 'Cuidado de personas', 'visible', 'publicado') returning id",
    [talento],
  );
  perfil = p.id as string;
});

describe("datos privados del registro", () => {
  it("la persona los guarda y los ve; la cédula queda sin puntos ni espacios", async () => {
    await comoConfirmado(talento, (tx) =>
      tx.query("select guardar_datos_registro($1, $2, $3, $4, $5, $6)", [
        " 1.023.456-7 ",
        "Colombia",
        "Pasto",
        "mujer",
        "con_silla",
        "cerca",
      ]),
    );
    const [d] = await como(db, talento, (tx) => filas(tx, "select * from mis_datos_registro()"));
    expect(d).toEqual({
      cedula: "10234567",
      pais: "Colombia",
      ciudad_trabajo: "Pasto",
      sexo: "mujer",
      postura: "con_silla",
      movilidad: "cerca",
    });
  });

  it("todo es opcional y rechaza valores raros", async () => {
    await comoConfirmado(talento, (tx) => tx.query("select guardar_datos_registro()"));
    await expect(comoConfirmado(talento, (tx) => tx.query("select guardar_datos_registro('12@34')"))).rejects.toThrow(/cédula/);
    await expect(comoConfirmado(talento, (tx) => tx.query("select guardar_datos_registro(null, null, null, 'x')"))).rejects.toThrow(/sexo/);
    await expect(
      comoConfirmado(talento, (tx) => tx.query("select guardar_datos_registro(null, null, null, null, 'acostada')")),
    ).rejects.toThrow(/postura/);
    await expect(comoConfirmado(otraPersona, (tx) => tx.query("select guardar_datos_registro('123456')"))).rejects.toThrow(/sin permiso/);
  });

  it("ninguna organización ni otra persona los lee", async () => {
    await comoConfirmado(talento, (tx) => tx.query("select guardar_datos_registro('123456', 'Colombia', null, 'mujer')"));
    expect(await como(db, otraPersona, (tx) => filas(tx, "select * from mis_datos_registro()"))).toEqual([]);
    await expect(como(db, empresa, (tx) => tx.query("select cedula from talent_private"))).rejects.toThrow();
    const vista = await como(db, empresa, (tx) => filas(tx, "select * from company_talent_view"));
    expect(JSON.stringify(vista)).not.toMatch(/123456|mujer/);
  });
});

describe("oficios presenciales", () => {
  it("todos leen la lista; solo el equipo agrega y quita", async () => {
    const lista = await como(db, talento, (tx) => filas(tx, "select palabra from oficios_presenciales where palabra = 'cuidad'"));
    expect(lista).toEqual([{ palabra: "cuidad" }]);
    await expect(como(db, talento, (tx) => tx.query("insert into oficios_presenciales (palabra) values ('lavander')"))).rejects.toThrow();

    const curador = await crearUsuario(db, "curador");
    await comoConfirmado(curador, (tx) => tx.query("insert into oficios_presenciales (palabra) values ('lavander')"));
    await expect(comoConfirmado(curador, (tx) => tx.query("insert into oficios_presenciales (palabra) values ('Con Tilde 1')"))).rejects.toThrow();
    const borradas = await comoConfirmado(curador, (tx) => filas(tx, "delete from oficios_presenciales where palabra = 'lavander' returning id"));
    expect(borradas).toHaveLength(1);
    const deTalento = await comoConfirmado(talento, (tx) => filas(tx, "delete from oficios_presenciales where palabra = 'cocin' returning id"));
    expect(deTalento).toEqual([]);
  });
});

describe("mi talento", () => {
  it("la historia guarda aparte lo que le sale bien", async () => {
    await comoConfirmado(talento, (tx) =>
      tx.query("insert into stories (talent_id, texto, origen, talento) values ($1, 'Cuidé a mi mamá diez años', 'escrito', 'Paciencia')", [perfil]),
    );
    const [h] = await como(db, talento, (tx) => filas(tx, "select texto, talento from stories"));
    expect(h).toEqual({ texto: "Cuidé a mi mamá diez años", talento: "Paciencia" });
  });
});
