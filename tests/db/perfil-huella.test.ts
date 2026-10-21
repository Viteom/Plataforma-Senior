import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Hito 3: evidencias, guía de tarifas, solicitudes de ayuda, requisito de entrada y cuota de IA.

let db: PGlite;
let talento: string, otroTalento: string, empresa: string, curador: string;
let perfil: string;

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

beforeAll(async () => {
  db = await crearBase();
  talento = await crearUsuario(db, "talento");
  otroTalento = await crearUsuario(db, "talento");
  empresa = await crearUsuario(db, "empresa");
  curador = await crearUsuario(db, "curador");
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, visibilidad, estado) values ($1, 'Ana', 'reservado', 'publicado') returning id",
    [talento],
  );
  perfil = p.id as string;
});

describe("requisito de entrada", () => {
  it("se guarda en datos privados, no en el perfil", async () => {
    const priv = await como(db, talento, async (tx) => {
      await filas(tx, "select guardar_datos_privados($1, null, 'v1', 'pantalla', null, 'edad')", [perfil]);
      await tx.exec("reset role");
      return filas(tx, "select requisito_entrada from talent_private where talent_id = $1", [perfil]);
    });
    expect(priv[0].requisito_entrada).toBe("edad");
    const columnasPerfil = await filas(
      db,
      "select column_name from information_schema.columns where table_name = 'talent_profiles'",
    );
    expect(columnasPerfil.map((c) => c.column_name)).not.toContain("requisito_entrada");
  });
});

describe("formas de contratar", () => {
  it("acepta la conversación de una hora y una sola oferta por tipo", async () => {
    const r = await como(db, talento, async (tx) => {
      await filas(tx, "insert into talent_offers (talent_id, tipo, quiere_orientacion) values ($1, 'conversacion', true)", [perfil]);
      return filas(tx, "select tipo from talent_offers where talent_id = $1", [perfil]);
    });
    expect(r).toEqual([{ tipo: "conversacion" }]);
    await expect(
      como(db, talento, async (tx) => {
        await filas(tx, "insert into talent_offers (talent_id, tipo) values ($1, 'horas')", [perfil]);
        return filas(tx, "insert into talent_offers (talent_id, tipo) values ($1, 'horas')", [perfil]);
      }),
    ).rejects.toThrow(/una_oferta_por_tipo/);
  });
});

describe("guía de tarifas", () => {
  it("todos la leen, solo el equipo la escribe", async () => {
    await como(db, curador, (tx) =>
      filas(tx, "insert into rate_guides (tipo, unidad, minimo, maximo, fuente) values ('horas', 'hora', 50000, 120000, 'Prueba')"),
    );
    await expect(
      como(db, talento, (tx) =>
        filas(tx, "insert into rate_guides (tipo, unidad, minimo, maximo, fuente) values ('proyecto', 'proyecto', 1, 2, 'x')"),
      ),
    ).rejects.toThrow(/row-level security/);
    const r = await como(db, null, (tx) => filas(tx, "select * from rate_guides"));
    expect(Array.isArray(r)).toBe(true);
  });
});

