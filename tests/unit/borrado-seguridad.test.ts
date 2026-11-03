import { beforeEach, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({crear:vi.fn(),admin:vi.fn(),borrarPerfil:vi.fn(async()=>({error:null})),ayuda:vi.fn(async()=>({error:null}))}));
vi.mock("@/lib/supabase/server",()=>({crearClienteServidor:()=>mocks.crear()}));
vi.mock("@/lib/supabase/admin",()=>({crearClienteAdmin:()=>mocks.admin()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:()=>{throw Error('redirección');}}));
import { borrarCuenta } from "@/app/(talento)/mi-perfil/acciones";
import { borrarArchivosPerfil } from "@/lib/privacidad/borrar-archivos";
import type { SupabaseClient } from "@supabase/supabase-js";

beforeEach(()=>{
  vi.clearAllMocks();
  const cadena={eq:()=>cadena,not:async()=>({data:[]}),maybeSingle:async()=>({data:{id:'11111111-1111-4111-8111-111111111111',estado:'publicado'}}),single:async()=>({data:{foto_path:null}})};
  mocks.crear.mockReturnValue({auth:{getUser:async()=>({data:{user:{id:'persona'}}}),signOut:vi.fn()},
    from:()=>({select:()=>cadena,delete:()=>({eq:mocks.borrarPerfil}),insert:mocks.ayuda}),
    storage:{from:()=>({remove:async()=>({error:null})})},
  });
});

it("A2/M6: sin poder limpiar Storage no se borra el perfil ni se pierden las referencias",async()=>{
  mocks.admin.mockReturnValue(null);
  const r=await borrarCuenta();
  expect(r.error).toBeTruthy();
  expect(mocks.borrarPerfil).not.toHaveBeenCalled();
  expect(mocks.ayuda).toHaveBeenCalled();
});

it("un fallo del almacenamiento conserva el perfil para reintentar",async()=>{
  const borrarUsuario=vi.fn();
  mocks.admin.mockReturnValue({storage:{from:()=>({list:async()=>({data:null,error:{code:'fallo'}})})},auth:{admin:{deleteUser:borrarUsuario}}});
  expect((await borrarCuenta()).error).toBeTruthy();
  expect(mocks.borrarPerfil).not.toHaveBeenCalled();expect(borrarUsuario).not.toHaveBeenCalled();
});

it("limpia los cuatro buckets con paginación y subcarpetas sin tocar otra persona",async()=>{
  const perfil='11111111-1111-4111-8111-111111111111';const otro='22222222-2222-4222-8222-222222222222';
  const objetos=new Map(['evidencias','fotos','historias','autorizaciones'].map(b=>[b,new Set([...Array.from({length:105},(_,i)=>`${perfil}/archivo-${i}`),`${perfil}/subcarpeta/firma.png`,`${otro}/ajeno.png`])]));
  const storage={from:(bucket:string)=>({
    list:async(prefijo:string,{limit}:{limit:number})=>({error:null,data:Array.from(new Set([...objetos.get(bucket)!].filter(r=>r.startsWith(prefijo+'/')).map(r=>r.slice(prefijo.length+1).split('/')[0]))).slice(0,limit).map(name=>({name,id:objetos.get(bucket)!.has(`${prefijo}/${name}`)?'archivo':null}))}),
    remove:async(rutas:string[])=>{for(const ruta of rutas){expect(ruta.startsWith(perfil+'/')).toBe(true);objetos.get(bucket)!.delete(ruta);}return {error:null};},
  })};
  await borrarArchivosPerfil({storage} as unknown as SupabaseClient,perfil);
  for(const restantes of objetos.values()) expect([...restantes]).toEqual([`${otro}/ajeno.png`]);
});
