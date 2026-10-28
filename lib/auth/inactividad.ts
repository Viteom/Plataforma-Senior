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

// true si la última actividad registrada (milisegundos, en texto) sigue vigente.
export function actividadVigente(valor: string | undefined, ahora = Date.now()): boolean {
  const ultima = Number(valor);
  if (!valor || !Number.isFinite(ultima) || ultima > ahora + 60_000) return false;
  return ahora - ultima < MINUTOS_INACTIVIDAD * 60_000;
}
