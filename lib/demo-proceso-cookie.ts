import "server-only";

import { cookies } from "next/headers";

import { avanzarDemo, procesoInicial, type ProcesoDemo } from "@/lib/demo-proceso";
import type { Lado } from "@/lib/procesos";

// El proceso de la demostración vive en una cookie de este navegador: cada quien que abre la
// demostración tiene el suyo y nada llega a la base.
const NOMBRE = "kanna_demo_proceso";

export async function leerProcesoDemo(): Promise<ProcesoDemo> {
  const valor = (await cookies()).get(NOMBRE)?.value;
  if (!valor) return procesoInicial();
  try {
    return { ...procesoInicial(), ...(JSON.parse(valor) as Partial<ProcesoDemo>) };
  } catch {
    return procesoInicial();
  }
}

export async function avanzarProcesoDemo(lado: Lado, accion: string, datos: Record<string, unknown> = {}) {
  const nuevo = avanzarDemo(await leerProcesoDemo(), lado, accion, datos);
  if ("error" in nuevo) return nuevo;
  (await cookies()).set(NOMBRE, JSON.stringify(nuevo), { path: "/", sameSite: "lax", httpOnly: true, maxAge: 7 * 24 * 3600 });
  return { ok: true as const };
}

export async function reiniciarProcesoDemo() {
  (await cookies()).delete(NOMBRE);
}
