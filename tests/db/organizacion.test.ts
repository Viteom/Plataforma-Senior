import { describe, it, expect } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario } from "./base";

// Varias personas por organización: roles, invitaciones, solo lectura y la preferencia de pago
// del talento, que ninguna organización ve.

async function real(db: PGlite, u: string, sql: string, args: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [u]);
    return tx.query<Record<string, unknown>>(sql, args);
  });
}

async function cuenta(db: PGlite, rol: "empresa" | "talento", correo: string) {
  const id = await crearUsuario(db, rol);
  await db.query("update auth.users set email=$1 where id=$2", [correo, id]);
  return id;
}

async function escenario() {
  const db = await crearBase();
  const marta = await cuenta(db, "empresa", "marta@oriente.co");
  const otra = await cuenta(db, "empresa", "dueno@otra.co");
  const curador = await crearUsuario(db, "curador");
  await real(db, marta, "insert into companies(owner_id,nombre) values($1,'Alimentos del Oriente')", [marta]);
  await real(db, otra, "insert into companies(owner_id,nombre) values($1,'Otra organización')", [otra]);
  const empresa = (await db.query<{ id: string }>("select id from companies where owner_id=$1", [marta])).rows[0].id;
  await db.query("update companies set verificada_en=now() where id=$1", [empresa]);
  return { db, marta, otra, curador, empresa };
}

async function sumar(s: Awaited<ReturnType<typeof escenario>>, correo: string, rol: string) {
  await real(s.db, s.marta, "select invitar_a_mi_empresa($1,$2)", [correo, rol]);
  // Supabase guarda el correo de la cuenta en minúsculas y sin espacios.
  const id = await cuenta(s.db, "empresa", correo.trim().toLowerCase());
  const r = await real(s.db, id, "select aceptar_invitacion() as e");
  expect(r.rows[0].e).toBe(s.empresa);
  return id;
}

