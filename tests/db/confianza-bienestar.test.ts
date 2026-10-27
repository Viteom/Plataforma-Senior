import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario, como } from "./base";
async function real(db: PGlite, u: string, sql: string, args: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [u]);
    return tx.query<Record<string, unknown>>(sql, args);
  });
}
async function escenario() {
  const db = await crearBase();
  const talento = await crearUsuario(db, "talento"),
    empresa = await crearUsuario(db, "empresa"),
    curador = await crearUsuario(db, "curador");
  const perfil = (
    await db.query<{ id: string }>(
      "insert into talent_profiles(user_id,nombre,estado) values($1,'Persona','publicado') returning id",
      [talento],
    )
  ).rows[0].id;
  await db.query(
    "insert into companies(owner_id,nombre,verificada_en) values($1,'Organización',now())",
    [empresa],
  );
  return { db, talento, empresa, curador, perfil };
}
async function acuerdo(s: Awaited<ReturnType<typeof escenario>>, horas = 15) {
  const { db, talento, empresa, curador, perfil } = s;
  const id = (
    await real(db, empresa, "select pedir_conexion($1) as id", [perfil])
  ).rows[0].id as string;
  await real(db, talento, "select actuar_conexion($1,'me_interesa')", [id]);
  await real(db, empresa, "select avanzar_proceso($1,'agendar',$2)", [
    id,
    JSON.stringify({
      fecha: new Date(Date.now() + 86400000).toISOString(),
      modo: "llamada",
    }),
  ]);
  await real(db, empresa, "select avanzar_proceso($1,'proponer_acuerdo',$2)", [
    id,
    JSON.stringify({
      forma: "proyecto",
      horas,
      valor: 500000,
      unidad: "proyecto",
    }),
  ]);
  await real(db, curador, "select autorizar_acuerdo($1,1)", [id]);
  return id;
}
async function carga(s: Awaited<ReturnType<typeof escenario>>, id: string) {
  return (
    await real(s.db, s.talento, "select previsualizar_carga($1,1) as carga", [
      id,
    ])
  ).rows[0].carga as {
    token: string;
    total: number;
    requiere_confirmacion: boolean;
  };
}
describe("privacidad y carga antes de aceptar", () => {
  it("la base rechaza una ruta de foto ajena o no canónica", async () => {
    const s = await escenario();
    for (const path of [
      `${crypto.randomUUID()}/foto.jpg`,
      `${s.perfil}/../foto.jpg`,
      `${s.perfil}/%2e%2e.jpg`,
      "foto.jpg",
    ])
      await expect(
        real(
          s.db,
          s.talento,
          "update talent_profiles set foto_path=$2 where id=$1",
          [s.perfil, path],
        ),
      ).rejects.toThrow(/foto_del_perfil/);
    await real(
      s.db,
      s.talento,
      "update talent_profiles set foto_path=$2 where id=$1",
      [s.perfil, `${s.perfil}/foto.jpg`],
    );
    await s.db.close();
  });
  it("aceptar sobre el límite exige revisar una carga vigente, pero permite decidir continuar", async () => {
    const s = await escenario();
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_preferences(talent_id,horas_meta) values($1,10)",
      [s.perfil],
    );
    const id = await acuerdo(s, 40);
    const vista = await carga(s, id);
    expect(vista.total).toBe(40);
    expect(vista.requiere_confirmacion).toBe(true);
    await expect(
      real(
        s.db,
        s.talento,
        "select avanzar_proceso($1,'aceptar_acuerdo','{\"version\":1}')",
        [id],
      ),
    ).rejects.toThrow(/carga/);
    await expect(
      real(
        s.db,
        s.talento,
        "select avanzar_proceso_interno($1,'aceptar_acuerdo','{\"version\":1}')",
        [id],
      ),
    ).rejects.toThrow(/permission denied/);
    await real(
      s.db,
      s.talento,
      "select avanzar_proceso($1,'aceptar_acuerdo',$2)",
      [
        id,
        JSON.stringify({
          version: 1,
          carga_token: vista.token,
          confirmar_carga: true,
        }),
      ],
    );
    expect(
      (
        await s.db.query<{ estado: string }>(
          "select estado from connections where id=$1",
          [id],
        )
      ).rows[0].estado,
    ).toBe("en_curso");
    await s.db.close();
  });
  it("si cambia la meta, la confirmación anterior no sirve; la empresa no ve la carga", async () => {
    const s = await escenario();
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_preferences(talent_id,horas_meta) values($1,10)",
      [s.perfil],
    );
    const id = await acuerdo(s, 20);
    const vista = await carga(s, id);
    await real(
      s.db,
      s.talento,
      "update wellbeing_preferences set horas_meta=5 where talent_id=$1",
      [s.perfil],
    );
    await expect(
      real(s.db, s.talento, "select avanzar_proceso($1,'aceptar_acuerdo',$2)", [
        id,
        JSON.stringify({
          version: 1,
          carga_token: vista.token,
          confirmar_carga: true,
        }),
      ]),
    ).rejects.toThrow(/carga cambió/);
    await expect(
      real(s.db, s.empresa, "select previsualizar_carga($1,1)", [id]),
    ).rejects.toThrow(/sin permiso/);
    await s.db.close();
  });
  it("autorizar una versión crea un solo aviso nuevo sin datos personales", async () => {
    const s = await escenario();
    const id = await acuerdo(s);
    await real(s.db, s.curador, "select autorizar_acuerdo($1,1)", [id]);
    const r = await s.db.query<{ plantilla: string }>(
      "select plantilla from notifications where connection_id=$1 and plantilla='acuerdo_autorizado'",
      [id],
    );
    expect(r.rows).toHaveLength(1);
    await s.db.close();
  });
});
describe("revisión privada y consentimiento de contacto", () => {
  it("una señal preocupante sin permiso crea caso, pero no una solicitud de llamada", async () => {
    const s = await escenario();
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_preferences(talent_id,horas_meta) values($1,10)",
      [s.perfil],
    );
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_checkins(talent_id,energia,trato_respetuoso,pago_a_tiempo,quiere_contacto) values($1,'pausa',false,false,false)",
      [s.perfil],
    );
    const casos = await s.db.query<{
      id: string;
      permite_contacto: boolean;
      prioridad: string;
    }>("select * from wellbeing_cases");
    expect(casos.rows).toHaveLength(1);
    expect(casos.rows[0]).toMatchObject({
      permite_contacto: false,
      prioridad: "preferente",
    });
    expect((await s.db.query("select * from help_requests")).rows).toHaveLength(
      0,
    );
    expect(
      (
        await como(s.db, s.empresa, (tx) =>
          tx.query("select * from wellbeing_cases"),
        )
      ).rows,
    ).toHaveLength(0);
    await real(s.db, s.curador, "select gestionar_caso_bienestar($1,'tomar')", [
      casos.rows[0].id,
    ]);
    const otro = await crearUsuario(s.db, "curador");
    await expect(
      real(s.db, otro, "select gestionar_caso_bienestar($1,'cerrar')", [
        casos.rows[0].id,
      ]),
    ).rejects.toThrow();
    await real(
      s.db,
      s.curador,
      "select gestionar_caso_bienestar($1,'cerrar')",
      [casos.rows[0].id],
    );
    const propios = await real(
      s.db,
      s.talento,
      "select estado from wellbeing_cases",
    );
    expect(propios.rows[0].estado).toBe("cerrado");
    await s.db.close();
  });
  it("con permiso se vincula una ayuda al caso; una respuesta sin señales ni pedido no abre caso", async () => {
    const s = await escenario();
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_preferences(talent_id,horas_meta) values($1,10)",
      [s.perfil],
    );
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_checkins(talent_id,energia,trato_respetuoso,quiere_contacto) values($1,'bien',true,false)",
      [s.perfil],
    );
    expect(
      (await s.db.query("select * from wellbeing_cases")).rows,
    ).toHaveLength(0);
    await real(
      s.db,
      s.talento,
      "insert into wellbeing_checkins(talent_id,energia,trato_respetuoso,quiere_contacto) values($1,'bien',true,true)",
      [s.perfil],
    );
    expect(
      (
        await s.db.query(
          "select * from help_requests where wellbeing_case_id is not null",
        )
      ).rows,
    ).toHaveLength(1);
    await s.db.close();
  });
});

