import { INSTRUCCIONES, mensajeExtraccion, normalizarExtraccion, type EntradaTaxonomia, type EtiquetaPropuesta } from "./huella";
import { prepararHistoria } from "./preparar";
import { FalloIA, type ProveedorIA } from "./tipos";

// Orquesta una extracción: preparar → reservar cuota → proveedor → normalizar → cerrar el uso.
// Recibe todo por parámetro para probarlo sin red ni base de datos. La persona nunca queda
// atascada: si algo falla, el resultado es "manual" y la pantalla ofrece elegir etiquetas a mano.

export type Cuota = {
  reservar: (tarea: "huella", modelo: string) => Promise<string | null>;
  cerrar: (uso: string, resultado: "correcto" | "error" | "rechazado") => Promise<void>;
};

export type ResultadoExtraccion =
  | { estado: "ok"; etiquetas: EtiquetaPropuesta[]; dudas: string[] }
  | { estado: "manual"; motivo: "apagada" | "cuota" | "error" };

type Entrada = {
  historia: string;
  nombrePersona?: string | null;
  taxonomia: EntradaTaxonomia[];
  proveedor: ProveedorIA | null;
  cuota: Cuota;
};

export async function extraerHuella({ historia, nombrePersona, taxonomia, proveedor, cuota }: Entrada): Promise<ResultadoExtraccion> {
  if (!proveedor) return { estado: "manual", motivo: "apagada" };

  const preparada = prepararHistoria(historia, nombrePersona);
  const uso = await cuota.reservar("huella", proveedor.modelo);
  if (!uso) return { estado: "manual", motivo: "cuota" };

  try {
    const salida = await proveedor.extraer(INSTRUCCIONES, mensajeExtraccion(preparada.texto, taxonomia));
    const { etiquetas, dudas } = normalizarExtraccion(salida, taxonomia);
    await cuota.cerrar(uso, "correcto");
    return { estado: "ok", etiquetas, dudas };
  } catch (error) {
    await cuota.cerrar(uso, error instanceof FalloIA && error.motivo === "rechazo" ? "rechazado" : "error");
    return { estado: "manual", motivo: "error" };
  }
}
