import { describe, it, expect } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario } from "./base";

// Casos de ejemplo del semáforo de trabajo digno. Si alguien cambia una regla o un umbral y un
// caso cambia de color, esta prueba falla.
// Con los valores iniciales, el mínimo por hora es 1.423.500 / (42 × 30/7) ≈ 7.908 pesos.

async function real(db: PGlite, u: string, sql: string, args: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec("set local role authenticated");
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [u]);
    return tx.query<Record<string, unknown>>(sql, args);
  });
}

const BIEN = "Descansos de 15 minutos cada dos horas. Acompaña la jefa de planta durante todo el proyecto.";

async function escenario({ conHistorial = true } = {}) {
  const db = await crearBase();
  const empresa = await crearUsuario(db, "empresa"),
    curador = await crearUsuario(db, "curador"),
    admin = await crearUsuario(db, "admin"),
    talento = await crearUsuario(db, "talento");
  const compania = (
    await db.query<{ id: string }>(
      "insert into companies(owner_id,nombre,verificada_en) values($1,'Organización',now()) returning id",
      [empresa],
    )
  ).rows[0].id;
  const perfil = (
    await db.query<{ id: string }>(
      "insert into talent_profiles(user_id,nombre,estado) values($1,'Persona','publicado') returning id",
      [talento],
    )
  ).rows[0].id;
  // Un reto ya aprobado antes: así la organización no es nueva para el semáforo.
  if (conHistorial)
    await db.query(
      `insert into needs(company_id,problema,jornada_horas,remuneracion,remuneracion_unidad,condiciones,
         dignidad_estado,dignidad_automatica,dignidad_en,semaforo)
       values($1,'Un reto anterior ya revisado por el equipo',20,20000,'hora',$2,'aprobado',true,now(),'verde')`,
      [compania, BIEN],
    );
  return { db, empresa, curador, admin, talento, compania, perfil };
}

type Reto = { problema?: string; horas?: number; valor?: number; unidad?: string; condiciones?: string };
async function contarReto(s: Awaited<ReturnType<typeof escenario>>, r: Reto = {}) {
  const fila = await real(
    s.db,
    s.empresa,
    `insert into needs(company_id,problema,jornada_horas,remuneracion,remuneracion_unidad,condiciones)
     values($1,$2,$3,$4,$5,$6) returning id`,
    [
      s.compania,
      r.problema ?? "Necesitamos ordenar la contabilidad de la planta antes del cierre del año.",
      r.horas ?? 20,
      r.valor ?? 20000,
      r.unidad ?? "hora",
      r.condiciones ?? BIEN,
    ],
  );
  const { rows } = await s.db.query<{
    id: string;
    semaforo: string;
    semaforo_motivos: string[];
    dignidad_estado: string;
    dignidad_automatica: boolean;
    en_muestra: boolean;
  }>("select id, semaforo, semaforo_motivos, dignidad_estado, dignidad_automatica, en_muestra from needs where id=$1", [
    fila.rows[0].id,
  ]);
  return rows[0];
}

describe("semáforo de retos", () => {
  it("verde: cumple todo y se aprueba solo, sin esperar al equipo", async () => {
    const s = await escenario();
    const r = await contarReto(s);
    expect(r).toMatchObject({ semaforo: "verde", dignidad_estado: "aprobado", dignidad_automatica: true });
    expect(r.semaforo_motivos).toEqual([]);
    await s.db.close();
  });

  it("rojo: pago por debajo del mínimo, por hora o por mes; vuelve a la organización con el motivo", async () => {
    const s = await escenario();
    const hora = await contarReto(s, { valor: 5000 });
    expect(hora).toMatchObject({ semaforo: "rojo", dignidad_estado: "ajustes" });
    expect(hora.semaforo_motivos.join(" ")).toMatch(/por debajo del mínimo/);
    const mes = await contarReto(s, { valor: 1000000, unidad: "mes", horas: 40 });
    expect(mes.semaforo).toBe("rojo");
    await s.db.close();
  });

  it("rojo: pedir edad, pedir dinero o no pagar", async () => {
    const s = await escenario();
    for (const problema of [
      "Buscamos jóvenes con energía para organizar el inventario de la bodega.",
      "Persona hasta 35 años para apoyar el área administrativa de la empresa.",
      "Se requiere buena presencia para atender clientes en la sede principal.",
    ])
      expect((await contarReto(s, { problema })).semaforo).toBe("rojo");
    for (const condiciones of [
      `${BIEN} Antes de empezar debes pagar la inscripción al programa.`,
      `${BIEN} Es un trabajo ad honorem para ganar experiencia.`,
      `${BIEN} El primer mes es a prueba sin pago.`,
    ])
      expect((await contarReto(s, { condiciones })).semaforo).toBe("rojo");
    await s.db.close();
  });

  it("amarillo: falta información, riesgo o jornada larga; queda para una persona del equipo", async () => {
    const s = await escenario();
    const sinDescanso = await contarReto(s, { condiciones: "Acompaña la jefa de planta durante todo el proyecto." });
    expect(sinDescanso).toMatchObject({ semaforo: "amarillo", dignidad_estado: "pendiente" });
    expect(sinDescanso.semaforo_motivos).toContain("No dice cuándo descansa la persona.");
    expect((await contarReto(s, { condiciones: `${BIEN} Incluye turnos de noche.` })).semaforo).toBe("amarillo");
    expect((await contarReto(s, { horas: 41 })).semaforo).toBe("amarillo");
    expect((await contarReto(s, { valor: 8200 })).semaforo).toBe("amarillo");
    // En un proyecto la duración real no se conoce: se revisa, no se devuelve.
    expect((await contarReto(s, { valor: 300000, unidad: "proyecto" })).semaforo).toBe("amarillo");
    await s.db.close();
  });

  it("el primer reto de una organización siempre lo revisa una persona", async () => {
    const s = await escenario({ conHistorial: false });
    const r = await contarReto(s);
    expect(r.semaforo).toBe("amarillo");
    expect(r.semaforo_motivos.join(" ")).toMatch(/primer reto/);
    await s.db.close();
  });

  it("la organización no puede marcarse en verde ni aprobarse sola", async () => {
    const s = await escenario();
    await expect(
      real(
        s.db,
        s.empresa,
        `insert into needs(company_id,problema,jornada_horas,remuneracion,remuneracion_unidad,condiciones,semaforo)
         values($1,'Un reto que intenta marcarse en verde por su cuenta',20,20000,'hora',$2,'verde')`,
        [s.compania, BIEN],
      ),
    ).rejects.toThrow(/solo Kánna/);
    await s.db.close();
  });
});

