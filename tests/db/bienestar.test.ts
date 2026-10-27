import { describe, it, expect } from "vitest";
import { crearBase, crearUsuario, como } from "./base";
import type { PGlite } from "@electric-sql/pglite";
async function comoReal(
  db: PGlite,
  user: string,
  sql: string,
  params: unknown[] = [],
) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
      user,
    ]);
    return tx.query<Record<string, unknown>>(sql, params);
  });
}
describe("bienestar privado y revisión de retos", () => {
  it("solo la persona guarda sus metas; ni la organización ni otro talento leen el seguimiento; el pedido de contacto llega al equipo", async () => {
    const db = await crearBase();
    const t = await crearUsuario(db, "talento"),
      otro = await crearUsuario(db, "talento"),
      e = await crearUsuario(db, "empresa"),
      curador = await crearUsuario(db, "curador");
    const p = (
      await db.query<{ id: string }>(
        "insert into talent_profiles(user_id,nombre) values($1,'Ana') returning id",
        [t],
      )
    ).rows[0].id;
    await comoReal(
      db,
      t,
      "insert into wellbeing_preferences(talent_id,horas_meta) values($1,20)",
      [p],
    );
    await comoReal(
      db,
      t,
      "insert into wellbeing_checkins(talent_id,energia,trato_respetuoso,quiere_contacto) values($1,'ajustar',true,true)",
      [p],
    );
    for (const u of [otro, e]) {
      expect(
        (
          await como(db, u, (tx) =>
            tx.query("select * from wellbeing_preferences"),
          )
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await como(db, u, (tx) =>
            tx.query("select * from wellbeing_checkins"),
          )
        ).rows,
      ).toHaveLength(0);
    }
    expect(
      (
        await como(db, curador, (tx) =>
          tx.query("select * from wellbeing_checkins"),
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from help_requests where user_id=$1", [t]))
        .rows,
    ).toHaveLength(1);
    await expect(
      comoReal(
        db,
        e,
        "insert into wellbeing_preferences(talent_id,horas_meta) values($1,30)",
        [p],
      ),
    ).rejects.toThrow();
    await db.close();
  });
  it("no se envía un reto sin revisión y la organización no se puede autorizar sola", async () => {
    const db = await crearBase();
    const e = await crearUsuario(db, "empresa"),
      t = await crearUsuario(db, "talento"),
      c = await crearUsuario(db, "curador");
    const empresa = (
      await db.query<{ id: string }>(
        "insert into companies(owner_id,nombre,verificada_en) values($1,'Empresa',now()) returning id",
        [e],
      )
    ).rows[0].id;
    const p = (
      await db.query<{ id: string }>(
        "insert into talent_profiles(user_id,nombre,estado) values($1,'Ana','publicado') returning id",
        [t],
      )
    ).rows[0].id;
    const n = (
      await comoReal(
        db,
        e,
        "insert into needs(company_id,problema,jornada_horas,remuneracion,remuneracion_unidad,condiciones) values($1,'Un reto de cocina con acompañamiento',20,500000,'proyecto','Hay descansos y apoyo de una persona responsable') returning id",
        [empresa],
      )
    ).rows[0].id;
    const enviar = () =>
      db.query(
        "insert into connections(company_id,talent_id,need_id,origen,estado) values($1,$2,$3,'problema','enviada_talento')",
        [empresa, p, n],
      );
    await expect(enviar()).rejects.toThrow(/autorizar/);
    await expect(
      comoReal(db, e, "select autorizar_reto($1,true,1)", [n]),
    ).rejects.toThrow();
    await comoReal(db, c, "select autorizar_reto($1,true,1)", [n]);
    await enviar();
    await db.query("update needs set remuneracion=600000 where id=$1", [n]);
    expect(
      (
        await db.query<Record<string, unknown>>(
          "select dignidad_estado from needs where id=$1",
          [n],
        )
      ).rows[0].dignidad_estado,
    ).toBe("pendiente");
    await db.close();
  });
});

it("también un acuerdo desde Explorar requiere revisión de su versión antes de empezar", async () => {
  const db = await crearBase();
  const e = await crearUsuario(db, "empresa"),
    t = await crearUsuario(db, "talento"),
    c = await crearUsuario(db, "curador");
  await db.query(
    "insert into companies(owner_id,nombre,verificada_en) values($1,'Empresa',now())",
    [e],
  );
  const p = (
    await db.query<{ id: string }>(
      "insert into talent_profiles(user_id,nombre,estado) values($1,'Ana','publicado') returning id",
      [t],
    )
  ).rows[0].id;
  const id = (await comoReal(db, e, "select pedir_conexion($1) as id", [p]))
    .rows[0].id;
  await comoReal(db, t, "select actuar_conexion($1,'me_interesa')", [id]);
  await comoReal(db, e, "select avanzar_proceso($1,'agendar',$2)", [
    id,
    JSON.stringify({
      fecha: new Date(Date.now() + 86400000).toISOString(),
      modo: "llamada",
    }),
  ]);
  const proponer = (valor: number) =>
    comoReal(db, e, "select avanzar_proceso($1,'proponer_acuerdo',$2)", [
      id,
      JSON.stringify({ forma: "proyecto", valor, unidad: "proyecto" }),
    ]);
  await proponer(500000);
  await expect(
    comoReal(
      db,
      t,
      "select avanzar_proceso($1,'aceptar_acuerdo','{\"version\":1}')",
      [id],
    ),
  ).rejects.toThrow(/Kánna debe revisar/);
  await expect(
    comoReal(db, e, "select autorizar_acuerdo($1,1)", [id]),
  ).rejects.toThrow();
  await comoReal(db, c, "select autorizar_acuerdo($1,1)", [id]);
  await proponer(530000);
  await expect(
    comoReal(db, c, "select autorizar_acuerdo($1,1)", [id]),
  ).rejects.toThrow(/cambió/);
  await expect(
    comoReal(
      db,
      t,
      "select avanzar_proceso($1,'aceptar_acuerdo','{\"version\":2}')",
      [id],
    ),
  ).rejects.toThrow(/Kánna debe revisar/);
  await comoReal(db, c, "select autorizar_acuerdo($1,2)", [id]);
  const vistaCarga = (
    await comoReal(db, t, "select previsualizar_carga($1,2) as carga", [id])
  ).rows[0].carga as { token: string };
  await comoReal(db, t, "select avanzar_proceso($1,'aceptar_acuerdo',$2)", [
    id,
    JSON.stringify({
      version: 2,
      carga_token: vistaCarga.token,
      confirmar_carga: true,
    }),
  ]);
  expect(
    (
      await db.query<{ estado: string }>(
        "select estado from connections where id=$1",
        [id],
      )
    ).rows[0].estado,
  ).toBe("en_curso");
  await db.close();
});