it("dos propuestas que cabían por separado no se aceptan con una carga desactualizada", async () => {
  const s = await escenario();
  await real(
    s.db,
    s.talento,
    "insert into wellbeing_preferences(talent_id,horas_meta) values($1,20)",
    [s.perfil],
  );
  const primero = await acuerdo(s, 15);
  const otraEmpresa = await crearUsuario(s.db, "empresa");
  await s.db.query(
    "insert into companies(owner_id,nombre,verificada_en) values($1,'Otra organización',now())",
    [otraEmpresa],
  );
  const segundo = await acuerdo({ ...s, empresa: otraEmpresa }, 15);
  const anterior = await carga(s, segundo);
  expect(anterior.requiere_confirmacion).toBe(false);
  await real(
    s.db,
    s.talento,
    "select avanzar_proceso($1,'aceptar_acuerdo','{\"version\":1}')",
    [primero],
  );
  await expect(
    real(s.db, s.talento, "select avanzar_proceso($1,'aceptar_acuerdo',$2)", [
      segundo,
      JSON.stringify({
        version: 1,
        carga_token: anterior.token,
        confirmar_carga: true,
      }),
    ]),
  ).rejects.toThrow(/carga cambió/);
  const actual = await carga(s, segundo);
  expect(actual.total).toBe(30);
  expect(actual.requiere_confirmacion).toBe(true);
  await real(
    s.db,
    s.talento,
    "select avanzar_proceso($1,'aceptar_acuerdo',$2)",
    [
      segundo,
      JSON.stringify({
        version: 1,
        carga_token: actual.token,
        confirmar_carga: true,
      }),
    ],
  );
  await s.db.close();
});

it("la migración conserva la foto propia y limpia una referencia histórica ajena", async () => {
  const db = new PGlite();
  const root = join(__dirname, "..", "..", "supabase");
  await db.exec(readFileSync(join(root, "tests/stub-supabase.sql"), "utf8"));
  const migraciones = readdirSync(join(root, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of migraciones.filter((f) => f < "20261031000004"))
    await db.exec(readFileSync(join(root, "migrations", f), "utf8"));
  const propietario = await crearUsuario(db, "talento"),
    otro = await crearUsuario(db, "talento");
  const a = crypto.randomUUID(),
    b = crypto.randomUUID();
  await db.query(
    "insert into talent_profiles(id,user_id,nombre,foto_path) values($1,$2,'Persona A',$5),($3,$4,'Persona B',$5)",
    [a, propietario, b, otro, `${a}/foto.jpg`],
  );
  await db.exec(
    readFileSync(
      join(root, "migrations/20261031000004_fotos_privadas.sql"),
      "utf8",
    ),
  );
  expect(
    (
      await db.query<{ foto_path: string }>(
        "select foto_path from talent_profiles where id=$1",
        [a],
      )
    ).rows[0].foto_path,
  ).toBe(`${a}/foto.jpg`);
  expect(
    (
      await db.query<{ foto_path: string | null }>(
        "select foto_path from talent_profiles where id=$1",
        [b],
      )
    ).rows[0].foto_path,
  ).toBeNull();
  await db.close();
});
