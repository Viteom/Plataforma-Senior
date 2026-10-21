import "server-only";

import { crearProveedorClaude } from "./claude";
import { crearProveedorGemini } from "./gemini";
import { ConfiguracionIAIncompleta, type ProveedorIA } from "./tipos";

// Elige el proveedor con IA_PROVEEDOR (claude | gemini | apagado). Apagado por defecto: la IA no
// procesa historias reales hasta que el prompt se revise (docs/prompt-extraccion.md).

type Entorno = Record<string, string | undefined>;

const MODELO_CLAUDE = /^claude-[a-z0-9-]{1,60}$/;
const MODELO_GEMINI = /^gemini-[a-zA-Z0-9._-]{1,70}$/;

export function proveedorDesdeEntorno(env: Entorno = process.env, transporte?: typeof fetch): ProveedorIA | null {
  const eleccion = (env.IA_PROVEEDOR ?? "apagado").trim().toLowerCase();

  if (eleccion === "apagado" || eleccion === "") return null;

  if (eleccion === "claude") {
    const faltan: string[] = [];
    const apiKey = env.ANTHROPIC_API_KEY?.trim();
    const modelo = (env.CLAUDE_MODEL?.trim() || "claude-opus-5-5");
    if (!apiKey) faltan.push("ANTHROPIC_API_KEY");
    if (!MODELO_CLAUDE.test(modelo)) faltan.push("CLAUDE_MODEL");
    if (faltan.length) throw new ConfiguracionIAIncompleta(faltan);
    return crearProveedorClaude({ apiKey: apiKey!, modelo, fetch: transporte });
  }

  if (eleccion === "gemini") {
    if (env.VERCEL_ENV === "production") {
      throw new ConfiguracionIAIncompleta(["IA_PROVEEDOR (gemini no se permite en producción)"]);
    }
    const faltan: string[] = [];
    const apiKey = env.GEMINI_API_KEY?.trim();
    const modelo = env.GEMINI_MODEL?.trim() ?? "";
    if (!apiKey) faltan.push("GEMINI_API_KEY");
    if (!MODELO_GEMINI.test(modelo)) faltan.push("GEMINI_MODEL");
    if (faltan.length) throw new ConfiguracionIAIncompleta(faltan);
    return crearProveedorGemini({ apiKey: apiKey!, modelo, fetch: transporte });
  }

  throw new ConfiguracionIAIncompleta(["IA_PROVEEDOR"]);
}

// Para la app: si la configuración está mal, solo se apaga la IA y el registro dice qué variable
// revisar, nunca su valor.
export function obtenerProveedor(env: Entorno = process.env): ProveedorIA | null {
  try {
    return proveedorDesdeEntorno(env);
  } catch (error) {
    if (error instanceof ConfiguracionIAIncompleta) {
      console.error("IA desactivada. Revise:", error.variables.join(", "));
      return null;
    }
    throw error;
  }
}

export function iaDisponible(env: Entorno = process.env) {
  return obtenerProveedor(env) !== null;
}
