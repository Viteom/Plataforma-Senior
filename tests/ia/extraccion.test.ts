import { afterEach, describe, expect, it, vi } from "vitest";

import { proveedorDesdeEntorno, obtenerProveedor } from "@/lib/ia/entorno";
import { extraerHuella, type Cuota } from "@/lib/ia/extraer";
import { normalizarExtraccion, type EntradaTaxonomia } from "@/lib/ia/huella";
import { prepararHistoria } from "@/lib/ia/preparar";
import type { Extraccion } from "@/lib/ia/tipos";

// Pruebas mínimas de docs/ia-desde-moai.md (sección 7). Ninguna llama a un proveedor real.

const LLAVE = "sk-ant-llave-de-prueba-123";
const taxonomia: EntradaTaxonomia[] = [
  { id: "t1", capa: "normas", etiqueta: "INVIMA", sinonimos: ["bpm"] },
  { id: "t2", capa: "situaciones", etiqueta: "Apertura de una planta nueva", sinonimos: ["montar una planta"] },
  { id: "t3", capa: "contexto", etiqueta: "Empresa familiar", sinonimos: [] },
];

const salidaBuena: Extraccion = {
  situaciones: ["montar una planta"],
  contexto: ["Empresa familiar"],
  escala: ["Equipo de 40 personas"],
  oficio: ["Producción de alimentos"],
  normas: ["bpm"],
  transferir: ["Formó a los supervisores"],
  dudas: ["¿Cuántas personas tenía a cargo?"],
};

const HISTORIA =
  "Soy Ana María Gómez. En 1998, cuando tenía 30 años, montamos una planta en Antioquia con don Jorge Restrepo. " +
  "Llevo 25 años en alimentos. Mi celular es 300 123 4567 y mi correo ana@correo.com, cédula 43.123.456.";

// Respuesta de la Messages API con el JSON de la extracción en un bloque de texto.
function respuestaClaude(salida: unknown, stopReason = "end_turn") {
  return new Response(
    JSON.stringify({
      id: "msg_prueba",
      type: "message",
      role: "assistant",
      model: "claude-opus-5-5",
      content: [{ type: "text", text: JSON.stringify(salida) }],
      stop_reason: stopReason,
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function cuotaSimulada(reserva: string | null = "uso-1") {
  return {
    reservar: vi.fn<Cuota["reservar"]>().mockResolvedValue(reserva),
    cerrar: vi.fn<Cuota["cerrar"]>().mockResolvedValue(undefined),
  };
}

afterEach(() => vi.restoreAllMocks());

describe("1. qué se envía", () => {
  it("Claude recibe la historia preparada y nada personal; la llave va en la cabecera", async () => {
    const llamadas: { url: string; init: RequestInit }[] = [];
    const transporte = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      llamadas.push({ url: String(url), init: init ?? {} });
      return respuestaClaude(salidaBuena);
    }) as unknown as typeof fetch;

    const proveedor = proveedorDesdeEntorno({ IA_PROVEEDOR: "claude", ANTHROPIC_API_KEY: LLAVE }, transporte);
    const r = await extraerHuella({ historia: HISTORIA, nombrePersona: "Ana María Gómez", taxonomia, proveedor, cuota: cuotaSimulada() });

    expect(r.estado).toBe("ok");
    expect(llamadas).toHaveLength(1);
    const { url, init } = llamadas[0];
    const cuerpo = String(init.body);
    expect(cuerpo).toContain("montamos una planta");
    expect(cuerpo).not.toMatch(/Ana|Gómez|3001234567|300 123 4567|ana@correo|43\.123\.456|1998|30 años|25 años/);
    expect(cuerpo).not.toContain(LLAVE);
    expect(url).not.toContain(LLAVE);
    // SDK 1.x: la llave va como Authorization: Bearer.
    expect(new Headers(init.headers).get("authorization")).toBe(`Bearer ${LLAVE}`);
    // Salida estructurada, poco razonamiento y respaldo ante rechazos.
    const json = JSON.parse(cuerpo);
    expect(json.model).toBe("claude-opus-5-5");
    expect(json.output_config.effort).toBe("low");
    expect(json.output_config.format.type).toBe("json_schema");
    expect(json.fallbacks).toBe("default");
  });

  it("Gemini: llave en cabecera, nunca en la URL", async () => {
    let visto: { url: string; init: RequestInit } | null = null;
    const transporte = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      visto = { url: String(url), init: init ?? {} };
      return new Response(
        JSON.stringify({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(salidaBuena) }] } }] }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const proveedor = proveedorDesdeEntorno(
      { IA_PROVEEDOR: "gemini", GEMINI_API_KEY: "clave-gemini", GEMINI_MODEL: "gemini-3.5-flash-lite" },
      transporte,
    );
    const r = await extraerHuella({ historia: "Abrimos una planta.", taxonomia, proveedor, cuota: cuotaSimulada() });
    expect(r.estado).toBe("ok");
    expect(visto!.url).not.toContain("clave-gemini");
    expect(new Headers(visto!.init.headers).get("x-goog-api-key")).toBe("clave-gemini");
  });
});

