import { describe, it, expect } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario } from "./base";

// Backoffice: el equipo solo tiene permisos con una sesión que pasó el segundo factor, y el resumen
// del panel de inicio da cifras sin datos de personas del talento.

async function sesion(db: PGlite, u: string, aal: "aal1" | "aal2", sql: string, args: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [u]);
    await tx.query("select set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: u, aal })]);
    return tx.query<Record<string, unknown>>(sql, args);
  });
}

async function escenario() {
  const db = await crearBase();
  const curador = await crearUsuario(db, "curador"),
    admin = await crearUsuario(db, "admin"),
    gestor = await crearUsuario(db, "gestor"),
    talento = await crearUsuario(db, "talento"),
    empresa = await crearUsuario(db, "empresa");
  await db.query("update auth.users set email='ana.ruiz@equipo.co', raw_user_meta_data='{\"nombre\":\"Ana\"}' where id=$1", [curador]);
  await db.query("insert into talent_profiles(user_id,nombre,estado) values($1,'Rosa Pérez','publicado')", [talento]);
  await db.query("insert into help_requests(user_id,canal,motivo) values($1,'boton','Necesito ayuda')", [talento]);
  return { db, curador, admin, gestor, talento, empresa };
}

describe("segundo factor del equipo", () => {
  it("sin segundo factor, curaduría y administración no tienen permisos del equipo", async () => {
    const s = await escenario();
    for (const u of [s.curador, s.admin]) {
      const sin = await sesion(s.db, u, "aal1", "select public.es_equipo() as equipo, public.mi_rol() as rol");
      expect(sin.rows[0]).toEqual({ equipo: false, rol: null });
      expect((await sesion(s.db, u, "aal1", "select * from help_requests")).rows).toHaveLength(0);
      expect((await sesion(s.db, u, "aal1", "select * from talent_profiles")).rows).toHaveLength(0);
      await expect(sesion(s.db, u, "aal1", "select public.resumen_equipo()")).rejects.toThrow(/Solo el equipo/);
      const con = await sesion(s.db, u, "aal2", "select public.es_equipo() as equipo");
      expect(con.rows[0].equipo).toBe(true);
      expect((await sesion(s.db, u, "aal2", "select * from talent_profiles")).rows).toHaveLength(1);
      expect((await sesion(s.db, u, "aal2", "select * from help_requests")).rows).toHaveLength(1);
    }
    await s.db.close();
  });

  it("sin segundo factor, administración no puede cambiar roles ni umbrales", async () => {
    const s = await escenario();
    const roles = await sesion(s.db, s.admin, "aal1", "update user_roles set rol='admin' where user_id=$1", [s.talento]);
    expect(roles.affectedRows).toBe(0);
    const umbral = await sesion(s.db, s.admin, "aal1", "update parametros_trabajo_digno set valor=1 where clave='salario_minimo_mensual'");
    expect(umbral.affectedRows).toBe(0);
    await s.db.close();
  });

  it("el rol registrado sirve para dirigir a la entrada, y talento, empresa y gestor no cambian", async () => {
    const s = await escenario();
    expect((await sesion(s.db, s.curador, "aal1", "select public.mi_rol_registrado() as r")).rows[0].r).toBe("curador");
    expect((await sesion(s.db, s.curador, "aal1", "select rol from user_roles")).rows).toEqual([{ rol: "curador" }]);
    for (const [u, rol] of [
      [s.talento, "talento"],
      [s.empresa, "empresa"],
      [s.gestor, "gestor"],
    ] as const)
      expect((await sesion(s.db, u, "aal1", "select public.mi_rol() as r")).rows[0].r).toBe(rol);
    await s.db.close();
  });
});

describe("resumen del panel de inicio", () => {
  it("da cifras y actividad del equipo sin datos de personas del talento", async () => {
    const s = await escenario();
    const compania = (
      await s.db.query<{ id: string }>(
        "insert into companies(owner_id,nombre,verificada_en,verificada_por) values($1,'Ferretería El Roble',now(),$2) returning id",
        [s.empresa, s.curador],
      )
    ).rows[0].id;
    await s.db.query(
      `insert into needs(company_id,problema,jornada_horas,remuneracion,remuneracion_unidad,condiciones)
       values($1,'Ordenar el inventario de la bodega antes del cierre',20,20000,'hora','Descansos cada dos horas. Acompaña la jefa de bodega.')`,
      [compania],
    );

    const r = (await sesion(s.db, s.curador, "aal2", "select public.resumen_equipo() as r")).rows[0].r as Record<string, unknown>;
    expect(r).toMatchObject({
      ayuda: { abiertas: 1 },
      bienestar: { abiertos: 0, vencidos: 0 },
      personas_nuevas: 1,
      personas_publicadas: 1,
      organizaciones_verificadas: 1,
      semaforo: { amarillo: 1, verde: 0, rojo: 0 },
    });
    expect(r.actividad).toEqual([
      expect.objectContaining({ tipo: "organizacion_verificada", organizacion: "Ferretería El Roble", quien: "Ana" }),
    ]);
    const texto = JSON.stringify(r);
    expect(texto).not.toMatch(/Rosa|Pérez|Necesito ayuda/);

    for (const u of [s.talento, s.empresa, s.gestor])
      await expect(sesion(s.db, u, "aal2", "select public.resumen_equipo()")).rejects.toThrow(/Solo el equipo/);
    await s.db.close();
  });
});
