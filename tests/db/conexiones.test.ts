import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Hito 4: conexiones, regla 9 (solo empresas verificadas llegan al talento), vistas para empresa y
// talento, revelación de identidad, reportes y avisos.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let u: Record<"talento" | "otroTalento" | "empresa" | "empresaSinVerificar" | "curador", string>;
let perfil: string, otroPerfil: string, empresa: string, empresaSinVerificar: string;

async function crearEmpresa(owner: string, nombre: string, verificada: boolean) {
  const [c] = await filas(
    db,
    `insert into companies (owner_id, nombre, nit, verificada_en, verificada_fuente) values ($1, $2, '900123456', $3, $4) returning id`,
    [owner, nombre, verificada ? new Date().toISOString() : null, verificada ? "RUES" : null],
  );
  return c.id as string;
}

// Base nueva para cada prueba: los estados de conexión cambian con cada acción.
beforeEach(async () => {
  db = await crearBase();
  u = {
    talento: await crearUsuario(db, "talento"),
    otroTalento: await crearUsuario(db, "talento"),
    empresa: await crearUsuario(db, "empresa"),
    empresaSinVerificar: await crearUsuario(db, "empresa"),
    curador: await crearUsuario(db, "curador"),
  };
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Ana Reservada', 'Producción de alimentos', 'reservado', 'publicado') returning id",
    [u.talento],
  );
  perfil = p.id as string;
  const [p2] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, visibilidad, estado) values ($1, 'Otra', 'visible', 'publicado') returning id",
    [u.otroTalento],
  );
  otroPerfil = p2.id as string;
  await filas(db, "insert into talent_offers (talent_id, tipo, tarifa_esperada) values ($1, 'conversacion', 150000)", [perfil]);
  empresa = await crearEmpresa(u.empresa, "Alimentos SAS", true);
  empresaSinVerificar = await crearEmpresa(u.empresaSinVerificar, "Sin Verificar SAS", false);
});

// Ejecuta como la persona con commit real (como() deshace todo al final).
async function comoReal<T>(usuario: string, fn: () => Promise<T>) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuario]);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

describe("regla 9: solo empresas verificadas llegan al talento", () => {
  it("una empresa sin verificar no puede pedir conexiones", async () => {
    await expect(
      como(db, u.empresaSinVerificar, (tx) => filas(tx, "select pedir_conexion($1)", [perfil])),
    ).rejects.toThrow(/empresa sin verificar/);
  });

  it("ni siquiera el equipo puede enviar una conexión de una empresa sin verificar", async () => {
    await expect(
      como(db, u.curador, (tx) =>
        filas(tx, "insert into connections (company_id, talent_id, origen, estado) values ($1, $2, 'exploracion', 'enviada_talento')", [empresaSinVerificar, perfil]),
      ),
    ).rejects.toThrow(/empresa sin verificar/);
    // Tampoco por actualización directa con la llave de servicio o la consola.
    const [c] = await filas(db, "insert into connections (company_id, talent_id, origen, estado) values ($1, $2, 'exploracion', 'elegida') returning id", [empresaSinVerificar, perfil]);
    await expect(filas(db, "update connections set estado = 'enviada_talento' where id = $1", [c.id])).rejects.toThrow(/empresa sin verificar/);
  });

  it("una empresa pausada por reportes tampoco llega", async () => {
    await filas(db, "update companies set estado = 'pausada' where id = $1", [empresa]);
    await expect(como(db, u.empresa, (tx) => filas(tx, "select pedir_conexion($1)", [perfil]))).rejects.toThrow(/pausada/);
  });

  it("la empresa no se verifica ni se reactiva a sí misma", async () => {
    await expect(
      como(db, u.empresaSinVerificar, (tx) => filas(tx, "update companies set verificada_en = now() where id = $1", [empresaSinVerificar])),
    ).rejects.toThrow(/solo el equipo/);
    await filas(db, "update companies set estado = 'pausada' where id = $1", [empresa]);
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "update companies set estado = 'activa' where id = $1", [empresa])),
    ).rejects.toThrow(/solo el equipo/);
  });
});