describe("2. respuestas rotas", () => {
  it.each([
    ["503", () => new Response("servicio no disponible", { status: 503 })],
    ["vacía", () => new Response("", { status: 200, headers: { "content-type": "application/json" } })],
    ["JSON que no cumple el esquema", () => respuestaClaude({ situaciones: "no es lista" })],
    ["cortada por tokens", () => respuestaClaude(salidaBuena, "max_tokens")],
  ])("%s: error genérico, uso cerrado como error y vía manual", async (_caso, respuesta) => {
    const transporte = vi.fn(async () => respuesta()) as unknown as typeof fetch;
    const proveedor = proveedorDesdeEntorno({ IA_PROVEEDOR: "claude", ANTHROPIC_API_KEY: LLAVE }, transporte);
    const cuota = cuotaSimulada();

    const r = await extraerHuella({ historia: "Abrimos una planta.", taxonomia, proveedor, cuota });

    expect(r).toEqual({ estado: "manual", motivo: "error" });
    expect(cuota.cerrar).toHaveBeenCalledWith("uso-1", "error");
    // Sin reintentos automáticos.
    expect(transporte).toHaveBeenCalledTimes(1);
  });

  it("un rechazo queda registrado como rechazado", async () => {
    const transporte = vi.fn(async () => respuestaClaude(salidaBuena, "refusal")) as unknown as typeof fetch;
    const proveedor = proveedorDesdeEntorno({ IA_PROVEEDOR: "claude", ANTHROPIC_API_KEY: LLAVE }, transporte);
    const cuota = cuotaSimulada();
    await extraerHuella({ historia: "x", taxonomia, proveedor, cuota });
    expect(cuota.cerrar).toHaveBeenCalledWith("uso-1", "rechazado");
  });
});

describe("3. cuota", () => {
  it("sin cupo no se llama al proveedor", async () => {
    const transporte = vi.fn() as unknown as typeof fetch;
    const proveedor = proveedorDesdeEntorno({ IA_PROVEEDOR: "claude", ANTHROPIC_API_KEY: LLAVE }, transporte);
    const r = await extraerHuella({ historia: "x", taxonomia, proveedor, cuota: cuotaSimulada(null) });
    expect(r).toEqual({ estado: "manual", motivo: "cuota" });
    expect(transporte).not.toHaveBeenCalled();
  });
});

describe("4. IA apagada", () => {
  it.each([{}, { IA_PROVEEDOR: "apagado" }])("%o: sin llamadas y vía manual", async (env) => {
    expect(proveedorDesdeEntorno(env)).toBeNull();
    const cuota = cuotaSimulada();
    const r = await extraerHuella({ historia: "x", taxonomia, proveedor: proveedorDesdeEntorno(env), cuota });
    expect(r).toEqual({ estado: "manual", motivo: "apagada" });
    expect(cuota.reservar).not.toHaveBeenCalled();
  });
});

describe("5. etiquetas con edad", () => {
  it("se descartan aunque el modelo las devuelva", () => {
    const { etiquetas } = normalizarExtraccion(
      {
        ...salidaBuena,
        oficio: ["Producción de alimentos", "30 años de experiencia", "Pensionado del sector"],
        contexto: ["Empresa familiar", "Trabajador mayor", "Planta [fecha]"],
      },
      taxonomia,
    );
    const textos = etiquetas.map((e) => e.etiqueta).join(" | ");
    expect(textos).not.toMatch(/años|Pensionado|mayor|\[fecha\]/);
    expect(textos).toContain("Producción de alimentos");
  });

  it("usa la etiqueta canónica cuando el modelo trae un sinónimo, y marca las nuevas", () => {
    const { etiquetas } = normalizarExtraccion(salidaBuena, taxonomia);
    expect(etiquetas).toContainEqual({ capa: "normas", etiqueta: "INVIMA", taxonomyId: "t1" });
    expect(etiquetas).toContainEqual({ capa: "situaciones", etiqueta: "Apertura de una planta nueva", taxonomyId: "t2" });
    expect(etiquetas).toContainEqual({ capa: "oficio", etiqueta: "Producción de alimentos", taxonomyId: null });
  });

  it("descarta etiquetas de más de 6 palabras y repetidas", () => {
    const { etiquetas } = normalizarExtraccion(
      { ...salidaBuena, situaciones: ["Una etiqueta que tiene muchas más de seis palabras", "montar una planta", "Apertura de una planta nueva"] },
      taxonomia,
    );
    expect(etiquetas.filter((e) => e.capa === "situaciones")).toHaveLength(1);
  });
});

