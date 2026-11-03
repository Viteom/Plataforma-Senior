import { afterEach, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { crearBase, crearUsuario } from "./base";
const cliente=vi.hoisted(()=>({crear:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({crearClienteServidor:()=>cliente.crear()}));
vi.mock("@/lib/demo",()=>({MODO_DEMO:false}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import { revisarEtiqueta, revisarEvidencia } from "@/app/equipo/(panel)/acciones";
let db:PGlite;
afterEach(async()=>{await db?.close();});

it("A2: la acción no verifica una evidencia cambiada después de verla el equipo",async()=>{
  db=await crearBase();const t=await crearUsuario(db,'talento');const curador=await crearUsuario(db,'curador');
  const p=(await db.query("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id",[t])).rows[0].id;
  const e=(await db.query("insert into evidence(talent_id,tipo,descripcion,archivo_path) values($1,'archivo','Trabajo en el taller',$2) returning *",[p,`${p}/trabajo.pdf`])).rows[0];
  await db.query("update evidence set descripcion='Tengo 62 años' where id=$1",[e.id]);
  async function ejecutar(sql:string,args:unknown[]) {return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[curador]);return tx.query(sql,args);});}
  cliente.crear.mockReturnValue({auth:{getUser:async()=>({data:{user:{id:curador}}})},
    from:()=>({update:(c:{estado:string;nota_equipo:string})=>({eq:async()=>{await ejecutar("update evidence set estado=$2,nota_equipo=$3 where id=$1",[e.id,c.estado,c.nota_equipo]);return {error:null};}})}),
    rpc:async(_n:string,d:Record<string,unknown>)=>{try{await ejecutar("select revisar_evidencia($1,$2,$3,$4)",[d.evidencia_id,d.decision,d.nota,d.revision_esperada]);return {error:null};}catch(e){return {error:{message:(e as Error).message}};}},
  });
  const datos=new FormData();datos.set('id',String(e.id));datos.set('decision','verificada');datos.set('nota','Confirmó su trabajo');datos.set('revision',String(e.revision??crypto.randomUUID()));
  const resultado=await revisarEvidencia({},datos);
  expect(resultado.error).toBeTruthy();
  expect((await db.query("select estado from evidence where id=$1",[e.id])).rows[0].estado).toBe('pendiente');
});

it("M3: la acción nunca aprueba un texto distinto al que se revisó en pantalla",async()=>{
  db=await crearBase(); const persona=await crearUsuario(db,'talento'); const equipo=await crearUsuario(db,'curador');
  const p=(await db.query("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id",[persona])).rows[0].id;
  const id=(await db.query("insert into footprint_tags(talent_id,capa,etiqueta,confirmada) values($1,'oficio','Tejido a mano',true) returning id",[p])).rows[0].id;
  async function como(u:string,sql:string,args:unknown[]=[]) {return db.transaction(async tx=>{await tx.exec("set local role authenticated");await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[u]);return tx.query(sql,args);});}
  const cambiar=()=>como(persona,"update footprint_tags set etiqueta='Tengo 62 años, llama al 3001234567' where id=$1",[id]);
  cliente.crear.mockReturnValue({
    auth:{getUser:async()=>({data:{user:{id:equipo}}})},
    from:()=>({
      select:()=>({eq:()=>({maybeSingle:async()=>{
        const fila=(await como(equipo,"select capa,etiqueta from footprint_tags where id=$1",[id])).rows[0];
        await cambiar(); return {data:fila};
      }})}),
      update:(datos:{aprobada_en:string})=>({eq:async()=>{await como(equipo,"update footprint_tags set aprobada_en=$2 where id=$1",[id,datos.aprobada_en]);return {error:null};}}),
    }),
    rpc:async(nombre:string,datos:Record<string,unknown>)=>{
      if(nombre==='mi_rol') return {data:'curador',error:null};
      await cambiar();
      try { await como(equipo,"select revisar_etiqueta($1,$2,$3,$4)",[datos.etiqueta_id,datos.decision,datos.etiqueta_esperada,datos.capa_esperada]);return {error:null}; }
      catch(e) { return {error:{message:(e as Error).message}}; }
    },
  });
  const datos=new FormData(); datos.set('id',String(id));datos.set('decision','aprobar');datos.set('etiqueta','Tejido a mano');datos.set('capa','oficio');
  const resultado=await revisarEtiqueta({},datos);
  expect(resultado.error).toBeTruthy();
  expect((await db.query("select aprobada_en from footprint_tags where id=$1",[id])).rows[0].aprobada_en).toBeNull();
});

it("M3: normaliza también los textos suplantados que existían antes del trigger de etiquetas",async()=>{
  db=new PGlite(); const raiz=join(__dirname,'../../supabase');
  await db.exec(readFileSync(join(raiz,'tests/stub-supabase.sql'),'utf8'));
  let etiqueta:unknown; let texto:unknown;
  for(const nombre of readdirSync(join(raiz,'migrations')).filter(f=>f.endsWith('.sql')).sort()) {
    if(nombre==='20261025000002_huella_inclusiva.sql') {
      const t=await crearUsuario(db,'talento');const p=(await db.query("insert into talent_profiles(user_id,nombre) values($1,'Persona') returning id",[t])).rows[0].id;
      const tax=(await db.query("select id,capa,etiqueta from taxonomy limit 1")).rows[0];texto=tax.etiqueta;
      etiqueta=(await db.query("insert into footprint_tags(talent_id,capa,etiqueta,taxonomy_id,confirmada) values($1,$2,'Tengo 62 años',$3,true) returning id",[p,tax.capa,tax.id])).rows[0].id;
    }
    await db.exec(readFileSync(join(raiz,'migrations',nombre),'utf8'));
  }
  expect((await db.query("select etiqueta from footprint_tags where id=$1",[etiqueta])).rows[0].etiqueta).toBe(texto);
});
