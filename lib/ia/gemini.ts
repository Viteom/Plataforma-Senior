import "server-only";

import { CAPAS, EsquemaExtraccion, FalloIA, type ProveedorIA } from "./tipos";

// Gemini SOLO para pruebas con historias inventadas (docs/ia-desde-moai.md): en el plan gratuito
// Google puede usar el contenido para mejorar sus productos. entorno.ts lo rechaza en producción.

type Opciones = { apiKey: string; modelo: string; fetch?: typeof fetch };

const TOPE_RESPUESTA = 32 * 1024;

const esquemaGemini = {
  type: "OBJECT",
  properties: Object.fromEntries(
    [...CAPAS, "dudas"].map((c) => [c, { type: "ARRAY", items: { type: "STRING" } }]),
  ),
  required: [...CAPAS, "dudas"],
};

export function crearProveedorGemini({ apiKey, modelo, fetch: transporte = fetch }: Opciones): ProveedorIA {
  // Lección de MOAI: los modelos que "piensan" pueden gastar todos los tokens de salida.
  const pensamiento = /^gemini-2\./.test(modelo) ? { thinkingBudget: 0 } : { thinkingLevel: "low" };

  return {
    nombre: "Gemini",
    modelo,
    async extraer(sistema, texto) {
      let respuesta: Response;
      try {
        respuesta = await transporte(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
          {
            method: "POST",
            // La llave en la cabecera, nunca en la URL.
            headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
            redirect: "error",
            signal: AbortSignal.timeout(15_000),
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sistema }] },
              contents: [{ role: "user", parts: [{ text: texto }] }],
              generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: esquemaGemini,
                thinkingConfig: pensamiento,
              },
            }),
          },
        );
      } catch {
        throw new FalloIA("red");
      }
      if (!respuesta.ok) throw new FalloIA("proveedor");

      const cuerpo = await leerConTope(respuesta, TOPE_RESPUESTA);
      let datos: unknown;
      try {
        datos = JSON.parse(cuerpo);
      } catch {
        throw new FalloIA("forma");
      }
      const candidato = (datos as { candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[] })
        ?.candidates?.[0];
      if (candidato?.finishReason === "MAX_TOKENS") throw new FalloIA("cortada");
      if (candidato?.finishReason === "SAFETY") throw new FalloIA("rechazo");
      const textoSalida = candidato?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

      try {
        return EsquemaExtraccion.parse(JSON.parse(textoSalida));
      } catch {
        throw new FalloIA("forma");
      }
    },
  };
}

async function leerConTope(respuesta: Response, tope: number): Promise<string> {
  const lector = respuesta.body?.getReader();
  if (!lector) return "";
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > tope) {
      await lector.cancel();
      throw new FalloIA("forma");
    }
    partes.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(partes));
}
