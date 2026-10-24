import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Procesos: después de abrir una conexión, conversación, acuerdo, en curso y cierre, vistos desde
// los dos lados. Cada paso lo da quien le toca y desde la etapa correcta.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let u: Record<"talento" | "otroTalento" | "empresa" | "otraEmpresa", string>;
let perfil: string;

const manana = () => new Date(Date.now() + 24 * 3600_000).toISOString();
const ACUERDO = { forma: "proyecto", horas: 15, valor: 3000000, unidad: "proyecto", nota: "Certificación de la segunda planta" };

beforeEach(async () => {
  db = await crearBase();
  u = {
    talento: await crearUsuario(db, "talento"),
    otroTalento: await crearUsuario(db, "talento"),
    empresa: await crearUsuario(db, "empresa"),
    otraEmpresa: await crearUsuario(db, "empresa"),
  };
  const [p] = await filas(
    db,
    "insert into talent_profiles (user_id, nombre, oficio, visibilidad, estado) values ($1, 'Ana Reservada', 'Producción de alimentos', 'reservado', 'publicado') returning id",
    [u.talento],
  );
  perfil = p.id as string;
  for (const [owner, nombre] of [[u.empresa, "Alimentos SAS"], [u.otraEmpresa, "Otra SAS"]]) {
    await filas(db, "insert into companies (owner_id, nombre, nit, verificada_en, verificada_fuente) values ($1, $2, '900123456', now(), 'RUES')", [owner, nombre]);
  }
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

const avanzar = (usuario: string, conexion: string, accion: string, datos: object = {}) =>
  comoReal(usuario, () => filas(db, "select avanzar_proceso($1, $2, $3) as estado", [conexion, accion, JSON.stringify(datos)])).then(
    ([f]) => f.estado as string,
  );

// Conexión desde Explorar con la doble aceptación hecha: queda «abierta».
async function abierta() {
  const [{ id }] = await comoReal(u.empresa, () => filas(db, "select pedir_conexion($1) as id", [perfil]));
  await comoReal(u.talento, () => filas(db, "select actuar_conexion($1, 'me_interesa')", [id]));
  return id as string;
}

// Búsqueda por problema en la que la persona ya dijo «Me interesa».
async function leInteresa() {
  const [n] = await filas(db, "insert into needs (company_id, problema) values ((select id from companies where owner_id = $1), 'Abrir una segunda planta y cumplir INVIMA') returning id", [u.empresa]);
  const [c] = await filas(
    db,
    `insert into connections (company_id, talent_id, need_id, origen, estado)
     values ((select id from companies where owner_id = $1), $2, $3, 'problema', 'enviada_talento') returning id`,
    [u.empresa, perfil, n.id],
  );
  await comoReal(u.talento, () => filas(db, "select actuar_conexion($1, 'me_interesa')", [c.id]));
  return c.id as string;
}

const vistaEmpresa = () => como(db, u.empresa, (tx) => filas(tx, "select * from company_connections_view")).then((r) => r[0]);
const vistaTalento = () => como(db, u.talento, (tx) => filas(tx, "select * from talent_opportunities_view")).then((r) => r[0]);
const avisos = (conexion: string) =>
  filas(db, "select plantilla from notifications where connection_id = $1 order by creado_en", [conexion]).then((r) => r.map((a) => a.plantilla));

describe("el proceso completo", () => {
  it("abierta → conversación → acuerdo → en curso → terminado, con calificación de las dos partes", async () => {
    const id = await abierta();

    expect(await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "videollamada" })).toBe("conversacion");
    expect(await vistaTalento()).toMatchObject({ estado: "conversacion", conversacion_modo: "videollamada", conversacion_confirmada: false });
    await avanzar(u.talento, id, "confirmar_fecha");
    expect((await vistaEmpresa()).conversacion_confirmada).toBe(true);

    expect(await avanzar(u.empresa, id, "proponer_acuerdo", ACUERDO)).toBe("acuerdo");
    const propuesta = await vistaTalento();
    expect(propuesta).toMatchObject({ estado: "acuerdo", acuerdo_forma: "proyecto", acuerdo_horas_semana: 15, acuerdo_unidad: "proyecto" });
    expect(Number(propuesta.acuerdo_valor)).toBe(3000000);

    expect(await avanzar(u.talento, id, "aceptar_acuerdo")).toBe("en_curso");
    expect((await vistaEmpresa()).acuerdo_aceptado_en).toBeTruthy();

    expect(await avanzar(u.empresa, id, "terminar", { evaluacion: 5 })).toBe("cerrada");
    await avanzar(u.talento, id, "calificar", { evaluacion: 4 });
    const [c] = await filas(db, "select cierre_tipo, cerrada_por, evaluacion_empresa, evaluacion_talento from connections where id = $1", [id]);
    expect(c).toEqual({ cierre_tipo: "terminado", cerrada_por: "empresa", evaluacion_empresa: 5, evaluacion_talento: 4 });

    // La persona recibe aviso en cada paso que la necesita.
    expect(await avisos(id)).toEqual(["oportunidad_nueva", "conversacion_agendada", "acuerdo_propuesto"]);
    // El nombre sigue visible para la organización después de terminar.
    const [p] = await como(db, u.empresa, (tx) => filas(tx, "select nombre from company_talent_view where id = $1", [perfil]));
    expect(p.nombre).toBe("Ana Reservada");
  });

  it("la persona puede pedir otra fecha o ajustar el acuerdo, y el equipo recibe el caso", async () => {
    const id = await abierta();
    await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "llamada" });
    expect(await avanzar(u.talento, id, "otra_fecha")).toBe("abierta");
    expect((await vistaTalento()).conversacion_en).toBeNull();

    await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "presencial" });
    await avanzar(u.empresa, id, "proponer_acuerdo", ACUERDO);
    expect(await avanzar(u.talento, id, "ajustar_acuerdo")).toBe("conversacion");
    const casos = await filas(db, "select motivo from help_requests where canal = 'proceso' order by creado_en");
    expect(casos.map((c) => c.motivo)).toEqual([
      "La persona pide otra fecha para la conversación.",
      "La persona quiere ajustar el acuerdo antes de aceptarlo.",
    ]);
  });
});

