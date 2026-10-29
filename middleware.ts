import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { actividadVigente, COOKIE_ACTIVIDAD, opcionesCookieActividad } from "@/lib/auth/inactividad";
import { decidirRuta, ENTRADA_EQUIPO, esPublica, esRolEquipo, type Rol } from "@/lib/auth/rutas";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

// Refresca la sesión de Supabase y manda a cada rol a su área (lib/auth/rutas.ts).
// Sin Supabase configurado, la app corre en modo demostración y no protege rutas.
// Las páginas públicas (web, ayuda, privacidad) no necesitan sesión: pasan sin consultar nada.
// Solo las de entrar la revisan, para mandar a su inicio a quien ya entró.
export async function middleware(request: NextRequest) {
  if (!supabaseConfigurado) return NextResponse.next();
  const pathname = request.nextUrl.pathname;
  const esEntrada = pathname === "/entrar" || pathname.startsWith("/entrar/");
  if (esPublica(pathname) && !esEntrada) return NextResponse.next();

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

  // getClaims verifica la firma del token: con llaves asimétricas lo hace aquí mismo, sin ir al
  // servidor de Auth. Los claims ya traen el nivel de verificación (aal), así que el segundo factor
  // no necesita otra consulta.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  let rol: Rol | null = null;
  if (claims?.sub) {
    const { data: fila } = await supabase.from("user_roles").select("rol").eq("user_id", claims.sub).maybeSingle();
    rol = (fila?.rol as Rol | undefined) ?? null;
  }

  // El equipo solo cuenta con segundo factor (aal2) y una sesión usada en los últimos 30 minutos.
  let segundoFactor = false;
  if (esRolEquipo(rol)) {
    segundoFactor = claims?.aal === "aal2";
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
  // Todo menos archivos estáticos, íconos, manifest, service worker e imágenes y fuentes de public/:
  // un archivo no necesita sesión, y cada foto de la web consultaba la sesión por su cuenta.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|sw.js|swe-worker|iconos/|.*\\.(?:svg|png|jpe?g|webp|avif|gif|ico|txt|xml|woff2?)$).*)",
  ],
};
