import { problemaEtiquetaLibre } from "@/lib/capas";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import type { Capa } from "@/lib/ia/tipos";

// Contar un reto (organización). Lógica pura: sugerir requisitos de la taxonomía a partir de lo
// que escribe la organización (sin IA, por palabras y sinónimos), validar lo que agrega a mano y
// armar el texto del reto con el contexto opcional.

const quitarTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Palabras que no dicen nada del reto.
const VACIAS = new Set([
  "para", "como", "pero", "porque", "donde", "cuando", "tenemos", "necesitamos", "queremos", "vamos",
  "hacer", "tener", "nuestra", "nuestro", "nuestros", "nuestras", "persona", "alguien", "empresa",
  "equipo", "meses", "meses.", "mucho", "poco", "esta", "este", "estos", "estas", "sobre", "entre",
  "desde", "hasta", "cada", "todo", "todos", "otra", "otro", "mejor", "nueva", "nuevo", "segunda",
]);

// Raíz corta para que «certificar», «certificación» y «certificamos» coincidan. Siete letras:
// con seis, «electrónica» y «electricidad» quedaban iguales.
const raiz = (palabra: string) => palabra.slice(0, 7);

function palabras(texto: string) {
  return quitarTildes(texto)
    .split(/[^a-zñ0-9-]+/)
    .filter((p) => p.length >= 4 && !VACIAS.has(p));
}

// Ordena la taxonomía por cuánto se parece al reto. Un sinónimo completo pesa más que una palabra.
export function sugerirRequisitos(reto: string, taxonomia: EntradaTaxonomia[], maximo = 8): EntradaTaxonomia[] {
  const texto = quitarTildes(reto);
  const raices = new Set(palabras(reto).map(raiz));
  if (raices.size === 0) return [];
  return taxonomia
    .filter((t) => t.capa !== "transferir")
    .map((t) => {
      let puntos = 0;
      for (const s of [t.etiqueta, ...t.sinonimos]) {
        const frase = quitarTildes(s);
        if (frase.length >= 4 && texto.includes(frase)) puntos += 3;
      }
      for (const p of palabras(t.etiqueta)) if (raices.has(raiz(p))) puntos += 1;
      for (const s of t.sinonimos) for (const p of palabras(s)) if (raices.has(raiz(p))) puntos += 0.5;
      return { t, puntos };
    })
    .filter(({ puntos }) => puntos >= 1)
    .sort((a, b) => b.puntos - a.puntos || a.t.etiqueta.localeCompare(b.t.etiqueta))
    .slice(0, maximo)
    .map(({ t }) => t);
}

// Busca en toda la taxonomía por etiqueta o sinónimo.
export function buscarRequisitos(consulta: string, taxonomia: EntradaTaxonomia[]): EntradaTaxonomia[] {
  const q = quitarTildes(consulta.trim());
  if (q.length < 2) return [];
  return taxonomia.filter(
    (t) => t.capa !== "transferir" && [t.etiqueta, ...t.sinonimos].some((s) => quitarTildes(s).includes(q)),
  );
}

// Lo que la organización escribe a mano: las reglas de la huella libre, más las formas de pedir
// edad que usaría una organización (regla 1: la edad nunca entra en la búsqueda).
export function problemaRequisitoLibre(texto: string): string | null {
  const base = problemaEtiquetaLibre(texto);
  if (base) return base;
  if (/\bj[oó]ven(es)?\b|\b(mayor|menor)(es)? de\b|\bgeneraci[oó]n(es)?\b|\bmillennial|\bcentennial/i.test(texto)) {
    return "No escribas edades ni generaciones: buscamos por lo que la persona sabe hacer.";
  }
  return null;
}

export const CAPAS_LIBRES: Capa[] = ["situaciones", "oficio", "normas", "contexto", "escala"];

export const PLAZOS = [
  { valor: "pronto", etiqueta: "Lo antes posible" },
  { valor: "meses", etiqueta: "En 1 a 3 meses" },
  { valor: "sin_afan", etiqueta: "Sin afán" },
] as const;

// El reto se guarda como un solo texto: lo que intentaron y el plazo van al final, para que el
// equipo los lea al curar. Sin columnas nuevas en la base.
export function componerReto(reto: string, intentado: string, plazo: string) {
  const partes = [reto.trim()];
  if (intentado.trim()) partes.push(`Lo que hemos intentado: ${intentado.trim()}`);
  const p = PLAZOS.find((x) => x.valor === plazo);
  if (p) partes.push(`Para cuándo: ${p.etiqueta}.`);
  return partes.join("\n\n").slice(0, 3000);
}