describe("7. configuración mal hecha", () => {
  it("no tumba la app y el registro nombra la variable sin su valor", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = obtenerProveedor({ IA_PROVEEDOR: "claude", ANTHROPIC_API_KEY: LLAVE, CLAUDE_MODEL: '"models/claude-opus-5-5"' });
    expect(r).toBeNull();
    const registro = JSON.stringify(error.mock.calls);
    expect(registro).toContain("CLAUDE_MODEL");
    expect(registro).not.toContain(LLAVE);
    expect(registro).not.toContain("models/");
  });

  it("Gemini no se acepta en producción", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(obtenerProveedor({ IA_PROVEEDOR: "gemini", GEMINI_API_KEY: "k", GEMINI_MODEL: "gemini-3.5-flash-lite", VERCEL_ENV: "production" })).toBeNull();
  });

  it("un valor desconocido apaga la IA", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(obtenerProveedor({ IA_PROVEEDOR: "otro" })).toBeNull();
  });
});

describe("8. fechas, edades y nombres antes de enviar", () => {
  it("reemplaza años, edades, tiempos de servicio, contacto y el nombre propio", () => {
    const p = prepararHistoria(HISTORIA, "Ana María Gómez");
    expect(p.texto).not.toMatch(/1998|30 años|25 años|Ana|Gómez|300 123 4567|ana@correo|43\.123\.456/);
    expect(p.texto).toContain("[la persona]");
    expect(p.texto).toContain("[fecha]");
    expect(p.texto).toContain("[tiempo]");
    expect(p.reemplazos.contacto).toBe(2);
    expect(p.reemplazos.documentos).toBeGreaterThanOrEqual(1);
  });

  it.each([
    ["el 14 de marzo de 1998 abrimos", "el [fecha] abrimos"],
    ["en el 98 abrimos", "[fecha] abrimos"],
    ["en los años 80 trabajé", "en [fecha] trabajé"],
    ["a los 25 años entré", "[tiempo] entré"],
    ["treinta años en la empresa", "[tiempo] en la empresa"],
    ["el 03/05/2001 cerramos", "el [fecha] cerramos"],
  ])("%s → %s", (entrada, esperado) => {
    expect(prepararHistoria(entrada).texto).toBe(esperado);
  });

  it("no toca cifras de la historia que no son tiempo", () => {
    const p = prepararHistoria("Teníamos 40 operarios y 3 turnos, producíamos 2.000 kilos al día.");
    expect(p.texto).toContain("40 operarios");
    expect(p.texto).toContain("3 turnos");
    expect(p.texto).toContain("2.000 kilos");
  });

  it("señala posibles nombres de otras personas, no lugares", () => {
    const p = prepararHistoria("Trabajé con don Jorge en Antioquia. Después llegó Carlos Pérez a la planta de Medellín.");
    expect(p.nombresPosibles).toEqual(expect.arrayContaining(["Jorge", "Carlos Pérez"]));
    expect(p.nombresPosibles.join(" ")).not.toMatch(/Antioquia|Medellín/);
  });

  it("reemplaza el nombre propio aunque empiece con tilde", () => {
    expect(prepararHistoria("Me dicen Ángela en la planta.", "Ángela Ruiz").texto).toBe("Me dicen [la persona] en la planta.");
  });
});

describe("9. dudas", () => {
  it("descarta las que preguntan por años, fechas o edad", () => {
    const { dudas } = normalizarExtraccion(
      {
        ...salidaBuena,
        dudas: ["¿En qué año fue?", "¿Cuándo pasó?", "¿Cuántas personas tenía a cargo?", "¿Qué edad tenía?", "¿Hace cuánto?"],
      },
      taxonomia,
    );
    expect(dudas).toEqual(["¿Cuántas personas tenía a cargo?"]);
  });
});
