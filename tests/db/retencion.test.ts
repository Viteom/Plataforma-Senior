import { describe, it, expect } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario } from "./base";

// Etapa 0 de la arquitectura: el panel del equipo en una sola llamada y la limpieza de lo vencido.

async function real(db: PGlite, u: string, sql: string, args: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [u]);
    return tx.query<Record<string, unknown>>(sql, args);
  });
}

describe("panel del equipo en una sola llamada", () => {
  it("trae rol, resumen y conteos; nadie fuera del equipo lo lee", async () => {
    const db = await crearBase();
    const admin = await crearUsuario(db, "admin");
    const talento = await crearUsuario(db, "talento");
    const empresa = await crearUsuario(db, "empresa");
    await db.query("update auth.users set raw_user_meta_data='{\"nombre\":\"Laura Méndez\"}' where id=$1", [admin]);
    await db.query("insert into help_requests(user_id,canal,motivo) values($1,'boton','Necesito ayuda')", [talento]);
    await db.query("insert into companies(owner_id,nombre) values($1,'Ferretería El Roble')", [empresa]);

    const p = (await real(db, admin, "select panel_equipo() as p")).rows[0].p as Record<string, unknown>;
    expect(p).toMatchObject({ rol: "admin", nombre: "Laura", conteos: { ayuda: 1, empresas: 1, necesidades: 0 } });
    expect(p.resumen).toMatchObject({ ayuda: { abiertas: 1 } });
    expect(JSON.stringify(p)).not.toMatch(/Necesito ayuda/);
    for (const u of [talento, empresa]) await expect(real(db, u, "select panel_equipo()")).rejects.toThrow(/Solo el equipo/);
    await db.close();
  });
});

describe("limpieza de datos vencidos", () => {
  it("borra solo lo que pasó su plazo y nunca lo que espera a una persona", async () => {
    const db = await crearBase();
    const talento = await crearUsuario(db, "talento");
    const curador = await crearUsuario(db, "curador");
    const perfil = (
      await db.query<{ id: string }>("insert into talent_profiles(user_id,nombre) values($1,'Rosa') returning id", [talento])
    ).rows[0].id;
    const viejo = "now() - interval '3 years'";

    await db.exec(`
      insert into otp_attempts(destino_hash, creado_en) values ('a', now() - interval '2 days'), ('b', now());
      insert into help_requests(user_id,canal,motivo,estado,creado_en) values
        ('${talento}','boton','vieja cerrada','cerrada',${viejo}),
        ('${talento}','boton','vieja abierta','abierta',${viejo}),
        ('${talento}','boton','reciente cerrada','cerrada',now());
      insert into private_access_log(talent_id,visto_por,motivo,visto_en) values
        ('${perfil}','${curador}','revisión',${viejo}), ('${perfil}','${curador}','revisión',now());
    `);

    const r = (await db.query<{ r: Record<string, number> }>("select limpiar_datos_vencidos() as r")).rows[0].r;
    expect(r).toMatchObject({ intentos_codigo: 1, ayudas: 1, lecturas_privadas: 1 });
    expect((await db.query("select motivo from help_requests order by motivo")).rows).toEqual([
      { motivo: "reciente cerrada" },
      { motivo: "vieja abierta" },
    ]);
    expect((await db.query("select count(*)::int as n from otp_attempts")).rows[0]).toEqual({ n: 1 });

    // Nadie la ejecuta desde la app.
    await expect(real(db, curador, "select limpiar_datos_vencidos()")).rejects.toThrow();
    await db.close();
  });
});
