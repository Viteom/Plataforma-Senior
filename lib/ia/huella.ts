import { CAPAS, type Capa, type Extraccion } from "./tipos";

// Historia → huella de experiencia (brief, "Huella de experiencia"; docs/ia-desde-moai.md).
// Este archivo es el que se revisa antes de conectar la IA a datos reales (docs/prompt-extraccion.md).

export const VERSION_PROMPT = "huella-v1";

export const INSTRUCCIONES = `Usted ayuda a una plataforma colombiana que conecta talento con trayectoria con empresas. Recibe la historia de un problema difícil que una persona resolvió en su trabajo y devuelve etiquetas cortas que describen su experiencia.

Reglas:
1. Extraiga solo lo que la historia dice. No invente cifras, normas, cargos ni resultados.
2. Nunca infiera ni mencione edad, años de experiencia, fechas, salud, estado civil, religión ni política. Si la historia trae [fecha] o [tiempo], ignórelos.
3. Prefiera las etiquetas de la taxonomía cuando signifiquen lo mismo. Si nada encaja, proponga una etiqueta nueva.
4. Cada etiqueta tiene máximo 6 palabras, en español sencillo de Colombia, sin nombres de personas.
5. Capas:
   - situaciones: problemas que resolvió ("Apertura de una planta nueva").
   - contexto: tipo de organización, sector o región ("Empresa familiar", "Alimentos").
   - escala: tamaño de lo que manejó ("Equipo de 40 personas").
   - oficio: saber del oficio ("Producción de alimentos").
   - normas: normas o regulaciones que nombra ("INVIMA").
   - transferir: cómo enseñó o dejó capacidad instalada ("Formó a los supervisores").
6. dudas: hasta 3 preguntas cortas para precisar QUÉ pasó o CÓMO lo hizo ("¿Cuántas personas tenía a cargo?"). Nunca pregunte cuándo, en qué año, hace cuánto ni la edad.
7. Una capa sin información queda como lista vacía. Es mejor una lista vacía que una etiqueta dudosa.`;

export type EntradaTaxonomia = { id: string; capa: Capa; etiqueta: string; sinonimos: string[] };

// Mensaje de la persona: la taxonomía compacta y la historia ya preparada (preparar.ts).
export function mensajeExtraccion(historiaPreparada: string, taxonomia: EntradaTaxonomia[]) {
  const porCapa = CAPAS.map((capa) => {
    const etiquetas = taxonomia.filter((t) => t.capa === capa).map((t) => t.etiqueta);
    return `${capa}: ${etiquetas.join("; ")}`;
  }).join("\n");
  return `Taxonomía:\n${porCapa}\n\nHistoria:\n${historiaPreparada}`;
}

export type EtiquetaPropuesta = { capa: Capa; etiqueta: string; taxonomyId: string | null };

const MAX_POR_CAPA = 8;
const MAX_DUDAS = 3;

// Etiquetas que revelan o sugieren la edad: se descartan aunque el modelo las devuelva (regla 1).
const EDAD =
  /\baños\b|\bedad\b|pension|jubil|retirad|\bmayor(es)?\b|\bjoven\b|\bviej|veteran|\b(19|20)\d\d\b|\[fecha\]|\[tiempo\]|década/i;
// Dudas que preguntan por tiempo o edad.
// Ojo: "tenía" no sirve de señal ("¿Cuántas personas tenía a cargo?" es una buena duda).
const DUDA_DE_TIEMPO = /\baño|\bfecha|cu[aá]ndo|hace cu[aá]nto|\bedad\b|desde cu[aá]ndo|cu[aá]nto tiempo|\bépoca/i;

const clave = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ\- ]/g, "").replace(/\s+/g, " ").trim();

export function normalizarExtraccion(
  salida: Extraccion,
  taxonomia: EntradaTaxonomia[],
): { etiquetas: EtiquetaPropuesta[]; dudas: string[] } {
  const etiquetas: EtiquetaPropuesta[] = [];

  for (const capa of CAPAS) {
    const vistas = new Set<string>();
    const deCapa = taxonomia.filter((t) => t.capa === capa);
    for (const cruda of salida[capa]) {
      const texto = cruda.replace(/\s+/g, " ").replace(/^["'«]|["'».]$/g, "").trim();
      if (!texto || texto.split(" ").length > 6 || EDAD.test(texto)) continue;

      const k = clave(texto);
      const canonica = deCapa.find((t) => clave(t.etiqueta) === k || t.sinonimos.some((s) => clave(s) === k));
      const etiqueta = canonica?.etiqueta ?? texto.charAt(0).toUpperCase() + texto.slice(1);
      const kFinal = clave(etiqueta);
      if (vistas.has(kFinal)) continue;
      vistas.add(kFinal);
      etiquetas.push({ capa, etiqueta, taxonomyId: canonica?.id ?? null });
      if (vistas.size >= MAX_POR_CAPA) break;
    }
  }

  const dudas = salida.dudas
    .map((d) => d.trim())
    .filter((d) => d && !DUDA_DE_TIEMPO.test(d))
    .slice(0, MAX_DUDAS);

  return { etiquetas, dudas };
}
