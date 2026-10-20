// Celular colombiano o correo, normalizados para Supabase Auth.

export type Destino = { tipo: "celular"; valor: string } | { tipo: "correo"; valor: string };

// Acepta "300 123 4567", "300-123-4567", "+57 300 123 4567" o "573001234567".
// Solo celulares (empiezan por 3 y tienen 10 números): el código llega por SMS.
export function normalizarCelular(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, "");
  if (digitos.length === 12 && digitos.startsWith("57")) digitos = digitos.slice(2);
  if (!/^3\d{9}$/.test(digitos)) return null;
  return `+57${digitos}`;
}

export function normalizarCorreo(entrada: string): string | null {
  const correo = entrada.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo) ? correo : null;
}

// Hash para el límite de intentos: se guarda esto, nunca el número ni el correo.
export async function hashDestino(destino: string, pimienta = "") {
  const datos = new TextEncoder().encode(`${pimienta}:${destino}`);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Para mostrar a dónde se envió el código sin repetirlo completo: "300 *** 4567", "a***@correo.com".
export function enmascarar(destino: Destino): string {
  if (destino.tipo === "celular") {
    const d = destino.valor.replace(/^\+57/, "");
    return `${d.slice(0, 3)} *** ${d.slice(-4)}`;
  }
  const [usuario, dominio] = destino.valor.split("@");
  return `${usuario.slice(0, 1)}***@${dominio}`;
}
