import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import { EsquemaExtraccion, FalloIA, type ProveedorIA } from "./tipos";

type Opciones = { apiKey: string; modelo: string; fetch?: typeof fetch };

// Claude con salida estructurada (output_config.format). La llave va en una cabecera
// (Authorization: Bearer, la pone el SDK 1.x), nunca en la URL ni en el cuerpo. Al pasarla
// explícita, el SDK no lee otras credenciales del entorno. Sin reintentos y con tope de tiempo.
export function crearProveedorClaude({ apiKey, modelo, fetch }: Opciones): ProveedorIA {
  const cliente = new Anthropic({ apiKey, fetch, maxRetries: 0, timeout: 30_000 });

  return {
    nombre: "Claude",
    modelo,
    async extraer(sistema, texto) {
      let respuesta;
      try {
        respuesta = await cliente.beta.messages.parse({
          model: modelo,
          max_tokens: 16_000,
          system: sistema,
          messages: [{ role: "user", content: texto }],
          output_config: {
            // Extraer es una tarea corta: poco razonamiento basta y abarata.
            effort: "low",
            format: betaZodOutputFormat(EsquemaExtraccion),
          },
          // Si un clasificador rechaza por error una historia, otro modelo la procesa.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        });
      } catch (error) {
        if (error instanceof Anthropic.APIConnectionError) throw new FalloIA("red");
        if (error instanceof Anthropic.APIError) throw new FalloIA("proveedor");
        // Salida que no cumple el esquema u otro error del SDK.
        throw new FalloIA("forma");
      }

      if (respuesta.stop_reason === "refusal") throw new FalloIA("rechazo");
      if (respuesta.stop_reason === "max_tokens") throw new FalloIA("cortada");
      if (!respuesta.parsed_output) throw new FalloIA("forma");
      return respuesta.parsed_output;
    },
  };
}
