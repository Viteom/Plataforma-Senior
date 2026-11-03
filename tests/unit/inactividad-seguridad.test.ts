import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const auth=vi.hoisted(()=>({signOut:vi.fn(async()=>({error:null})),getClaims:vi.fn(async()=>({data:{claims:{sub:"usuario",aal:"aal2",session_id:"sesion"}}}))}));
vi.mock("@/lib/supabase/config",()=>({supabaseConfigurado:true,SUPABASE_URL:"https://prueba.supabase.co",SUPABASE_ANON_KEY:"publica"}));
vi.mock("@supabase/ssr",()=>({createServerClient:()=>({auth,from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{rol:"admin"}})})})})})}));
import { middleware } from "../../middleware";
import { crearActividad, actividadVigente } from "@/lib/auth/inactividad";
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});

it("S07: una marca de actividad inventada no reabre la sesión del equipo",async()=>{
  vi.stubEnv("EQUIPO_SESSION_SECRET","secreto-de-prueba-con-mas-de-32-caracteres");
  const r=await middleware(new NextRequest('https://kanna.test/equipo',{headers:{cookie:`kanna_equipo_actividad=${Date.now()}`}}));
  expect(r.status).toBe(307);
  expect(auth.signOut).toHaveBeenCalledOnce();
});

it("S07: pasar por /entrar no renueva una sesión que ya venció por inactividad",async()=>{
  vi.stubEnv("EQUIPO_SESSION_SECRET","secreto-de-prueba-con-mas-de-32-caracteres");
  const r=await middleware(new NextRequest('https://kanna.test/entrar',{headers:{cookie:`kanna_equipo_actividad=${Date.now()-31*60_000}`}}));
  expect(r.headers.get('location')).toContain('motivo=inactividad');
  expect(auth.signOut).toHaveBeenCalledOnce();
});

it("una firma vigente permite entrar y no se reutiliza en otra cuenta o sesión",async()=>{
  const secreto="secreto-de-prueba-con-mas-de-32-caracteres";
  vi.stubEnv("EQUIPO_SESSION_SECRET",secreto);
  const identidad={usuario:"usuario",sesion:"sesion"};const ahora=Date.now();
  const marca=(await crearActividad(identidad,secreto,ahora))!;
  expect(await actividadVigente(marca,identidad,secreto,ahora+29*60_000)).toBe(true);
  expect(await actividadVigente(marca,identidad,secreto,ahora+30*60_000)).toBe(false);
  expect(await actividadVigente(marca,{...identidad,usuario:"otra"},secreto,ahora)).toBe(false);
  expect(await actividadVigente(marca,{...identidad,sesion:"otra"},secreto,ahora)).toBe(false);
  expect(await actividadVigente(marca,identidad,"",ahora)).toBe(false);
  const r=await middleware(new NextRequest('https://kanna.test/equipo',{headers:{cookie:`kanna_equipo_actividad=${marca}`}}));
  expect(r.status).toBe(200);
  expect(r.headers.get('cache-control')).toContain('no-store');
});