describe("flujo desde Explorar", () => {
  it("pedir → aviso en cola → la persona ve la empresa verificada → me interesa → abierta y el equipo los contacta", async () => {
    const [{ id }] = await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1) as id", [perfil]));

    const [aviso] = await filas(db, "select canal, plantilla, estado from notifications where connection_id = $1", [id]);
    expect(aviso).toMatchObject({ canal: "sms", plantilla: "oportunidad_nueva", estado: "pendiente" });

    const oportunidades = await como(db, u.talento, (tx) => filas(tx, "select empresa, empresa_verificada, estado from talent_opportunities_view"));
    expect(oportunidades).toEqual([{ empresa: "Alimentos SAS", empresa_verificada: true, estado: "enviada_talento" }]);

    // Antes de la doble aceptación la empresa no ve el nombre.
    const [antes] = await como(db, u.empresa, (tx) => filas(tx, "select nombre, identidad_visible from company_talent_view where id = $1", [perfil]));
    expect(antes).toMatchObject({ nombre: null, identidad_visible: false });

    const [{ estado }] = await comoReal(u.talento, () => filas(db, "select actuar_conexion($1, 'me_interesa') as estado", [id]));
    expect(estado).toBe("abierta");

    const [despues] = await como(db, u.empresa, (tx) => filas(tx, "select nombre from company_talent_view where id = $1", [perfil]));
    expect(despues.nombre).toBe("Ana Reservada");
    const [ayuda] = await filas(db, "select canal from help_requests where canal = 'conexion_abierta'");
    expect(ayuda).toBeTruthy();
  });

  it("si la persona dice que no, la empresa solo ve 'no disponible'", async () => {
    const [{ id }] = await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1) as id", [perfil]));
    await comoReal(u.talento, () => filas(db, "select actuar_conexion($1, 'no_me_interesa')", [id]));
    const vista = await como(db, u.empresa, (tx) => filas(tx, "select estado, puntaje from company_connections_view"));
    expect(vista).toEqual([{ estado: "no_disponible", puntaje: null }]);
  });

  it("no se pide dos veces el mismo perfil mientras la conexión siga viva", async () => {
    await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1)", [perfil]));
    await expect(comoReal(u.empresa, () => filas(db, "select pedir_conexion($1)", [perfil]))).rejects.toThrow(/una_conexion_viva/);
  });
});

