import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Pensión o subsidio: solo la persona lo guarda y lo ve; sirve para avisarle antes de aceptar un
// acuerdo. Ninguna organización puede leerlo.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let talento: string;
let otraPersona: string;
let empresa: string;
let perfil: string;
let organizacion: string;

async function acuerdo(valor: number, unidad: string, horas: number | null, estado = "acuerdo", org = organizacion) {
  const [c] = await filas(
    db,
    `insert into connections (company_id, talent_id, origen, estado, acuerdo_forma, acuerdo_valor, acuerdo_unidad,
       acuerdo_horas_semana, acuerdo_version, acuerdo_revisado_version, acuerdo_revisado_en, acuerdo_revision_automatica)
     values ($1, $2, 'exploracion', $3, 'horas', $4, $5, $6, 1, 1, now(), true) returning id`,
    [org, perfil, estado, valor, unidad, horas],
  );
  return c.id as string;
}

// «como» deshace todo al final; para guardar de verdad como la persona, se confirma la transacción.
async function guardar(usuario: string, situacion: string, hogar: string | null = null) {
  await db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [usuario]);
    await tx.query("select guardar_situacion_ingresos($1, $2)", [situacion, hogar]);
  });
}

const avisos = (conexion: string, usuario = talento) =>
  como(db, usuario, (tx) => filas(tx, "select avisos_ingresos($1) as a", [conexion])).then(
    (r) => r[0].a as Record<string, unknown>[],
  );

beforeEach(async () => {
  db = await crearBase();
  talento = await crearUsuario(db, "talento");
  otraPersona = await crearUsuario(db, "talento");
  empresa = await crearUsuario(db, "empresa");
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Ana', 'Cocina', 'reservado', 'publicado') returning id",
    [talento],
  );
  perfil = p.id as string;
  await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Luis', 'Carpintería', 'reservado', 'publicado')",
    [otraPersona],
  );
  const [o] = await filas(
    db,
    "insert into companies (owner_id, nombre, nit, verificada_en, verificada_fuente, naturaleza) values ($1, 'Org', '900123456', now(), 'RUES', 'privada') returning id",
    [empresa],
  );
  organizacion = o.id as string;
});

describe("situación de ingresos", () => {
  it("la persona la guarda y la ve; otra persona y la organización no", async () => {
    await guardar(talento, "colombia_mayor", "familia");
    const propia = await como(db, talento, (tx) => filas(tx, "select * from mi_situacion_ingresos()"));
    expect(propia).toEqual([{ situacion: "colombia_mayor", hogar: "familia" }]);

    expect(await como(db, otraPersona, (tx) => filas(tx, "select * from mi_situacion_ingresos()"))).toEqual([]);
    expect(await como(db, empresa, (tx) => filas(tx, "select * from mi_situacion_ingresos()"))).toEqual([]);
    await expect(como(db, empresa, (tx) => filas(tx, "select * from talent_private"))).rejects.toThrow(/permission/);
  });

  it("rechaza valores que no conoce y guarda el hogar solo con Colombia Mayor", async () => {
    await expect(
      como(db, talento, (tx) => filas(tx, "select guardar_situacion_ingresos('jubilado')")),
    ).rejects.toThrow(/no válida/);
    await guardar(talento, "vejez_invalidez", "sola");
    const [fila] = await filas(db, "select pension, hogar from talent_private where talent_id = $1", [perfil]);
    expect(fila).toEqual({ pension: "vejez_invalidez", hogar: null });
  });

  it("una organización no puede guardar ni pedir avisos de una persona", async () => {
    const c = await acuerdo(40000, "hora", 10);
    await expect(avisos(c, empresa)).rejects.toThrow(/sin permiso/);
    await expect(
      como(db, empresa, (tx) => filas(tx, "select guardar_situacion_ingresos('ninguno')")),
    ).rejects.toThrow(/sin permiso/);
  });

  it("sin situación, o si prefiere no decirla, no hay avisos", async () => {
    const c = await acuerdo(40000, "hora", 10);
    expect(await avisos(c)).toEqual([]);
    await guardar(talento, "no_dice");
    expect(await avisos(c)).toEqual([]);
  });

  it("Colombia Mayor: suma lo que tiene en curso y compara con el tope de su hogar", async () => {
    await guardar(talento, "colombia_mayor", "sola");
    await db.query("update parametros_trabajo_digno set valor = 1400000 where clave = 'salario_minimo_mensual'");
    const otroDueno = await crearUsuario(db, "empresa");
    const [otra] = await filas(
      db,
      "insert into companies (owner_id, nombre, nit, verificada_en, verificada_fuente) values ($1, 'Otra', '900654321', now(), 'RUES') returning id",
      [otroDueno],
    );
    await acuerdo(300000, "mes", 10, "en_curso", otra.id as string);
    const c = await acuerdo(500000, "mes", 10);
    const [a] = await avisos(c);
    expect(a).toMatchObject({ codigo: "colombia_mayor", mensual: 500000, total: 800000, tope: 700000, supera: true });

    await guardar(talento, "colombia_mayor", "familia");
    const [b] = await avisos(c);
    expect(b).toMatchObject({ tope: 1400000, supera: false });
  });

  it("con pensión: avisa de los aportes y, si la organización es pública, del contrato", async () => {
    await guardar(talento, "vejez_invalidez");
    const c = await acuerdo(40000, "hora", 10);
    expect((await avisos(c)).map((a) => a.codigo)).toEqual(["aportes"]);
    await db.query("update companies set naturaleza = 'publica' where id = $1", [organizacion]);
    expect((await avisos(c)).map((a) => a.codigo)).toEqual(["entidad_publica", "aportes"]);
  });
});
