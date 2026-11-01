// En qué ambiente corre la app (docs/ruta-piloto.md). No es un secreto: solo dice dónde estamos.
//   produccion: personas y organizaciones reales.
//   pruebas: datos falsos para probar migraciones y flujos; se marca en pantalla y no se indexa.
// Sin la variable (desarrollo local o la demostración) se trata como pruebas, salvo que la app
// corra sin Supabase: ahí ya avisa «Datos de ejemplo».
export type Ambiente = "produccion" | "pruebas";

export const AMBIENTE: Ambiente = process.env.NEXT_PUBLIC_AMBIENTE?.trim() === "produccion" ? "produccion" : "pruebas";

export const esProduccion = AMBIENTE === "produccion";
