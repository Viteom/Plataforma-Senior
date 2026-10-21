import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Hito 2, criterio de listo: "una empresa no puede leer datos de talento".
// Corre las migraciones reales contra Postgres en memoria con roles como los de Supabase.

let db: PGlite;
const u = {} as Record<"talento" | "otroTalento" | "empresa" | "curador" | "gestor" | "otroGestor" | "admin", string>;
const perfil = {} as Record<"reservado" | "visible" | "borrador" | "delGestor", string>;

beforeAll(async () => {
  db = await crearBase();
  u.talento = await crearUsuario(db, "talento");
  u.otroTalento = await crearUsuario(db, "talento");
  u.empresa = await crearUsuario(db, "empresa");
  u.curador = await crearUsuario(db, "curador");
  u.gestor = await crearUsuario(db, "gestor");
  u.otroGestor = await crearUsuario(db, "gestor");
  u.admin = await crearUsuario(db, "admin");

  const crear = async (userId: string | null, nombre: string, visibilidad: string, estado: string, por: string | null = null) => {
    const r = await db.query<{ id: string }>(
      `insert into talent_profiles (user_id, nombre, ubicacion, resumen, visibilidad, foto_path, estado, registrado_por)
       values ($1, $2, 'Medellín', 'Resumen de ' || $2, $3, 'fotos/' || $2 || '.jpg', $4, $5) returning id`,
      [userId, nombre, visibilidad, estado, por],
    );
    return r.rows[0].id;
  };
  perfil.reservado = await crear(u.talento, "Ana Reservada", "reservado", "publicado");
  perfil.visible = await crear(u.otroTalento, "Gloria Visible", "visible", "publicado");
  perfil.borrador = await crear(null, "Sin publicar", "visible", "borrador");
  perfil.delGestor = await crear(null, "Registrada en campo", "reservado", "borrador", u.gestor);

  await db.query(
    `insert into talent_private (talent_id, fecha_nacimiento, autorizacion_version, autorizacion_medio)
     values ($1, '1962-03-14', 'v1', 'pantalla')`,
    [perfil.reservado],
  );
  await db.query(
    `insert into footprint_tags (talent_id, capa, etiqueta, confirmada) values
       ($1, 'normas', 'INVIMA', true), ($1, 'situaciones', 'Sin confirmar', false)`,
    [perfil.reservado],
  );
  await db.query(`insert into talent_offers (talent_id, tipo, horas_semana, modalidad, tarifa_esperada) values ($1, 'proyecto', 15, 'presencial', 90000)`, [perfil.reservado]);
  await db.query(`insert into stories (talent_id, texto, origen) values ($1, 'Abrí una planta en 1998', 'escrito')`, [perfil.reservado]);
});

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

describe("rol inicial al registrarse", () => {
  it("asigna talento por defecto y empresa si se pidió", async () => {
    const roles = await db.query<{ user_id: string; rol: string }>("select user_id, rol from user_roles");
    const rolDe = (id: string) => roles.rows.find((r) => r.user_id === id)?.rol;
    expect(rolDe(u.talento)).toBe("talento");
    expect(rolDe(u.empresa)).toBe("empresa");
  });

  it("no deja pedir un rol del equipo al registrarse", async () => {
    const id = crypto.randomUUID();
    await db.query("insert into auth.users (id, raw_user_meta_data) values ($1, $2)", [id, { rol: "admin" }]);
    const r = await db.query<{ rol: string }>("select rol from user_roles where user_id = $1", [id]);
    expect(r.rows[0].rol).toBe("talento");
  });

  it("nadie se cambia el rol a sí mismo", async () => {
    const cambiadas = await como(db, u.talento, async (tx) => {
      const r = await tx.query("update user_roles set rol = 'admin' where user_id = $1", [u.talento]);
      return r.affectedRows;
    });
    expect(cambiadas).toBe(0);
  });
});

describe("una empresa no lee datos de talento", () => {
  it.each(["talent_profiles", "talent_offers", "stories", "footprint_tags"])("%s: cero filas", async (tabla) => {
    const r = await como(db, u.empresa, (tx) => filas(tx, `select * from ${tabla}`));
    expect(r).toHaveLength(0);
  });

  it("talent_private: sin permiso", async () => {
    await expect(como(db, u.empresa, (tx) => filas(tx, "select * from talent_private"))).rejects.toThrow(/permission denied/);
  });

  it("no puede usar la función del equipo para ver la fecha de nacimiento", async () => {
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "select * from ver_datos_privados($1, 'curiosidad')", [perfil.reservado])),
    ).rejects.toThrow(/sin permiso/);
  });

  it("no puede guardar datos privados de otra persona", async () => {
    await expect(
      como(db, u.empresa, (tx) =>
        filas(tx, "select guardar_datos_privados($1, '1990-01-01', 'v1', 'pantalla')", [perfil.reservado]),
      ),
    ).rejects.toThrow(/sin permiso/);
  });
});