describe("parámetros y reglas editables", () => {
  it("solo administración cambia los umbrales, y el cambio se aplica a los retos nuevos", async () => {
    const s = await escenario();
    expect((await real(s.db, s.empresa, "select * from parametros_trabajo_digno")).rows).toHaveLength(0);
    const antes = await real(s.db, s.curador, "update parametros_trabajo_digno set valor=3500000 where clave='salario_minimo_mensual'");
    expect(antes.affectedRows).toBe(0);
    await real(s.db, s.admin, "update parametros_trabajo_digno set valor=3500000 where clave='salario_minimo_mensual'");
    // Con el nuevo mínimo (≈ 19.444 por hora), 20.000 por hora queda cerca del límite.
    expect((await contarReto(s)).semaforo).toBe("amarillo");
    await s.db.close();
  });

  it("una expresión mal escrita no se guarda; una nueva regla empieza a aplicar", async () => {
    const s = await escenario();
    await expect(
      real(s.db, s.admin, "insert into reglas_texto_digno(patron,color,motivo) values('(sin cerrar','rojo','Expresión rota')"),
    ).rejects.toThrow(/no es válida/);
    await real(s.db, s.admin, "insert into reglas_texto_digno(patron,color,motivo) values('uniforme propio','amarillo','Pide comprar uniforme')");
    expect((await contarReto(s, { condiciones: `${BIEN} Debe traer uniforme propio.` })).semaforo).toBe("amarillo");
    await expect(
      real(s.db, s.curador, "insert into reglas_texto_digno(patron,color,motivo) values('algo','rojo','Regla del curador')"),
    ).rejects.toThrow();
    await s.db.close();
  });

  it("una parte de los verdes va a la muestra de control y el equipo la marca como revisada", async () => {
    const s = await escenario();
    await real(s.db, s.admin, "update parametros_trabajo_digno set valor=100 where clave='muestreo_verdes_pct'");
    const r = await contarReto(s);
    expect(r).toMatchObject({ semaforo: "verde", en_muestra: true });
    await expect(real(s.db, s.empresa, "select revisar_muestra($1)", [r.id])).rejects.toThrow();
    await real(s.db, s.curador, "select revisar_muestra($1)", [r.id]);
    expect((await s.db.query("select en_muestra from needs where id=$1", [r.id])).rows[0]).toEqual({ en_muestra: false });
    await s.db.close();
  });
});

describe("semáforo de acuerdos", () => {
  async function proponer(s: Awaited<ReturnType<typeof escenario>>, valor: number, horas = 10) {
    const id = (await real(s.db, s.empresa, "select pedir_conexion($1) as id", [s.perfil])).rows[0].id as string;
    await real(s.db, s.talento, "select actuar_conexion($1,'me_interesa')", [id]);
    await real(s.db, s.empresa, "select avanzar_proceso($1,'agendar',$2)", [
      id,
      JSON.stringify({ fecha: new Date(Date.now() + 86400000).toISOString(), modo: "llamada" }),
    ]);
    await real(s.db, s.empresa, "select avanzar_proceso($1,'proponer_acuerdo',$2)", [
      id,
      JSON.stringify({ forma: "horas", horas, valor, unidad: "hora" }),
    ]);
    return id;
  }

  it("un acuerdo que cumple se aprueba solo y la persona puede aceptarlo sin esperar", async () => {
    const s = await escenario();
    const id = await proponer(s, 20000);
    const c = (await s.db.query("select acuerdo_semaforo, acuerdo_revision_automatica from connections where id=$1", [id])).rows[0];
    expect(c).toEqual({ acuerdo_semaforo: "verde", acuerdo_revision_automatica: true });
    const r = await real(s.db, s.talento, "select avanzar_proceso($1,'aceptar_acuerdo','{\"version\":1}') as estado", [id]);
    expect(r.rows[0].estado).toBe("en_curso");
    await s.db.close();
  });

  it("un acuerdo mal pagado no se puede aceptar hasta que el equipo lo revise", async () => {
    const s = await escenario();
    const id = await proponer(s, 5000);
    const c = (await s.db.query<{ acuerdo_semaforo: string; acuerdo_semaforo_motivos: string[] }>(
      "select acuerdo_semaforo, acuerdo_semaforo_motivos from connections where id=$1",
      [id],
    )).rows[0];
    expect(c.acuerdo_semaforo).toBe("rojo");
    await expect(
      real(s.db, s.talento, "select avanzar_proceso($1,'aceptar_acuerdo','{\"version\":1}')", [id]),
    ).rejects.toThrow(/revisar las condiciones/);
    await s.db.close();
  });
});