describe("evidencias", () => {
  let evidencia: string;

  beforeAll(async () => {
    const [e] = await filas(
      db,
      `insert into evidence (talent_id, tipo, descripcion, referencia_nombre, referencia_telefono)
       values ($1, 'referencia', 'Jefe de planta', 'Carlos Pérez', '3001112233') returning id`,
      [perfil],
    );
    evidencia = e.id as string;
  });

  it("la persona agrega referencias y archivos, pendientes", async () => {
    const r = await como(db, talento, (tx) =>
      filas(tx, "insert into evidence (talent_id, tipo, archivo_path) values ($1, 'archivo', $2) returning estado", [perfil, `${perfil}/foto.jpg`]),
    );
    expect(r[0].estado).toBe("pendiente");
  });

  it("la persona no crea evaluaciones ni evidencias ya verificadas", async () => {
    await expect(
      como(db, talento, (tx) =>
        filas(tx, "insert into evidence (talent_id, tipo, descripcion) values ($1, 'evaluacion', 'Excelente')", [perfil]),
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      como(db, talento, (tx) =>
        filas(tx, "insert into evidence (talent_id, tipo, archivo_path, estado) values ($1, 'archivo', 'x', 'verificada')", [perfil]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("la persona no se verifica sus propias evidencias", async () => {
    await expect(
      como(db, talento, (tx) => filas(tx, "update evidence set estado = 'verificada' where id = $1", [evidencia])),
    ).rejects.toThrow(/solo el equipo verifica/);
  });

  it("otra persona no ve evidencias ajenas", async () => {
    const r = await como(db, otroTalento, (tx) => filas(tx, "select * from evidence"));
    expect(r).toHaveLength(0);
  });

  it("la empresa no lee la tabla; en la vista ve solo verificadas, sin nombre ni teléfono de la referencia", async () => {
    expect(await como(db, empresa, (tx) => filas(tx, "select * from evidence"))).toHaveLength(0);
    expect(await como(db, empresa, (tx) => filas(tx, "select * from company_evidence_view"))).toHaveLength(0);

    await como(db, curador, (tx) =>
      filas(tx, "update evidence set estado = 'verificada', verificada_por = $2, nota_equipo = 'Confirmó que lideró la planta' where id = $1", [evidencia, curador]),
    );
    await db.query("update evidence set estado = 'verificada', verificada_por = $2, nota_equipo = 'Confirmó que lideró la planta' where id = $1", [evidencia, curador]);

    const vista = await como(db, empresa, (tx) => filas(tx, "select * from company_evidence_view"));
    expect(vista).toHaveLength(1);
    expect(vista[0].nota_equipo).toBe("Confirmó que lideró la planta");
    expect(JSON.stringify(vista)).not.toMatch(/Carlos|3001112233/);
  });

  it("si la persona retira la autorización, la empresa deja de verla", async () => {
    const r = await como(db, talento, async (tx) => {
      await filas(tx, "update evidence set autorizada_empresas = false where id = $1", [evidencia]);
      await tx.exec("set local role authenticated");
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [empresa]);
      return filas(tx, "select * from company_evidence_view");
    });
    expect(r).toHaveLength(0);
  });
});

describe("solicitudes de ayuda", () => {
  it("la persona crea la suya y la ve; otra persona no", async () => {
    const propias = await como(db, talento, async (tx) => {
      await filas(tx, "insert into help_requests (user_id, canal, motivo) values ($1, 'orientacion_tarifa', 'No sé cuánto cobrar')", [talento]);
      return filas(tx, "select motivo from help_requests");
    });
    expect(propias).toEqual([{ motivo: "No sé cuánto cobrar" }]);
  });

  it("nadie crea solicitudes a nombre de otra persona", async () => {
    await expect(
      como(db, talento, (tx) =>
        filas(tx, "insert into help_requests (user_id, canal, motivo) values ($1, 'boton', 'x')", [otroTalento]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("cuota de IA", () => {
  it("reserva hasta el tope por persona y luego devuelve null", async () => {
    await db.query("update ia_topes set por_persona = 2 where tarea = 'huella'");
    const usuario = await crearUsuario(db, "talento");
    const ids: (string | null)[] = [];
    for (let i = 0; i < 3; i++) {
      const [r] = await como(db, usuario, (tx) => filas(tx, "select reservar_uso_ia('huella', 'modelo-prueba') as id"));
      // como() deshace la transacción: se repite fuera para que el conteo avance.
      ids.push(r.id as string | null);
    }
    expect(ids.every((x) => x !== null)).toBe(true);

    // Con commit real (sin como): dos reservas y la tercera se niega.
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuario]);
    const reales = [];
    for (let i = 0; i < 3; i++) {
      const [r] = await filas(db, "select reservar_uso_ia('huella', 'modelo-prueba') as id");
      reales.push(r.id);
    }
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    expect(reales[0]).not.toBeNull();
    expect(reales[1]).not.toBeNull();
    expect(reales[2]).toBeNull();
  });

  it("no guarda texto: la tabla solo tiene datos de uso", async () => {
    const r = await filas(db, "select column_name from information_schema.columns where table_name = 'ia_usos'");
    expect(r.map((c) => c.column_name).sort()).toEqual(
      ["creado_en", "id", "modelo", "resultado", "tarea", "terminado_en", "user_id"].sort(),
    );
  });

  it("nadie lee los usos por la API y nadie cierra el uso de otra persona", async () => {
    await expect(como(db, talento, (tx) => filas(tx, "select * from ia_usos"))).rejects.toThrow(/permission denied/);

    const dueño = await crearUsuario(db, "talento");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [dueño]);
    const [{ id }] = await filas(db, "select reservar_uso_ia('chat', 'm') as id");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");

    await como(db, talento, (tx) => filas(tx, "select cerrar_uso_ia($1, 'correcto')", [id]));
    const [uso] = await filas(db, "select resultado from ia_usos where id = $1", [id]);
    expect(uso.resultado).toBe("pendiente");
  });

  it("sin sesión no se puede reservar", async () => {
    await expect(como(db, null, (tx) => filas(tx, "select reservar_uso_ia('huella', 'm')"))).rejects.toThrow(/permission denied/);
  });
});
