import { beforeAll, expect, it, vi } from "vitest";
import { cerrarSesionLocal } from "@/lib/privacidad/cache";
const captura=vi.hoisted(()=>({reglas:[] as {matcher:(p:unknown)=>boolean;handler:unknown}[],eventos:new Map<string,(e:unknown)=>void>()}));
vi.mock("@serwist/next/worker",()=>({defaultCache:[{matcher:()=>true,handler:"cache"}]}));
vi.mock("serwist",()=>({NetworkOnly:class NetworkOnly {},Serwist:class {
  constructor(opciones:{runtimeCaching:typeof captura.reglas}) { captura.reglas=opciones.runtimeCaching; }
  addEventListeners() {}
}}));

beforeAll(async()=>{
  vi.stubGlobal("self",{__SW_MANIFEST:[],location:new URL("https://kanna.test"),addEventListener:(nombre:string,fn:(e:unknown)=>void)=>captura.eventos.set(nombre,fn)});
  await import("../../app/sw");
});

it.each(["/emprende","/aprende","/api/privado","/ruta-futura","/mi-perfil","/equipo/entrar"])("M5: %s nunca se sirve desde la caché del trabajador",async ruta=>{
  const {NetworkOnly}=await import("serwist");
  const url=new URL(ruta,"https://kanna.test");
  const regla=captura.reglas.find(r=>r.matcher({url,request:new Request(url),sameOrigin:true}));
  expect(regla?.handler).toBeInstanceOf(NetworkOnly);
});

it("M5: instalar la versión corregida elimina la caché privada de versiones anteriores",async()=>{
  const borrar=vi.fn(async()=>true);
  vi.stubGlobal("caches",{keys:async()=>["pages","pages-rsc","cross-origin","serwist-precache-v2"],delete:borrar});
  const promesas:Promise<unknown>[]=[];
  const activar=captura.eventos.get("activate");
  expect(activar).toBeDefined();
  activar?.({waitUntil:(p:Promise<unknown>)=>promesas.push(p)});
  await Promise.all(promesas);
  expect(borrar).toHaveBeenCalledWith("pages");
  expect(borrar).toHaveBeenCalledWith("pages-rsc");
  expect(borrar).toHaveBeenCalledWith("cross-origin");
});

it("M5: al salir se eliminan las respuestas cacheadas antes de cerrar la sesión",async()=>{
  const orden:string[]=[];
  vi.stubGlobal('window',{speechSynthesis:{cancel:()=>orden.push('voz detenida')}});
  vi.stubGlobal('caches',{keys:async()=>['pages-rsc'],delete:async()=>{orden.push('caché borrada');return true;}});
  await cerrarSesionLocal(async()=>{orden.push('sesión cerrada');});
  expect(orden).toEqual(['caché borrada','voz detenida','sesión cerrada']);
});

it("un fallo al limpiar la caché no impide salir de Auth",async()=>{
  vi.stubGlobal('caches',{keys:async()=>{throw Error('no disponible');}});
  const salir=vi.fn(async()=>{});
  await cerrarSesionLocal(salir);
  expect(salir).toHaveBeenCalledOnce();
});