describe("vista anónima para empresas", () => {
  const COLUMNAS_PROHIBIDAS = /nacimiento|edad|birth|pension|graduaci|tarifa/i;

  it("no tiene columnas de edad, pensión ni tarifa exacta", async () => {
    const r = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_name = 'company_talent_view'",
    );
    const columnas = r.rows.map((c) => c.column_name);
    expect(columnas.length).toBeGreaterThan(3);
    for (const c of columnas) expect(c).not.toMatch(COLUMNAS_PROHIBIDAS);
  });

  it("muestra solo perfiles publicados, sin nombre ni foto si son reservados", async () => {
    const r = await como(db, u.empresa, (tx) => filas(tx, "select * from company_talent_view order by visibilidad"));
    expect(r).toHaveLength(2);
    const reservado = r.find((p) => p.id === perfil.reservado)!;
    expect(reservado.nombre).toBeNull();
    expect(reservado.foto_path).toBeNull();
    expect(reservado.resumen).toBeNull();
    const visible = r.find((p) => p.id === perfil.visible)!;
    expect(visible.nombre).toBe("Gloria Visible");
  });

  it("muestra solo etiquetas confirmadas y las ofertas sin tarifa", async () => {
    const [p] = await como(db, u.empresa, (tx) =>
      filas(tx, "select huella, ofertas from company_talent_view where id = $1", [perfil.reservado]),
    );
    expect(p.huella).toEqual([{ capa: "normas", etiqueta: "INVIMA" }]);
    expect(JSON.stringify(p.ofertas)).not.toMatch(/tarifa|90000/);
  });

  it("nunca filtra la fecha de nacimiento", async () => {
    const r = await como(db, u.empresa, (tx) => filas(tx, "select * from company_talent_view"));
    expect(JSON.stringify(r)).not.toMatch(/1962/);
  });

  it("el talento no la usa para ver a otras personas", async () => {
    const r = await como(db, u.talento, (tx) => filas(tx, "select * from company_talent_view"));
    expect(r).toHaveLength(0);
  });

  it("sin sesión no hay acceso", async () => {
    await expect(como(db, null, (tx) => filas(tx, "select * from company_talent_view"))).rejects.toThrow(/permission denied/);
  });
});

