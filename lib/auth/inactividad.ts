// La sesión del equipo se cierra tras 30 minutos sin uso. El middleware renueva esta cookie en
// cada pantalla; si falta o venció, cierra la sesión y pide entrar de nuevo con el segundo factor.
export const COOKIE_ACTIVIDAD = "kanna_equipo_actividad";
export const MINUTOS_INACTIVIDAD = 30;

export const opcionesCookieActividad = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 8 * 60 * 60,
};

type IdentidadActividad = { usuario: string; sesion: string };

async function llave(secreto: string) {
  if (secreto.length < 32) return null;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const mensaje = (marca: string, identidad: IdentidadActividad) =>
  new TextEncoder().encode(JSON.stringify(["actividad-equipo-v1", identidad.usuario, identidad.sesion, marca]));

// HttpOnly evita leer la cookie desde JavaScript, pero no prueba quién la creó. La firma impide
// inventar fechas y vincula la marca a la cuenta y a la sesión verificadas por Supabase.
export async function crearActividad(identidad: IdentidadActividad, secreto: string, ahora = Date.now()): Promise<string | null> {
  const clave = await llave(secreto);
  if (!clave || !identidad.usuario || !identidad.sesion) return null;
  const marca = String(ahora);
  const firma = await crypto.subtle.sign("HMAC", clave, mensaje(marca, identidad));
  return `${marca}.${Array.from(new Uint8Array(firma), b => b.toString(16).padStart(2,"0")).join("")}`;
}

export async function actividadVigente(valor: string | undefined, identidad: IdentidadActividad, secreto: string, ahora = Date.now()): Promise<boolean> {
  if (!valor || !identidad.usuario || !identidad.sesion) return false;
  const [marca, firma, extra] = valor.split(".");
  const ultima = Number(marca);
  if (extra !== undefined || !/^\d+$/.test(marca) || !/^[0-9a-f]{64}$/.test(firma ?? "")
    || !Number.isSafeInteger(ultima) || ultima > ahora || ahora - ultima >= MINUTOS_INACTIVIDAD * 60_000) return false;
  const clave = await llave(secreto);
  if (!clave) return false;
  return crypto.subtle.verify("HMAC", clave, Uint8Array.from(firma.match(/../g)!, h => parseInt(h,16)), mensaje(marca,identidad));
}
