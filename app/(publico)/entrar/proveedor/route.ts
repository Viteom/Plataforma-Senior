import { NextResponse, type NextRequest } from "next/server";

import { esProveedor, PROVEEDOR_SUPABASE, proveedoresActivos } from "@/lib/auth/proveedores";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

// «Continuar con Google» o «con Microsoft»: pide a Supabase la dirección del proveedor y lleva
// allá a la persona. Es un enlace y no un formulario porque la política de contenido solo deja
// enviar formularios a Kánna. En la dirección va solo el proveedor y si es talento u organización.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const proveedor = url.searchParams.get("p");
  const para = url.searchParams.get("para") === "empresa" ? "empresa" : "talento";
  const fallo = NextResponse.redirect(new URL(`/entrar?aviso=proveedor${para === "empresa" ? "&para=empresa" : ""}`, url));

  if (!esProveedor(proveedor) || !proveedoresActivos().includes(proveedor)) return fallo;
  // La demostración no entra a ninguna cuenta: sigue al registro, como el código de ejemplo.
  if (MODO_DEMO) return NextResponse.redirect(new URL("/perfil/nuevo", url));

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: PROVEEDOR_SUPABASE[proveedor],
    options: {
      redirectTo: `${url.origin}/entrar/retorno?para=${para}`,
      // Solo lo necesario para crear la cuenta: el correo. Nada de contactos ni archivos.
      scopes: proveedor === "microsoft" ? "email" : undefined,
    },
  });
  if (error || !data.url) {
    console.error("[entrar] proveedor:", error?.status, error?.code, error?.message);
    return fallo;
  }
  const salida = NextResponse.redirect(data.url);
  salida.headers.set("Cache-Control", "private, no-store");
  return salida;
}
