import type { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

import { como, crearBase, crearUsuario } from "./base";

// Hito 5: experiencias, solicitudes e impacto, "Llámeme" sin cuenta, registro asistido del gestor
// (y que la persona reciba su perfil al entrar), Aprende y Emprende.

type Fila = Record<string, unknown>;
const filas = (tx: { query: PGlite["query"] }, sql: string, params: unknown[] = []) =>
  tx.query<Fila>(sql, params).then((r) => r.rows);

let db: PGlite;
let u: Record<"empresa" | "otraEmpresa" | "curador" | "gestor" | "talento", string>;
let empresa: string, otraEmpresa: string;

beforeEach(async () => {
  db = await crearBase();
  u = {
    empresa: await crearUsuario(db, "empresa"),
    otraEmpresa: await crearUsuario(db, "empresa"),
    curador: await crearUsuario(db, "curador"),
    gestor: await crearUsuario(db, "gestor"),
    talento: await crearUsuario(db, "talento"),
  };
  [{ id: empresa }] = (await filas(db, "insert into companies (owner_id, nombre) values ($1, 'Clínica SAS') returning id", [u.empresa])) as { id: string }[];
  [{ id: otraEmpresa }] = (await filas(db, "insert into companies (owner_id, nombre) values ($1, 'Otra SAS') returning id", [u.otraEmpresa])) as { id: string }[];
});

describe("experiencias", () => {
  it("la Ceremonia del cuidado llega como borrador y nadie fuera del equipo la ve", async () => {
    const [c] = await filas(db, "select estado from experiences where slug = 'ceremonia-del-cuidado'");
    expect(c.estado).toBe("borrador");
    expect(await como(db, u.empresa, (tx) => filas(tx, "select * from experiences"))).toHaveLength(0);
    expect(await como(db, null, (tx) => filas(tx, "select * from experiences"))).toHaveLength(0);
    expect(await como(db, u.curador, (tx) => filas(tx, "select * from experiences"))).toHaveLength(1);
  });

  it("no se publica sin la aprobación de la sabedora", async () => {
    await expect(filas(db, "update experiences set estado = 'publicada' where slug = 'ceremonia-del-cuidado'")).rejects.toThrow(/check/);
    await filas(db, "update experiences set estado = 'publicada', aprobada_por_sabedora_en = now() where slug = 'ceremonia-del-cuidado'");
    expect(await como(db, null, (tx) => filas(tx, "select nombre from experiences"))).toEqual([{ nombre: "Ceremonia del cuidado" }]);
  });

  it("una empresa no crea ni edita experiencias", async () => {
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "insert into experiences (slug, nombre, proposito) values ('falsa', 'X', 'Y')")),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("solicitudes de cotización e impacto", () => {
  async function solicitar() {
    const [e] = await filas(db, "select id from experiences limit 1");
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [u.empresa]);
    try {
      const [r] = await filas(db, "insert into experience_requests (experience_id, company_id, formato, personas, mes) values ($1, $2, 'sede', 20, 'Noviembre') returning id", [e.id, empresa]);
      return r.id as string;
    } finally {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  }

  it("la empresa pide para sí misma, no a nombre de otra, ni con valor ya cotizado", async () => {
    const [e] = await filas(db, "select id from experiences limit 1");
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "insert into experience_requests (experience_id, company_id, formato, personas, mes) values ($1, $2, 'sede', 5, 'Enero')", [e.id, otraEmpresa])),
    ).rejects.toThrow(/row-level security/);
    await expect(
      como(db, u.empresa, (tx) => filas(tx, "insert into experience_requests (experience_id, company_id, formato, personas, mes, valor_cotizado) values ($1, $2, 'sede', 5, 'Enero', 1)", [e.id, empresa])),
    ).rejects.toThrow(/row-level security/);
  });

  it("cada empresa ve sus solicitudes y su reporte de impacto, no los de otra", async () => {
    const solicitud = await solicitar();
    await filas(db, "insert into impact_records (experience_request_id, personas_impactadas, horas, pago_persona) values ($1, 20, 3, 400000)", [solicitud]);

    expect(await como(db, u.empresa, (tx) => filas(tx, "select personas_impactadas from impact_records"))).toEqual([{ personas_impactadas: 20 }]);
    expect(await como(db, u.otraEmpresa, (tx) => filas(tx, "select * from experience_requests"))).toHaveLength(0);
    expect(await como(db, u.otraEmpresa, (tx) => filas(tx, "select * from impact_records"))).toHaveLength(0);
  });

  it("la empresa no cambia el estado ni el valor; el equipo sí", async () => {
    const solicitud = await solicitar();
    const r = await como(db, u.empresa, (tx) => tx.query("update experience_requests set estado = 'confirmada' where id = $1", [solicitud]));
    expect(r.affectedRows).toBe(0);
    const e = await como(db, u.curador, (tx) => tx.query("update experience_requests set estado = 'cotizada', valor_cotizado = 2500000 where id = $1", [solicitud]));
    expect(e.affectedRows).toBe(1);
  });
});

