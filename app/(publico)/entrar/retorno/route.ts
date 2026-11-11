import { NextResponse, type NextRequest } from "next/server";

import { inicioDe, type Rol } from "@/lib/auth/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

// A donde vuelve la persona después de entrar con Google o Microsoft. Cambia el código de un solo
// uso por la sesión y sigue el mismo camino que el código de 6 números: invitaciones, rol y perfil.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const para = url.searchParams.get("para") === "empresa" ? "empresa" : "talento";
  const ir = (ruta: string) => {
    const r = NextResponse.redirect(new URL(ruta, url));
    r.headers.set("Cache-Control", "private, no-store");
    return r;
  };
  const fallo = () => ir(`/entrar?aviso=proveedor${para === "empresa" ? "&para=empresa" : ""}`);
  if (!codigo) return fallo();

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);
  if (error || !data.user) {
    console.error("[entrar] retorno del proveedor:", error?.status, error?.code, error?.message);
    return fallo();
  }

  // Si una organización invitó este correo, la cuenta queda en su equipo (y con rol de organización).
  await supabase.rpc("aceptar_invitacion");
  // Cuenta nueva desde «Entrar como empresa»: pasa a rol de organización (solo recién creada).
  if (para === "empresa") {
    const { error: errorRol } = await supabase.rpc("usar_cuenta_como_empresa");
    if (errorRol) console.error("[entrar] usar_cuenta_como_empresa:", errorRol.code, errorRol.message);
  }

  const { data: fila } = await supabase.from("user_roles").select("rol").eq("user_id", data.user.id).maybeSingle();
  const rol = (fila?.rol as Rol | undefined) ?? "talento";
  if (rol === "talento") {
    await supabase.rpc("reclamar_perfil");
    const { data: perfil } = await supabase.from("talent_profiles").select("id").eq("user_id", data.user.id).maybeSingle();
    if (!perfil) return ir("/perfil/nuevo");
  }
  return ir(inicioDe(rol));
}
