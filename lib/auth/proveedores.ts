import { MODO_DEMO } from "@/lib/demo";

// Entrar con Google o Microsoft (Supabase Auth). Cada uno se enciende con una variable del
// servidor cuando el proveedor ya está configurado en Supabase; mientras tanto el botón no sale.
// Las llaves de Google y Microsoft se guardan en Supabase, nunca en este repositorio.
export type Proveedor = "google" | "microsoft";

// Nombre que usa Supabase para cada uno.
export const PROVEEDOR_SUPABASE = { google: "google", microsoft: "azure" } as const;

export const esProveedor = (v: unknown): v is Proveedor => v === "google" || v === "microsoft";

export function proveedoresActivos(): Proveedor[] {
  const activos: Proveedor[] = [];
  if (MODO_DEMO || process.env.ENTRAR_GOOGLE === "si") activos.push("google");
  if (MODO_DEMO || process.env.ENTRAR_MICROSOFT === "si") activos.push("microsoft");
  return activos;
}
