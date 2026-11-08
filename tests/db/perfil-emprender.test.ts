import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Perfil de emprender: la ruta, los pasos hechos y los cursos abiertos quedan guardados y solo los
// ve la persona (y el equipo).

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let talento: string;
let otraPersona: string;
let perfil: string;
let curso: string;
let borrador: string;

// «como» deshace todo al final; para guardar de verdad como la persona, se confirma la transacción.
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
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Gloria', 'Cerámica', 'reservado', 'publicado') returning id",
    [talento],
  );
  perfil = p.id as string;
  await filas(db, "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Luis', 'Carpintería', 'reservado', 'publicado')", [otraPersona]);
  const [c] = await filas(db, "insert into courses (titulo, entidad, url, tema, publicado) values ('Precios', 'SENA', 'https://sena.edu.co', 'cobrar', true) returning id");
  curso = c.id as string;
  const [b] = await filas(db, "insert into courses (titulo, entidad, url, tema, publicado) values ('Borrador', 'SENA', 'https://sena.edu.co', 'cobrar', false) returning id");
  borrador = b.id as string;
  await comoConfirmado(talento, (tx) =>
    tx.query(
      "insert into entrepreneurship_diagnostics (talent_id, etapa, necesidades, idea) values ($1, 'idea', '{precios}', 'Cerámica pintada a mano')",
      [perfil],
    ),
  );
});

describe("perfil de emprender", () => {
  it("guarda la idea y marca o desmarca pasos sin repetirlos", async () => {
    await comoConfirmado(talento, (tx) => tx.query("select marcar_paso_emprender('precio', true)"));
    await comoConfirmado(talento, (tx) => tx.query("select marcar_paso_emprender('precio', true)"));
    const [r] = await comoConfirmado(talento, (tx) => filas(tx, "select marcar_paso_emprender('idea-frase', true) as p"));
    expect(r.p).toEqual(["idea-frase", "precio"]);
    const [s] = await comoConfirmado(talento, (tx) => filas(tx, "select marcar_paso_emprender('precio', false) as p"));
    expect(s.p).toEqual(["idea-frase"]);
    const [d] = await como(db, talento, (tx) => filas(tx, "select idea, pasos_hechos from entrepreneurship_diagnostics"));
    expect(d).toEqual({ idea: "Cerámica pintada a mano", pasos_hechos: ["idea-frase"] });
  });

  it("guarda lo que escribe en cada paso; vacío lo borra", async () => {
    await comoConfirmado(talento, (tx) => tx.query("select guardar_respuesta_paso('idea-frase', '  Materas   pintadas a mano ')"));
    await comoConfirmado(talento, (tx) => tx.query("select guardar_respuesta_paso('precio', 'A 40.000')"));
    const [r] = await comoConfirmado(talento, (tx) => filas(tx, "select guardar_respuesta_paso('precio', '  ') as r"));
    expect(r.r).toEqual({ "idea-frase": "Materas pintadas a mano" });
    await expect(
      comoConfirmado(talento, (tx) => tx.query("select guardar_respuesta_paso('precio', $1)", ["x".repeat(301)])),
    ).rejects.toThrow(/muy larga/);
    await expect(comoConfirmado(otraPersona, (tx) => tx.query("select guardar_respuesta_paso('precio', 'hola')"))).rejects.toThrow(/sin ruta/);
  });

  it("no deja marcar pasos con claves raras ni sin ruta", async () => {
    await expect(comoConfirmado(talento, (tx) => tx.query("select marcar_paso_emprender('x; drop', true)"))).rejects.toThrow(/paso no válido/);
    await expect(comoConfirmado(otraPersona, (tx) => tx.query("select marcar_paso_emprender('precio', true)"))).rejects.toThrow(/sin ruta/);
  });

  it("anota los cursos abiertos y cuántas veces, solo de cursos publicados", async () => {
    await comoConfirmado(talento, (tx) => tx.query("select registrar_curso_visto($1)", [curso]));
    await comoConfirmado(talento, (tx) => tx.query("select registrar_curso_visto($1)", [curso]));
    await expect(comoConfirmado(talento, (tx) => tx.query("select registrar_curso_visto($1)", [borrador]))).rejects.toThrow(/no disponible/);
    const vistos = await como(db, talento, (tx) => filas(tx, "select course_id, veces from course_views"));
    expect(vistos).toEqual([{ course_id: curso, veces: 2 }]);
  });

  it("otra persona no ve la ruta ni los cursos, y nadie escribe visitas directo", async () => {
    await comoConfirmado(talento, (tx) => tx.query("select registrar_curso_visto($1)", [curso]));
    expect(await como(db, otraPersona, (tx) => filas(tx, "select * from course_views"))).toEqual([]);
    expect(await como(db, otraPersona, (tx) => filas(tx, "select * from entrepreneurship_diagnostics"))).toEqual([]);
    await expect(
      como(db, otraPersona, (tx) => tx.query("insert into course_views (talent_id, course_id) values ($1, $2)", [perfil, curso])),
    ).rejects.toThrow();
  });
});