describe("equipo de la organización", () => {
  it("quien registra la organización queda como administración", async () => {
    const s = await escenario();
    const r = await real(s.db, s.marta, "select rol, soy_yo from miembros_de_mi_empresa()");
    expect(r.rows).toEqual([{ rol: "admin", soy_yo: true }]);
    await s.db.close();
  });

  it("una persona invitada entra con su correo y ve los retos de la organización", async () => {
    const s = await escenario();
    await real(s.db, s.marta, "insert into needs(company_id,problema) values($1,'Ordenar el inventario de la bodega principal')", [s.empresa]);
    const julian = await sumar(s, "Julian@Oriente.co ", "procesos");
    expect((await real(s.db, julian, "select problema from needs")).rows).toHaveLength(1);
    expect((await real(s.db, julian, "select nombre from companies")).rows).toEqual([{ nombre: "Alimentos del Oriente" }]);
    expect((await s.db.query("select rol from user_roles where user_id=$1", [julian])).rows[0]).toEqual({ rol: "empresa" });
    // Procesos publica retos, pero no cambia el equipo ni los datos de la organización.
    await real(s.db, julian, "insert into needs(company_id,problema) values($1,'Mentoría en costos para el área de compras')", [s.empresa]);
    await expect(real(s.db, julian, "select invitar_a_mi_empresa('a@oriente.co','lectura')")).rejects.toThrow(/Solo administración/);
    expect((await real(s.db, julian, "update companies set nombre='Otro' where id=$1", [s.empresa])).affectedRows).toBe(0);
    await s.db.close();
  });

  it("solo lectura ve pero la base no le deja cambiar nada", async () => {
    const s = await escenario();
    const luisa = await sumar(s, "luisa@oriente.co", "lectura");
    await expect(
      real(s.db, luisa, "insert into needs(company_id,problema) values($1,'Un reto que no debería poder publicar')", [s.empresa]),
    ).rejects.toThrow(/solo lectura/);
    expect((await real(s.db, luisa, "select id from companies")).rows).toHaveLength(1);
    await s.db.close();
  });

  it("siempre queda alguien con administración; quitar a alguien le quita el acceso", async () => {
    const s = await escenario();
    await expect(real(s.db, s.marta, "select cambiar_rol_miembro($1,'procesos')", [s.marta])).rejects.toThrow(/al menos una/);
    await expect(real(s.db, s.marta, "select quitar_miembro($1)", [s.marta])).rejects.toThrow(/al menos una/);
    const julian = await sumar(s, "julian@oriente.co", "procesos");
    await real(s.db, s.marta, "select cambiar_rol_miembro($1,'admin')", [julian]);
    await real(s.db, julian, "select quitar_miembro($1)", [s.marta]);
    expect((await real(s.db, s.marta, "select id from companies")).rows).toHaveLength(0);
    await s.db.close();
  });

  it("las invitaciones no sirven con otro correo, vencidas, canceladas ni para cuentas de talento con perfil", async () => {
    const s = await escenario();
    await real(s.db, s.marta, "select invitar_a_mi_empresa('pedro@oriente.co','procesos')");
    const intruso = await cuenta(s.db, "empresa", "intruso@correo.co");
    expect((await real(s.db, intruso, "select aceptar_invitacion() as e")).rows[0].e).toBeNull();

    const inv = (await real(s.db, s.marta, "select id from company_invitations")).rows[0].id;
    await real(s.db, s.marta, "select cancelar_invitacion($1)", [inv]);
    const pedro = await cuenta(s.db, "empresa", "pedro@oriente.co");
    expect((await real(s.db, pedro, "select aceptar_invitacion() as e")).rows[0].e).toBeNull();

    await real(s.db, s.marta, "select invitar_a_mi_empresa('ana@oriente.co','procesos')");
    await s.db.query("update company_invitations set vence_en=now()-interval '1 day' where correo='ana@oriente.co'");
    const ana = await cuenta(s.db, "empresa", "ana@oriente.co");
    expect((await real(s.db, ana, "select aceptar_invitacion() as e")).rows[0].e).toBeNull();

    await real(s.db, s.marta, "select invitar_a_mi_empresa('rosa@correo.co','procesos')");
    const rosa = await cuenta(s.db, "talento", "rosa@correo.co");
    await s.db.query("insert into talent_profiles(user_id,nombre) values($1,'Rosa')", [rosa]);
    expect((await real(s.db, rosa, "select aceptar_invitacion() as e")).rows[0].e).toBeNull();
    expect((await s.db.query("select rol from user_roles where user_id=$1", [rosa])).rows[0]).toEqual({ rol: "talento" });

    // Una organización no ve las invitaciones ni el equipo de otra.
    expect((await real(s.db, s.otra, "select * from company_invitations")).rows).toHaveLength(0);
    expect((await real(s.db, s.otra, "select * from miembros_de_mi_empresa()")).rows).toHaveLength(1);
    await s.db.close();
  });

  it("nadie se suma ni cambia roles escribiendo directo en las tablas", async () => {
    const s = await escenario();
    await expect(
      real(s.db, s.otra, "insert into company_members(company_id,user_id,rol) values($1,$2,'admin')", [s.empresa, s.otra]),
    ).rejects.toThrow();
    await expect(real(s.db, s.marta, "update company_members set rol='lectura'")).rejects.toThrow();
    await s.db.close();
  });
});

describe("preferencia de pago del talento", () => {
  it("la persona la guarda, el equipo la ve y ninguna organización", async () => {
    const s = await escenario();
    const rosa = await cuenta(s.db, "talento", "rosa@correo.co");
    const perfil = (
      await s.db.query<{ id: string }>("insert into talent_profiles(user_id,nombre,estado) values($1,'Rosa','publicado') returning id", [rosa])
    ).rows[0].id;
    await real(s.db, rosa, "insert into talent_payout_preferences(talent_id,metodo) values($1,'nequi')", [perfil]);
    await real(s.db, rosa, "update talent_payout_preferences set metodo='daviplata', celular='3001234567' where talent_id=$1", [perfil]);
    await expect(
      real(s.db, rosa, "update talent_payout_preferences set metodo='banco' where talent_id=$1", [perfil]),
    ).rejects.toThrow();
    expect((await real(s.db, s.curador, "select metodo from talent_payout_preferences")).rows).toEqual([{ metodo: "daviplata" }]);
    expect((await real(s.db, s.marta, "select * from talent_payout_preferences")).rows).toHaveLength(0);
    const otra = await cuenta(s.db, "talento", "otra@correo.co");
    expect((await real(s.db, otra, "select * from talent_payout_preferences")).rows).toHaveLength(0);
    await s.db.close();
  });
});