describe("Llámeme sin cuenta", () => {
  it("cualquiera puede pedir que le llamen, con un celular válido", async () => {
    await como(db, null, (tx) => filas(tx, "select pedir_llamada('300 123 4567', 'manana', 'No me llega el código')"));
    await expect(como(db, null, (tx) => filas(tx, "select pedir_llamada('604 444', 'manana')"))).rejects.toThrow(/celular inválido/);
  });

  it("máximo 3 pedidos al día por número", async () => {
    for (let i = 0; i < 3; i++) await filas(db, "select pedir_llamada('3001234567', 'tarde')");
    await expect(filas(db, "select pedir_llamada('+57 300 123 4567', 'tarde')")).rejects.toThrow(/ya pidió/);
  });

  it("sin cuenta no se leen las solicitudes de otros", async () => {
    await filas(db, "select pedir_llamada('3001234567', 'tarde')");
    await expect(como(db, null, (tx) => filas(tx, "select * from help_requests"))).rejects.toThrow(/permission denied/);
  });
});

describe("registro asistido del gestor", () => {
  async function registrarEnCampo() {
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [u.gestor]);
    try {
      const [p] = await filas(db, "insert into talent_profiles (user_id, nombre, registrado_por) values (null, 'Rosa Tunubalá', $1) returning id", [u.gestor]);
      await filas(db, "insert into stories (talent_id, texto, origen) values ($1, 'Enseño a tejer mochilas', 'gestor')", [p.id]);
      await filas(db, "select guardar_registro_gestor($1, '3115556677', 'firma', $2)", [p.id, `${p.id}/firma.png`]);
      return p.id as string;
    } finally {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  }

  it("guarda el celular y la autorización solo para el equipo", async () => {
    const perfil = await registrarEnCampo();
    const [priv] = await filas(db, "select celular, autorizacion_medio, autorizacion_archivo from talent_private where talent_id = $1", [perfil]);
    expect(priv).toMatchObject({ celular: "3115556677", autorizacion_medio: "firma" });
    await expect(como(db, u.gestor, (tx) => filas(tx, "select * from talent_private"))).rejects.toThrow(/permission denied/);
  });

  it("un talento no usa la función del gestor", async () => {
    const perfil = await registrarEnCampo();
    await expect(
      como(db, u.talento, (tx) => filas(tx, "select guardar_registro_gestor($1, '3000000000', 'firma', 'x')", [perfil])),
    ).rejects.toThrow(/sin permiso/);
  });

  it("cuando la persona entra con ese celular, recibe su perfil; otra persona no", async () => {
    const perfil = await registrarEnCampo();
    const otra = await crearUsuario(db, "talento");
    await filas(db, "update auth.users set phone = '573009998888' where id = $1", [otra]);
    const [{ r: nada }] = await como(db, otra, (tx) => filas(tx, "select reclamar_perfil() as r"));
    expect(nada).toBeNull();

    const rosa = await crearUsuario(db, "talento");
    await filas(db, "update auth.users set phone = '573115556677' where id = $1", [rosa]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [rosa]);
    const [{ r }] = await filas(db, "select reclamar_perfil() as r");
    const propios = await filas(db, "select id from talent_profiles");
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    expect(r).toBe(perfil);
    expect(propios.map((p) => p.id)).toEqual([perfil]);

    // El gestor deja de verlo: ahora es de ella.
    expect(await como(db, u.gestor, (tx) => filas(tx, "select id from talent_profiles"))).toHaveLength(0);
  });

  it("una empresa con el mismo celular no se queda con el perfil", async () => {
    await registrarEnCampo();
    await filas(db, "update auth.users set phone = '573115556677' where id = $1", [u.empresa]);
    const [{ r }] = await como(db, u.empresa, (tx) => filas(tx, "select reclamar_perfil() as r"));
    expect(r).toBeNull();
  });
});

describe("Aprende y Emprende", () => {
  it("el catálogo publicado es público; los borradores solo los ve el equipo", async () => {
    await filas(db, "insert into courses (titulo, entidad, url, tema) values ('Borrador', 'X', 'https://x.co', 'digital')");
    const publicos = await como(db, null, (tx) => filas(tx, "select titulo from courses"));
    expect(publicos.map((c) => c.titulo)).not.toContain("Borrador");
    expect(publicos.length).toBeGreaterThan(0);
  });

  it("el diagnóstico es de la persona", async () => {
    const [p] = await filas(db, "insert into talent_profiles (user_id, nombre) values ($1, 'Ana') returning id", [u.talento]);
    await como(db, u.talento, (tx) => filas(tx, "insert into entrepreneurship_diagnostics (talent_id, etapa, necesidades) values ($1, 'idea', '{clientes}')", [p.id]));
    expect(await como(db, u.empresa, (tx) => filas(tx, "select * from entrepreneurship_diagnostics"))).toHaveLength(0);
  });
});
