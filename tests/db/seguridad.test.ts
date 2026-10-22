import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Revisión de seguridad (docs/revision-seguridad.md). Cada prueba describe lo que DEBERÍA pasar:
// mientras el hallazgo no se arregle, la prueba falla. Al corregirlo, debe quedar en verde.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let u: Record<"talento" | "empresa" | "curador", string>;
let perfil: string, empresa: string;

beforeEach(async () => {
  db = await crearBase();
  u = {
    talento: await crearUsuario(db, "talento"),
    empresa: await crearUsuario(db, "empresa"),
    curador: await crearUsuario(db, "curador"),
  };
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Ana', 'Producción de alimentos', 'reservado', 'publicado') returning id",
    [u.talento],
  );
  perfil = p.id as string;
  const [c] = await filas(
    db,
    "insert into companies (owner_id, nombre, nit, verificada_en, verificada_fuente) values ($1, 'Alimentos SAS', '900123456', now(), 'RUES') returning id",
    [u.empresa],
  );
  empresa = c.id as string;
});

describe("A1 · una empresa verificada no cambia su identidad sin que el equipo la revise", () => {
  it("no puede cambiarse el nombre y quedar con el sello de verificada", async () => {
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "update companies set nombre = 'Ecopetrol' where id = $1 returning nombre", [empresa])),
    ).rejects.toThrow();
  });

  it("no puede cambiar el NIT que el equipo verificó en el RUES", async () => {
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "update companies set nit = '899999068' where id = $1 returning nit", [empresa])),
    ).rejects.toThrow();
  });
});

describe("A2 · lo que el equipo verificó no lo cambia la persona", () => {
  async function evidenciaVerificada(tipo: "referencia" | "archivo" | "evaluacion", descripcion: string) {
    const [e] = await filas(
      db,
      `insert into evidence (talent_id, tipo, descripcion, referencia_nombre, referencia_telefono, archivo_path, estado, nota_equipo, verificada_por)
       values ($1, $2, $3, 'Luis', '3001234567', $5, 'verificada', 'Confirmado por teléfono', $4) returning id`,
      [perfil, tipo, descripcion, u.curador, `${perfil}/certificado.pdf`],
    );
    return e.id as string;
  }

  it("no edita la descripción de una evidencia ya verificada", async () => {
    const id = await evidenciaVerificada("archivo", "Certificado del curso de manipulación de alimentos");
    await expect(
      como(db, u.talento, (tx) => filas(tx, "update evidence set descripcion = 'Gerente general de Nestlé' where id = $1 returning descripcion", [id])),
    ).rejects.toThrow();
  });

  it("no cambia el archivo de una evidencia ya verificada", async () => {
    const id = await evidenciaVerificada("archivo", "Certificado");
    await expect(
      como(db, u.talento, (tx) => filas(tx, "update evidence set archivo_path = $2 where id = $1 returning archivo_path", [id, `${perfil}/otro.pdf`])),
    ).rejects.toThrow();
  });

  it("no convierte un «1 de 5» de una empresa en un «5 de 5»", async () => {
    const id = await evidenciaVerificada("evaluacion", "Evaluación de una empresa: 1 de 5");
    await expect(
      como(db, u.talento, (tx) =>
        filas(tx, "update evidence set descripcion = 'Evaluación de una empresa: 5 de 5' where id = $1 returning descripcion", [id]),
      ),
    ).rejects.toThrow();
  });

  it("no borra la evaluación que le dejó una empresa", async () => {
    const id = await evidenciaVerificada("evaluacion", "Evaluación de una empresa: 1 de 5");
    const borradas = await como(db, u.talento, (tx) => filas(tx, "delete from evidence where id = $1 returning id", [id]));
    expect(borradas).toHaveLength(0);
  });
});

describe("A3 · «Llámeme» sin cuenta no sirve para llenar la base", () => {
  it("rechaza un motivo gigante", async () => {
    const motivo = "x".repeat(100_000);
    await expect(
      como(db, null, (tx) => filas(tx, "select pedir_llamada('3001234567', 'manana', $1)", [motivo])),
    ).rejects.toThrow();
  });

  it("no acepta 50 pedidos seguidos con números distintos", async () => {
    const intentar = como(db, null, async (tx) => {
      for (let i = 0; i < 50; i++) {
        await filas(tx, "select pedir_llamada($1, 'manana', null)", [`300${String(i).padStart(7, "0")}`]);
      }
    });
    await expect(intentar).rejects.toThrow();
  });
});

describe("M3 · las etiquetas nuevas pasan por el equipo antes de llegar a una empresa", () => {
  it("una etiqueta fuera de la taxonomía no aparece en la vista de empresas", async () => {
    // Con commit real: como() deshace todo y la empresa no vería la etiqueta.
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [u.talento]);
    try {
      await filas(
        db,
        "insert into footprint_tags (talent_id, capa, etiqueta, confirmada) values ($1, 'oficio', 'Escríbame al 3001234567', true)",
        [perfil],
      );
    } finally {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
    const [fila] = await como(db, u.empresa, (tx) => filas(tx, "select huella from company_talent_view where id = $1", [perfil]));
    expect(JSON.stringify(fila.huella)).not.toContain("3001234567");
  });
});
