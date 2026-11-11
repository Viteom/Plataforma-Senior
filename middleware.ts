import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { actividadVigente, crearActividad, COOKIE_ACTIVIDAD, opcionesCookieActividad } from "@/lib/auth/inactividad";
import { decidirRuta, ENTRADA_EQUIPO, esPublica, esRolEquipo, type Rol } from "@/lib/auth/rutas";
import { politicaContenido } from "@/lib/privacidad/cabeceras";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigurado } from "@/lib/supabase/config";

// Refresca la sesión de Supabase y manda a cada rol a su área (lib/auth/rutas.ts).
// Sin Supabase configurado, la app corre en modo demostración y no protege rutas.
// Las páginas públicas (web, ayuda, privacidad) no necesitan sesión: pasan sin consultar nada.
// Solo las de entrar la revisan, para mandar a su inicio a quien ya entró.
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const esEntrada = pathname === "/entrar" || pathname.startsWith("/entrar/");
  if (esPublica(pathname) && !esEntrada) return NextResponse.next();

  // Páginas privadas: política de contenido con un identificador de un solo uso (nonce). Next lo
  // lee de la petición y lo pone en sus propios scripts; cualquier otro script en línea no corre.
  const nonce = btoa(crypto.randomUUID());
  const politica = politicaContenido(process.env.NODE_ENV === "production", SUPABASE_URL, nonce);
  const siguiente = () => {
    const cabeceras = new Headers(request.headers);
    cabeceras.set("x-nonce", nonce);
    cabeceras.set("Content-Security-Policy", politica);
    const r = NextResponse.next({ request: { headers: cabeceras } });
    r.headers.set("Content-Security-Policy", politica);
    r.headers.set("Cache-Control", "private, no-store, max-age=0");
    return r;
  };
  if (!supabaseConfigurado) return siguiente();

  let respuesta = siguiente();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = siguiente();
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
    const identidad = { usuario: String(claims?.sub ?? ""), sesion: String(claims?.session_id ?? "") };
    const secreto = process.env.EQUIPO_SESSION_SECRET ?? "";
    if (segundoFactor && !await actividadVigente(request.cookies.get(COOKIE_ACTIVIDAD)?.value, identidad, secreto)) {
      await supabase.auth.signOut();
      const salida = redirigir(request, respuesta, `${ENTRADA_EQUIPO}?motivo=inactividad`);
      salida.cookies.delete(COOKIE_ACTIVIDAD);
      return salida;
    }
    if (segundoFactor) {
      const marca = await crearActividad(identidad, secreto);
      if (marca) respuesta.cookies.set(COOKIE_ACTIVIDAD, marca, opcionesCookieActividad);
    }
  }

  const destino = decidirRuta(pathname, rol, segundoFactor);
  return destino ? redirigir(request, respuesta, destino) : respuesta;
}

function redirigir(request: NextRequest, respuesta: NextResponse, destino: string) {
  const redireccion = NextResponse.redirect(new URL(destino, request.url));
  redireccion.headers.set("Cache-Control", "private, no-store, max-age=0");
  // Conserva las cookies de sesión que Supabase acaba de refrescar (o borrar).
  respuesta.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
  return redireccion;
}

export const config = {
  // Todo menos archivos estáticos, íconos, manifest, service worker e imágenes y fuentes de public/:
  // un archivo no necesita sesión, y cada foto de la web consultaba la sesión por su cuenta.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|sw.js|letra-y-contraste.js|swe-worker|iconos/|.*\\.(?:svg|png|jpe?g|webp|avif|gif|ico|txt|xml|woff2?)$).*)",
  ],
};
