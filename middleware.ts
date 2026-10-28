import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { actividadVigente, COOKIE_ACTIVIDAD, opcionesCookieActividad } from "@/lib/auth/inactividad";
import { decidirRuta, ENTRADA_EQUIPO, esPublica, esRolEquipo, type Rol } from "@/lib/auth/rutas";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

// Refresca la sesión de Supabase y manda a cada rol a su área (lib/auth/rutas.ts).
// Sin Supabase configurado, la app corre en modo demostración y no protege rutas.
export async function middleware(request: NextRequest) {
  if (!supabaseConfigurado) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let rol: Rol | null = null;
  if (user) {
    const { data } = await supabase.from("user_roles").select("rol").eq("user_id", user.id).maybeSingle();
    rol = (data?.rol as Rol | undefined) ?? null;
  }

  const pathname = request.nextUrl.pathname;
  // El equipo solo cuenta con segundo factor (aal2) y una sesión usada en los últimos 30 minutos.
  let segundoFactor = false;
  if (esRolEquipo(rol)) {
    const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    segundoFactor = nivel?.currentLevel === "aal2";
    if (segundoFactor && !esPublica(pathname) && !actividadVigente(request.cookies.get(COOKIE_ACTIVIDAD)?.value)) {
      await supabase.auth.signOut();
      const salida = redirigir(request, respuesta, `${ENTRADA_EQUIPO}?motivo=inactividad`);
      salida.cookies.delete(COOKIE_ACTIVIDAD);
      return salida;
    }
    if (segundoFactor) respuesta.cookies.set(COOKIE_ACTIVIDAD, String(Date.now()), opcionesCookieActividad);
  }

  const destino = decidirRuta(pathname, rol, segundoFactor);
  return destino ? redirigir(request, respuesta, destino) : respuesta;
}

function redirigir(request: NextRequest, respuesta: NextResponse, destino: string) {
  const redireccion = NextResponse.redirect(new URL(destino, request.url));
  // Conserva las cookies de sesión que Supabase acaba de refrescar (o borrar).
  respuesta.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
  return redireccion;
}

export const config = {
  // Todo menos archivos estáticos, íconos, manifest y service worker.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|sw.js|swe-worker|iconos/).*)",
  ],
};
