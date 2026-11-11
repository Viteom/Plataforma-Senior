import "server-only";

import { resolveMx } from "node:dns/promises";

// Revisa que el dominio de un correo exista y reciba correo. En la prueba con usuarios alguien
// escribió «@gamil.com» y el formulario lo dejó pasar: el código nunca le llegó.

// Errores de dedo más comunes → el dominio que casi seguro quiso escribir.
const ERRORES_COMUNES: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotnail.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "iclou.com": "icloud.com",
  "icloud.co": "icloud.com",
};

// Si el dominio es un error de dedo conocido, devuelve el correo corregido para proponerlo.
export function sugerenciaCorreo(correo: string): string | null {
  const [usuario, dominio] = correo.split("@");
  const corregido = ERRORES_COMUNES[dominio];
  return corregido ? `${usuario}@${corregido}` : null;
}

// Respuestas recientes por dominio: evita repetir la consulta (y que alguien la use para insistir).
const RECIENTES = new Map<string, { sirve: boolean; hasta: number }>();
const VIGENCIA_MS = 10 * 60 * 1000;
const MAX_RECIENTES = 500;

// true si el dominio tiene servidor de correo. Si la consulta falla por la red (no por el
// dominio), se deja pasar: es mejor enviar un código de más que dejar a alguien por fuera.
export async function dominioRecibeCorreo(correo: string, esperaMs = 3000): Promise<boolean> {
  const dominio = correo.split("@")[1];
  if (!dominio) return false;
  const guardado = RECIENTES.get(dominio);
  if (guardado && guardado.hasta > Date.now()) return guardado.sirve;
  const recordar = (sirve: boolean) => {
    if (RECIENTES.size >= MAX_RECIENTES) RECIENTES.clear();
    RECIENTES.set(dominio, { sirve, hasta: Date.now() + VIGENCIA_MS });
    return sirve;
  };
  try {
    const registros = await Promise.race([
      resolveMx(dominio),
      new Promise<null>((resolver) => setTimeout(() => resolver(null), esperaMs)),
    ]);
    // Sin respuesta a tiempo no se recuerda nada: la próxima vez se vuelve a preguntar.
    if (registros === null) return true;
    return recordar(registros.some((r) => Boolean(r.exchange) && r.exchange !== "."));
  } catch (error) {
    const codigo = (error as { code?: string }).code;
    if (codigo === "ENOTFOUND" || codigo === "ENODATA") return recordar(false);
    return true;
  }
}

// Mensaje de error para la pantalla, o null si el correo sirve.
export async function problemaConElCorreo(correo: string): Promise<string | null> {
  const sugerido = sugerenciaCorreo(correo);
  if (sugerido) return `Revisa el correo: ¿quisiste escribir ${sugerido}?`;
  if (!(await dominioRecibeCorreo(correo))) {
    return `No encontramos «${correo.split("@")[1]}». Revisa lo que va después de la @, por ejemplo gmail.com u hotmail.com.`;
  }
  return null;
}