describe("cada quien da su paso", () => {
  it("la persona no agenda ni propone; la organización no acepta por la persona", async () => {
    const id = await abierta();
    await expect(avanzar(u.talento, id, "agendar", { fecha: manana(), modo: "llamada" })).rejects.toThrow(/no permitida/);
    await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "llamada" });
    await expect(avanzar(u.talento, id, "proponer_acuerdo", ACUERDO)).rejects.toThrow(/no permitida/);
    await expect(avanzar(u.empresa, id, "confirmar_fecha")).rejects.toThrow(/no permitida/);
    await avanzar(u.empresa, id, "proponer_acuerdo", ACUERDO);
    await expect(avanzar(u.empresa, id, "aceptar_acuerdo")).rejects.toThrow(/no permitida/);
  });

  it("nadie de afuera toca el proceso", async () => {
    const id = await abierta();
    await expect(avanzar(u.otraEmpresa, id, "agendar", { fecha: manana(), modo: "llamada" })).rejects.toThrow(/no permitida/);
    await expect(avanzar(u.otroTalento, id, "no_seguir", { motivo: "No me interesa" })).rejects.toThrow(/no permitida/);
  });

  it("no se salta etapas: sin conversación no hay acuerdo y sin acuerdo aceptado no se termina", async () => {
    const id = await abierta();
    await expect(avanzar(u.empresa, id, "proponer_acuerdo", ACUERDO)).rejects.toThrow(/no permitida/);
    await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "llamada" });
    await expect(avanzar(u.empresa, id, "terminar", { evaluacion: 5 })).rejects.toThrow(/no permitida/);
  });

  it("la conversación es en el futuro y el acuerdo siempre lleva pago", async () => {
    const id = await abierta();
    await expect(avanzar(u.empresa, id, "agendar", { fecha: "2020-01-01T10:00:00Z", modo: "llamada" })).rejects.toThrow(/futura/);
    await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "llamada" });
    await expect(avanzar(u.empresa, id, "proponer_acuerdo", { forma: "mentoria", horas: 4 })).rejects.toThrow(/valor/);
    await expect(avanzar(u.empresa, id, "proponer_acuerdo", { ...ACUERDO, valor: 0 })).rejects.toThrow(/valor/);
  });

  it("no se califica dos veces", async () => {
    const id = await abierta();
    await avanzar(u.empresa, id, "agendar", { fecha: manana(), modo: "llamada" });
    await avanzar(u.empresa, id, "proponer_acuerdo", ACUERDO);
    await avanzar(u.talento, id, "aceptar_acuerdo");
    await avanzar(u.talento, id, "terminar", { evaluacion: 5 });
    await expect(avanzar(u.talento, id, "calificar", { evaluacion: 1 })).rejects.toThrow(/no permitida/);
  });
});

describe("cuando no sigue", () => {
  it("si la organización no sigue antes de abrir, no ve el nombre y la persona ve el motivo", async () => {
    const id = await leInteresa();
    expect(await avanzar(u.empresa, id, "no_seguir", { motivo: "Elegimos otro perfil" })).toBe("cerrada");
    const [p] = await como(db, u.empresa, (tx) => filas(tx, "select nombre, identidad_visible from company_talent_view where id = $1", [perfil]));
    expect(p).toMatchObject({ nombre: null, identidad_visible: false });
    expect(await vistaTalento()).toMatchObject({ estado: "cerrada", cierre_tipo: "no_sigue", cerrada_por: "empresa", motivo_cierre: "Elegimos otro perfil" });
    expect(await avisos(id)).toContain("proceso_cerrado");
  });

  it("si la persona no sigue, la organización no ve su motivo", async () => {
    const id = await abierta();
    await expect(avanzar(u.talento, id, "no_seguir", { motivo: "" })).rejects.toThrow(/motivo/);
    await avanzar(u.talento, id, "no_seguir", { motivo: "Ya tengo otro trabajo" });
    expect(await vistaEmpresa()).toMatchObject({ estado: "cerrada", cerrada_por: "talento", motivo_cierre: null });
  });

  it("un «Me interesa» sin respuesta en 14 días vence: las dos partes lo ven y ya no se abre", async () => {
    const id = await leInteresa();
    expect((await vistaEmpresa()).dias_esperando).toBe(0);
    await filas(db, "alter table connections disable trigger conexion_regla_9");
    await filas(db, "update connections set actualizado_en = now() - interval '15 days' where id = $1", [id]);
    await filas(db, "alter table connections enable trigger conexion_regla_9");
    expect((await vistaEmpresa()).estado).toBe("sin_respuesta");
    expect((await vistaTalento()).estado).toBe("sin_respuesta");
    await expect(comoReal(u.empresa, () => filas(db, "select actuar_conexion($1, 'quiero_conocer')", [id]))).rejects.toThrow(/sin respuesta/);
  });
});