describe("flujo por problema (curaduría)", () => {
  async function prepararNecesidad() {
    const [n] = await filas(db, "insert into needs (company_id, problema) values ($1, 'Abrir una segunda planta y cumplir INVIMA') returning id", [empresa]);
    const [c] = await filas(
      db,
      `insert into connections (company_id, talent_id, need_id, origen, estado, puntaje, desglose)
       values ($1, $2, $3, 'problema', 'propuesta', 82, '{"situaciones": 0.3}') returning id`,
      [empresa, perfil, n.id],
    );
    return { need: n.id as string, conexion: c.id as string };
  }

  it("la empresa y la persona no ven las propuestas internas del curador", async () => {
    await prepararNecesidad();
    expect(await como(db, u.empresa, (tx) => filas(tx, "select * from company_connections_view"))).toHaveLength(0);
    expect(await como(db, u.talento, (tx) => filas(tx, "select * from talent_opportunities_view"))).toHaveLength(0);
    await expect(como(db, u.empresa, (tx) => filas(tx, "select * from connections"))).resolves.toHaveLength(0);
  });

  it("curador elige y envía; la persona acepta; recién ahí la empresa ve el puntaje y la razón", async () => {
    const { conexion } = await prepararNecesidad();
    await comoReal(u.curador, () =>
      filas(db, "update connections set estado = 'elegida', razon_curador = 'Lideró una certificación parecida' where id = $1", [conexion]),
    );
    await comoReal(u.curador, () => filas(db, "update connections set estado = 'enviada_talento' where id = $1", [conexion]));

    // Esperando la respuesta de la persona, la empresa todavía no ve nada de esta búsqueda.
    expect(await como(db, u.empresa, (tx) => filas(tx, "select * from company_connections_view"))).toHaveLength(0);

    await comoReal(u.talento, () => filas(db, "select actuar_conexion($1, 'me_interesa')", [conexion]));
    const [vista] = await como(db, u.empresa, (tx) => filas(tx, "select estado, puntaje, razon_curador from company_connections_view"));
    expect(vista).toMatchObject({ estado: "le_interesa", razon_curador: "Lideró una certificación parecida" });
    expect(Number(vista.puntaje)).toBe(82);

    await comoReal(u.empresa, () => filas(db, "select actuar_conexion($1, 'quiero_conocer')", [conexion]));
    const [{ estado }] = await filas(db, "select estado from connections where id = $1", [conexion]);
    expect(estado).toBe("abierta");
  });

  it("cerrar ya no pasa por actuar_conexion: terminar exige el acuerdo aceptado (ver procesos.test.ts)", async () => {
    const { conexion } = await prepararNecesidad();
    await filas(db, "update connections set estado = 'abierta' where id = $1", [conexion]);
    await expect(comoReal(u.empresa, () => filas(db, "select actuar_conexion($1, 'cerrar', 5)", [conexion]))).rejects.toThrow(/no permitida/);
    expect(await filas(db, "select * from evidence where talent_id = $1", [perfil])).toHaveLength(0);
  });

  it("nadie se salta pasos: la persona no abre sola ni la empresa acepta por la persona", async () => {
    const { conexion } = await prepararNecesidad();
    await expect(comoReal(u.talento, () => filas(db, "select actuar_conexion($1, 'me_interesa')", [conexion]))).rejects.toThrow(/no permitida/);
    await filas(db, "update connections set estado = 'enviada_talento' where id = $1", [conexion]);
    await expect(comoReal(u.empresa, () => filas(db, "select actuar_conexion($1, 'me_interesa')", [conexion]))).rejects.toThrow(/no permitida/);
    await expect(comoReal(u.otroTalento, () => filas(db, "select actuar_conexion($1, 'me_interesa')", [conexion]))).rejects.toThrow(/no permitida/);
  });

  it("una empresa no ve necesidades de otra", async () => {
    await prepararNecesidad();
    const otra = await crearUsuario(db, "empresa");
    await crearEmpresa(otra, "Otra SAS", true);
    expect(await como(db, otra, (tx) => filas(tx, "select * from needs"))).toHaveLength(0);
  });
});

describe("reportes (A2)", () => {
  it("reportar pausa las conexiones con esa empresa; dos reportes confirmados pausan a la empresa", async () => {
    const [{ id }] = await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1) as id", [perfil]));
    await comoReal(u.talento, () => filas(db, "select reportar_empresa($1, 'Me pidió plata para el examen médico')", [id]));
    const [c] = await filas(db, "select estado from connections where id = $1", [id]);
    expect(c.estado).toBe("pausada");

    const [{ id: id2 }] = await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1) as id", [otroPerfil]));
    await comoReal(u.otroTalento, () => filas(db, "select reportar_empresa($1, 'Pidió datos bancarios')", [id2]));
    await comoReal(u.curador, () => filas(db, "update company_reports set estado = 'confirmado'"));
    const [co] = await filas(db, "select estado from companies where id = $1", [empresa]);
    expect(co.estado).toBe("pausada");
  });

  it("nadie reporta conexiones que no son suyas", async () => {
    const [{ id }] = await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1) as id", [perfil]));
    await expect(comoReal(u.otroTalento, () => filas(db, "select reportar_empresa($1, 'falso')", [id]))).rejects.toThrow(/sin permiso/);
  });
});

describe("vista de perfiles para empresas", () => {
  it("muestra un rango de tarifa, nunca el número exacto", async () => {
    const [p] = await como(db, u.empresa, (tx) => filas(tx, "select ofertas from company_talent_view where id = $1", [perfil]));
    const [oferta] = p.ofertas as { rango_min: number; rango_max: number }[];
    expect(oferta.rango_min).toBeLessThan(150000);
    expect(oferta.rango_max).toBeGreaterThan(150000);
    expect(JSON.stringify(p)).not.toContain("150000");
  });

  it("los avisos solo los ve el equipo", async () => {
    await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1)", [perfil]));
    expect(await como(db, u.talento, (tx) => filas(tx, "select * from notifications"))).toHaveLength(0);
    expect(await como(db, u.curador, (tx) => filas(tx, "select * from notifications"))).toHaveLength(1);
  });
});
