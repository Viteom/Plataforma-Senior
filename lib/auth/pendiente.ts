import "server-only";

import { cookies } from "next/headers";

import type { Destino } from "./destino";

// A dónde se envió el código, entre /entrar y /entrar/codigo. Cookie httpOnly de 10 minutos,
// nunca en la URL (regla de privacidad). Este módulo no es una acción: no se expone al navegador.

const COOKIE = "entrar_destino";
export type Para = "talento" | "empresa";
export type Pendiente = Destino & { para: Para };

export async function leerPendiente(): Promise<Pendiente | null> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor) return null;
  try {
    return JSON.parse(valor) as Pendiente;
  } catch {
    return null;
  }
}

export async function guardarPendiente(p: Pendiente) {
  (await cookies()).set(COOKIE, JSON.stringify(p), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/entrar",
    maxAge: 600,
  });
}

export async function borrarPendiente() {
  (await cookies()).delete({ name: COOKIE, path: "/entrar" });
}
