import { afterEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario } from "./base";
// Filas de PGlite en las pruebas: columnas libres, como las devuelve SQL.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fila = Record<string, any>;

const bases: PGlite[] = [];
afterEach(async () => { for (const db of bases.splice(0)) await db.close(); });
async function base(storage = false) {
  const db = await crearBase({ storage }); bases.push(db); return db;
}
async function real(db: PGlite, usuario: string | null, sql: string, args: unknown[] = [], aal = "aal2") {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${usuario ? "authenticated" : "anon"}`);
    await tx.query<Fila>("select set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [usuario ?? "", JSON.stringify({ aal })]);
    return tx.query<Fila>(sql, args);
  });
}
async function organizacion(db: PGlite) {
  const usuario = await crearUsuario(db, "empresa");
  const empresa = (await real(db, usuario, "insert into companies(owner_id,nombre) values($1,'Organización de prueba') returning id", [usuario])).rows[0].id as string;
  return { usuario, empresa };
}

describe("segunda revisión: funciones privadas y segundo factor", () => {
  it("solo lectura no escribe por tablas ni RPC; otra organización no ve ni modifica estos registros", async () => {
    const db=await base();const e=await organizacion(db);const ajena=await organizacion(db);
    await db.query<Fila>("update companies set verificada_en=now() where id=$1",[e.empresa]);
    const t=await crearUsuario(db,'talento');
    const p=(await db.query<Fila>("insert into talent_profiles(user_id,nombre,estado) values($1,'Persona','publicado') returning id",[t])).rows[0].id;
    const reto=(await real(db,e.usuario,"insert into needs(company_id,problema) values($1,'Ordenar inventario de una bodega') returning id",[e.empresa])).rows[0].id;
    const req=(await real(db,e.usuario,"insert into need_requirements(need_id,capa,etiqueta) values($1,'oficio','Inventarios') returning id",[reto])).rows[0].id;
    const conexion=(await real(db,e.usuario,"select pedir_conexion($1) as id",[p])).rows[0].id;
    const exp=(await db.query<Fila>("select id from experiences limit 1")).rows[0].id;
    const lector=await crearUsuario(db,'empresa');
    await db.query<Fila>("update auth.users set email='lector@prueba.co',email_confirmed_at=now() where id=$1",[lector]);
    await real(db,e.usuario,"select invitar_a_mi_empresa('lector@prueba.co','lectura')");
    await real(db,lector,"select aceptar_invitacion()");
    const escrituras:[string,unknown[]][]=[
      ["insert into needs(company_id,problema) values($1,'Otra actividad para publicar')",[e.empresa]],
      ["update needs set problema='Cambio de condiciones de la actividad' where id=$1",[reto]],
      ["delete from needs where id=$1",[reto]],
      ["delete from need_requirements where id=$1",[req]],
      ["update connections set actualizado_en=now() where id=$1",[conexion]],
      ["select pedir_conexion($1)",[p]],
      ["insert into experience_requests(experience_id,company_id,formato,personas,mes) values($1,$2,'sede',10,'2026-12')",[exp,e.empresa]],
    ];
    for(const [sql,args] of escrituras) await real(db,lector,sql,args).then(
      r=>{expect(sql.startsWith('select')).toBe(false);expect(r.affectedRows).toBe(0);},
      error=>expect((error as Error).message).toMatch(/solo lectura/),
    );
    await expect(real(db,lector,"select invitar_a_mi_empresa('intruso@prueba.co','admin')")).rejects.toThrow(/Solo administración/);
    for(const tabla of ['needs','need_requirements','connections','experience_requests','company_invitations'])
      expect((await real(db,ajena.usuario,`select * from ${tabla}`)).rows).toHaveLength(0);
    expect((await real(db,ajena.usuario,"update needs set problema='Intento de cambio desde otra organización' where id=$1",[reto])).affectedRows).toBe(0);
    await expect(real(db,ajena.usuario,"select avanzar_proceso($1,'no_seguir')",[conexion])).rejects.toThrow();
  });
  it("S08: cambiar owner_id no entrega acceso a una cuenta ajena a los miembros", async () => {
    const db=await base(); const e=await organizacion(db); const ajena=await crearUsuario(db,'empresa');
    await expect(real(db,e.usuario,"update companies set owner_id=$1 where id=$2",[ajena,e.empresa])).rejects.toThrow(/propietari|titular/);
    expect((await real(db,ajena,"select * from companies")).rows).toHaveLength(0);
  });
  it("S01: los reportes no se consultan por la función ni por el evaluador del semáforo", async () => {
    const db = await base();
    const t = await crearUsuario(db, "talento"); const e = await organizacion(db);
    for (const usuario of [null, t, e.usuario]) {
      await expect(real(db, usuario, "select organizacion_con_reportes($1)", [e.empresa])).rejects.toThrow(/permission denied/);
      if (usuario) await expect(real(db, usuario, "select * from evaluar_trabajo('Trabajo',50000,'hora',10,$1)", [e.empresa])).rejects.toThrow(/permission denied/);
    }
  });

  it("S02: una invitación a administración exige correo confirmado, también al llamar RPC directamente", async () => {
    const db = await base(); const e = await organizacion(db);
    await real(db, e.usuario, "select invitar_a_mi_empresa('invitada@prueba.co','admin')");
    const intruso = await crearUsuario(db, "empresa");
    await db.query<Fila>("update auth.users set email='invitada@prueba.co' where id=$1", [intruso]);
    expect((await real(db, intruso, "select aceptar_invitacion() as empresa")).rows[0].empresa).toBeNull();
    expect((await db.query<Fila>("select * from company_members where user_id=$1", [intruso])).rows).toHaveLength(0);
    await db.query<Fila>("update auth.users set email_confirmed_at=now() where id=$1", [intruso]);
    expect((await real(db, intruso, "select aceptar_invitacion() as empresa")).rows[0].empresa).toBe(e.empresa);
  });

  it("M2: un celular sin confirmar no reclama el perfil del gestor; confirmado sí", async () => {
    const db = await base(); const gestor = await crearUsuario(db, "gestor");
    const perfil = (await real(db, gestor, "insert into talent_profiles(registrado_por,nombre) values($1,'Persona en campo') returning id", [gestor])).rows[0].id;
    await real(db, gestor, "select guardar_registro_gestor($1,'3115556677','firma','firma.png')", [perfil]);
    const t = await crearUsuario(db, "talento");
    await db.query<Fila>("update auth.users set phone='573115556677' where id=$1", [t]);
    expect((await real(db, t, "select reclamar_perfil() as perfil")).rows[0].perfil).toBeNull();
    await db.query<Fila>("update auth.users set phone_confirmed_at=now() where id=$1", [t]);
    expect((await real(db, t, "select reclamar_perfil() as perfil")).rows[0].perfil).toBe(perfil);
  });

  it("el equipo sin aal2 no lee el panel, no cambia roles ni usa el rol nulo para reclamar perfiles", async () => {
    const db = await base(); const admin = await crearUsuario(db, "admin"); const t = await crearUsuario(db, "talento");
    for (const f of ["resumen_equipo()", "panel_equipo()", "casos_bienestar_equipo()"])
      await expect(real(db, admin, `select * from ${f}`, [], "aal1")).rejects.toThrow(/Solo|solo|sin permiso/);
    expect((await real(db, admin, "update user_roles set rol='admin' where user_id=$1", [t], "aal1")).affectedRows).toBe(0);
    expect((await real(db, t, "update user_roles set rol='admin' where user_id=$1", [t])).affectedRows).toBe(0);
    const gestor = await crearUsuario(db, "gestor");
    const perfil = (await db.query<Fila>("insert into talent_profiles(registrado_por,nombre) values($1,'Pendiente') returning id", [gestor])).rows[0].id;
    await real(db, gestor, "select guardar_registro_gestor($1,'3115556677','firma','firma.png')", [perfil]);
    await db.query<Fila>("update auth.users set phone='573115556677', phone_confirmed_at=now() where id=$1", [admin]);
    expect((await real(db, admin, "select reclamar_perfil() as perfil", [], "aal1")).rows[0].perfil).toBeNull();
  });

  it("S03: las preferencias de pago son solo de su titular, incluso frente al equipo con aal2", async () => {
    const db = await base(); const t = await crearUsuario(db, "talento"); const otro = await crearUsuario(db, "talento");
    const e = await organizacion(db); const curador = await crearUsuario(db, "curador"); const admin = await crearUsuario(db, "admin");
    const perfil = (await db.query<Fila>("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id", [t])).rows[0].id;
    await real(db, t, "insert into talent_payout_preferences(talent_id,metodo,celular) values($1,'nequi','3001234567')", [perfil]);
    for (const u of [otro,e.usuario,curador,admin]) {
      expect((await real(db, u, "select * from talent_payout_preferences")).rows).toHaveLength(0);
      expect((await real(db, u, "update talent_payout_preferences set celular='3000000000'")).affectedRows).toBe(0);
    }
    expect((await real(db, t, "select celular from talent_payout_preferences")).rows).toEqual([{celular:"3001234567"}]);
    const columnas = (await db.query<{column_name:string}>("select column_name from information_schema.columns where table_name='talent_payout_preferences'")).rows.map(x=>x.column_name);
    expect(columnas.sort()).toEqual(["actualizado_en","celular","metodo","talent_id"]);
    await expect(real(db,t,"update talent_payout_preferences set metodo='banco',celular='3001234567'")).rejects.toThrow();
  });
});

describe("segunda revisión: integridad y retención", () => {
  it("una revisión vigente aprueba la evidencia y los cambios de contenido invalidan la versión", async()=>{
    const db=await base();const t=await crearUsuario(db,'talento');const curador=await crearUsuario(db,'curador');
    const p=(await db.query<Fila>("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id",[t])).rows[0].id;
    const ev=(await real(db,t,"insert into evidence(talent_id,tipo,descripcion,archivo_path) values($1,'archivo','Trabajo en el taller',$2) returning id,revision",[p,`${p}/foto.jpg`])).rows[0];
    await expect(real(db,t,"select revisar_evidencia($1,'verificada','Confirmó su trabajo',$2)",[ev.id,ev.revision])).rejects.toThrow(/solo el equipo/);
    await real(db,t,"update evidence set descripcion='Un trabajo distinto',revision=$2 where id=$1",[ev.id,ev.revision]);
    const actual=(await real(db,t,"select revision from evidence where id=$1",[ev.id])).rows[0].revision;
    expect(actual).not.toBe(ev.revision);
    await expect(real(db,curador,"select revisar_evidencia($1,'verificada','Confirmó su trabajo',$2)",[ev.id,ev.revision])).rejects.toThrow(/cambió/);
    await real(db,curador,"select revisar_evidencia($1,'verificada','Confirmó su trabajo',$2)",[ev.id,actual]);
    expect((await db.query<Fila>("select estado from evidence where id=$1",[ev.id])).rows[0].estado).toBe('verificada');
    const tag=(await real(db,t,"insert into footprint_tags(talent_id,capa,etiqueta,confirmada) values($1,'oficio','Tejido a mano',true) returning id",[p])).rows[0].id;
    await real(db,curador,"select revisar_etiqueta($1,'sumar','Tejido a mano','oficio')",[tag]);
    expect((await db.query<Fila>("select aprobada_en is not null as aprobada,taxonomy_id is not null as canonica from footprint_tags where id=$1",[tag])).rows[0]).toEqual({aprobada:true,canonica:true});
  });
  it("A2 ampliado: no se puede borrar y sustituir el objeto de una evidencia verificada", async () => {
    const db = await base(true); const t = await crearUsuario(db, "talento");
    const p = (await db.query<Fila>("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id", [t])).rows[0].id;
    const ruta = `${p}/certificado.pdf`;
    await real(db,t,"insert into storage.objects(bucket_id,name) values('evidencias',$1)",[ruta]);
    await db.query<Fila>("insert into evidence(talent_id,tipo,archivo_path,estado) values($1,'archivo',$2,'verificada')",[p,ruta]);
    expect((await real(db,t,"delete from storage.objects where bucket_id='evidencias' and name=$1",[ruta])).affectedRows).toBe(0);
    await expect(real(db,t,"insert into storage.objects(bucket_id,name) values('evidencias',$1)",[ruta])).rejects.toThrow();
    const pendiente = `${p}/pendiente.pdf`;
    await real(db,t,"insert into storage.objects(bucket_id,name) values('evidencias',$1)",[pendiente]);
    expect((await real(db,t,"delete from storage.objects where name=$1",[pendiente])).affectedRows).toBe(1);
  });

  it("S04: conserva invitaciones recién vencidas o canceladas aunque se crearan hace mucho", async () => {
    const db = await base(); const e = await organizacion(db);
    await db.query<Fila>(`insert into company_invitations(company_id,correo,rol,creado_en,vence_en,cancelada_en) values
      ($1,'reciente@prueba.co','lectura',now()-interval '31 days',now()-interval '24 days',null),
      ($1,'cancelada@prueba.co','lectura',now()-interval '60 days',now()+interval '1 day',now()),
      ($1,'vieja@prueba.co','lectura',now()-interval '60 days',now()-interval '53 days',null)`,[e.empresa]);
    await db.query<Fila>("select limpiar_datos_vencidos()");
    expect((await db.query<Fila>("select correo from company_invitations order by correo")).rows).toEqual([{correo:'cancelada@prueba.co'},{correo:'reciente@prueba.co'}]);
    for (const u of [e.usuario,await crearUsuario(db,'admin')])
      await expect(real(db,u,"select limpiar_datos_vencidos()")).rejects.toThrow(/permission denied/);
  });

  it("S04: no borra una ayuda antigua que el equipo acaba de cerrar ni un aviso recién enviado", async () => {
    const db=await base(); const t=await crearUsuario(db,'talento'); const curador=await crearUsuario(db,'curador');
    const p=(await db.query<Fila>("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id",[t])).rows[0].id;
    const ayuda=(await db.query<Fila>("insert into help_requests(user_id,canal,motivo,creado_en) values($1,'boton','Pendiente antigua',now()-interval '2 years') returning id",[t])).rows[0].id;
    await real(db,curador,"update help_requests set estado='cerrada' where id=$1",[ayuda]);
    await db.query<Fila>("insert into notifications(talent_id,canal,plantilla,estado,creado_en,enviado_en) values($1,'sms','prueba','enviado',now()-interval '100 days',now())",[p]);
    await db.query<Fila>("select limpiar_datos_vencidos()");
    expect((await db.query<Fila>("select id from help_requests where id=$1",[ayuda])).rows).toHaveLength(1);
    expect((await db.query<Fila>("select id from notifications where talent_id=$1",[p])).rows).toHaveLength(1);
  });

  it("S04: borra operaciones realmente vencidas y no permite anticipar el cierre desde la API",async()=>{
    const db=await base();const t=await crearUsuario(db,'talento');const curador=await crearUsuario(db,'curador');
    const p=(await db.query<Fila>("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id",[t])).rows[0].id;
    const ayuda=(await db.query<Fila>("insert into help_requests(user_id,canal,motivo) values($1,'boton','Ayuda real') returning id",[t])).rows[0].id;
    await real(db,curador,"update help_requests set estado='cerrada',cerrada_en=now()-interval '3 years' where id=$1",[ayuda]);
    expect((await db.query<Fila>("select cerrada_en>now()-interval '1 minute' as reciente from help_requests where id=$1",[ayuda])).rows[0].reciente).toBe(true);
    await db.query<Fila>("update help_requests set cerrada_en=now()-interval '2 years' where id=$1",[ayuda]);
    await db.query<Fila>("insert into notifications(talent_id,canal,plantilla,estado,finalizada_en) values($1,'sms','vencida','fallido',now()-interval '91 days')",[p]);
    const r=(await db.query<Fila>("select limpiar_datos_vencidos() as r")).rows[0].r as Record<string,number>;
    expect(r.ayudas).toBe(1);expect(r.avisos).toBe(1);
    expect((await db.query<Fila>("select id from talent_profiles where id=$1",[p])).rows).toHaveLength(1);
  });
});