describe("talento y gestor", () => {
  it("el talento ve solo su perfil", async () => {
    const r = await como(db, u.talento, (tx) => filas(tx, "select id from talent_profiles"));
    expect(r.map((p) => p.id)).toEqual([perfil.reservado]);
  });

  it("el talento lee su historia, no la de otros", async () => {
    const propias = await como(db, u.talento, (tx) => filas(tx, "select * from stories"));
    const ajenas = await como(db, u.otroTalento, (tx) => filas(tx, "select * from stories"));
    expect(propias).toHaveLength(1);
    expect(ajenas).toHaveLength(0);
  });

  it("el talento no lee su propia fecha de nacimiento por la API, pero sí la guarda", async () => {
    await expect(como(db, u.talento, (tx) => filas(tx, "select * from talent_private"))).rejects.toThrow(/permission denied/);
    await como(db, u.talento, (tx) =>
      filas(tx, "select guardar_datos_privados($1, '1962-03-14', 'v2', 'pantalla')", [perfil.reservado]),
    );
  });

  it("el talento no crea un perfil a nombre de otra persona", async () => {
    await expect(
      como(db, u.talento, (tx) =>
        filas(tx, "insert into talent_profiles (user_id, nombre) values ($1, 'Suplantada')", [u.otroTalento]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("el talento crea su perfil y lo ve de inmediato (insert ... returning)", async () => {
    const nuevo = await crearUsuario(db, "talento");
    const r = await como(db, nuevo, (tx) =>
      filas(tx, "insert into talent_profiles (user_id, nombre) values ($1, 'Nueva') returning id", [nuevo]),
    );
    expect(r).toHaveLength(1);
  });

  it("el gestor ve lo que registró y no lo de otro gestor", async () => {
    const propio = await como(db, u.gestor, (tx) => filas(tx, "select id from talent_profiles"));
    const ajeno = await como(db, u.otroGestor, (tx) => filas(tx, "select id from talent_profiles"));
    expect(propio.map((p) => p.id)).toEqual([perfil.delGestor]);
    expect(ajeno).toHaveLength(0);
  });

  it("el gestor registra a alguien sin cuenta y guarda su autorización", async () => {
    const r = await como(db, u.gestor, async (tx) => {
      const [p] = await filas(
        tx,
        "insert into talent_profiles (user_id, nombre, registrado_por) values (null, 'En campo', $1) returning id",
        [u.gestor],
      );
      await filas(tx, "select guardar_datos_privados($1, null, 'v1', 'audio')", [p.id]);
      return p.id;
    });
    expect(r).toBeTruthy();
  });
});

describe("equipo", () => {
  it("el curador no lee talent_private directamente", async () => {
    await expect(como(db, u.curador, (tx) => filas(tx, "select * from talent_private"))).rejects.toThrow(/permission denied/);
  });

  it("el curador la lee con motivo y queda registrado", async () => {
    const r = await como(db, u.curador, (tx) =>
      filas(tx, "select fecha_nacimiento from ver_datos_privados($1, 'Verificar requisito de entrada')", [perfil.reservado]),
    );
    expect(r).toHaveLength(1);
    // La transacción de la prueba se deshace; se comprueba el registro dentro de una nueva.
    const registro = await como(db, u.curador, async (tx) => {
      await filas(tx, "select * from ver_datos_privados($1, 'Auditoría')", [perfil.reservado]);
      await tx.exec("reset role");
      return filas(tx, "select motivo, visto_por from private_access_log");
    });
    expect(registro).toEqual([{ motivo: "Auditoría", visto_por: u.curador }]);
  });

  it("sin motivo no hay lectura", async () => {
    await expect(
      como(db, u.curador, (tx) => filas(tx, "select * from ver_datos_privados($1, '  ')", [perfil.reservado])),
    ).rejects.toThrow(/motivo obligatorio/);
  });

  it("el gestor no es equipo: no lee datos privados", async () => {
    await expect(
      como(db, u.gestor, (tx) => filas(tx, "select * from ver_datos_privados($1, 'x')", [perfil.delGestor])),
    ).rejects.toThrow(/sin permiso/);
  });
});

describe("empresas: solo el equipo verifica (regla 9)", () => {
  it("una empresa no se crea verificada", async () => {
    await expect(
      como(db, u.empresa, (tx) =>
        filas(tx, "insert into companies (owner_id, nombre, verificada_en) values ($1, 'Trampa SAS', now())", [u.empresa]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("una empresa no se verifica a sí misma después", async () => {
    await expect(
      como(db, u.empresa, async (tx) => {
        const [c] = await filas(tx, "insert into companies (owner_id, nombre) values ($1, 'Alimentos SAS') returning id", [u.empresa]);
        return filas(tx, "update companies set verificada_en = now() where id = $1", [c.id]);
      }),
    ).rejects.toThrow(/solo el equipo verifica/);
  });

  it("el curador sí la verifica", async () => {
    const [c] = await db.query<{ id: string }>("insert into companies (owner_id, nombre) values ($1, 'Verificable SAS') returning id", [u.empresa]).then((r) => r.rows);
    const r = await como(db, u.curador, (tx) =>
      tx.query("update companies set verificada_en = now(), verificada_por = $2, verificada_fuente = 'RUES' where id = $1", [c.id, u.curador]),
    );
    expect(r.affectedRows).toBe(1);
  });

  it("una empresa no ve las de otras", async () => {
    const otra = await crearUsuario(db, "empresa");
    const r = await como(db, otra, (tx) => filas(tx, "select * from companies"));
    expect(r).toHaveLength(0);
  });
});

describe("límite de códigos", () => {
  it("permite 5 por hora por destino y luego bloquea", async () => {
    const hash = "a".repeat(64);
    const resultados: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      const [r] = await db.query<{ ok: boolean }>("select registrar_intento_codigo($1) as ok", [hash]).then((x) => x.rows);
      resultados.push(r.ok);
    }
    expect(resultados).toEqual([true, true, true, true, true, false]);
  });

  it("la llave pública puede llamarla, pero no leer los intentos", async () => {
    const [r] = await como(db, null, (tx) => filas(tx, "select registrar_intento_codigo($1) as ok", ["b".repeat(64)]));
    expect(r.ok).toBe(true);
    await expect(como(db, null, (tx) => filas(tx, "select * from otp_attempts"))).rejects.toThrow(/permission denied/);
  });
});
