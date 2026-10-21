// Prueba el proveedor de IA configurado con historias INVENTADAS. Nunca imprime la llave.
// Uso (con IA_PROVEEDOR y la llave en .env.local):
//   npx tsx --conditions=react-server --env-file=.env.local scripts/probar-ia.ts
import { proveedorDesdeEntorno } from "../lib/ia/entorno";
import { INSTRUCCIONES, mensajeExtraccion, normalizarExtraccion } from "../lib/ia/huella";
import { prepararHistoria } from "../lib/ia/preparar";
import { FalloIA } from "../lib/ia/tipos";
import { historiasInventadas } from "./historias-inventadas";

const taxonomia = [
  { id: "1", capa: "situaciones" as const, etiqueta: "Certificación sanitaria", sinonimos: ["visita del invima"] },
  { id: "2", capa: "normas" as const, etiqueta: "INVIMA", sinonimos: ["bpm"] },
  { id: "3", capa: "contexto" as const, etiqueta: "Empresa familiar", sinonimos: [] },
  { id: "4", capa: "oficio" as const, etiqueta: "Contabilidad", sinonimos: [] },
  { id: "5", capa: "transferir" as const, etiqueta: "Formó a supervisores", sinonimos: [] },
];

const proveedor = proveedorDesdeEntorno();
if (!proveedor) {
  console.log("IA_PROVEEDOR está apagado. Configure claude o gemini en .env.local.");
  process.exit(0);
}
console.log(`Proveedor: ${proveedor.nombre} · modelo: ${proveedor.modelo}\n`);

for (const h of historiasInventadas) {
  const preparada = prepararHistoria(h.texto, h.nombre);
  const inicio = Date.now();
  try {
    const salida = await proveedor.extraer(INSTRUCCIONES, mensajeExtraccion(preparada.texto, taxonomia));
    const { etiquetas, dudas } = normalizarExtraccion(salida, taxonomia);
    console.log(`✔ ${h.titulo} (${Date.now() - inicio} ms)`);
    for (const e of etiquetas) console.log(`   ${e.capa}: ${e.etiqueta}${e.taxonomyId ? "" : " (nueva)"}`);
    if (dudas.length) console.log(`   dudas: ${dudas.join(" | ")}`);
  } catch (error) {
    const motivo = error instanceof FalloIA ? error.motivo : "desconocido";
    console.log(`✘ ${h.titulo} (${Date.now() - inicio} ms): ${motivo}`);
  }
  console.log();
}
