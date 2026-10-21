// Orden de Explorar perfiles: coincidencia con lo que la empresa escribió en el buscador (brief).
// Sin IA: cuenta cuántas palabras de la búsqueda aparecen en el oficio y en la huella.
// Igual que el puntaje, no conoce edad, foto, graduación ni pensión.

export type PerfilBuscable = { oficio: string | null; huella: { etiqueta: string }[] };

const VACIAS = new Set(["de", "la", "el", "los", "las", "y", "en", "un", "una", "para", "con", "por", "que", "del", "al"]);

const palabras = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9ñ-]+/)
    .filter((p) => p.length > 2 && !VACIAS.has(p));

export function coincidenciaBusqueda(perfil: PerfilBuscable, busqueda: string): number {
  const buscadas = palabras(busqueda);
  if (!buscadas.length) return 0;
  const texto = new Set(palabras([perfil.oficio ?? "", ...perfil.huella.map((h) => h.etiqueta)].join(" ")));
  // Coincidencia por prefijo: "certific" encuentra "certificación".
  const halladas = buscadas.filter((b) => [...texto].some((t) => t.startsWith(b) || b.startsWith(t)));
  return halladas.length / buscadas.length;
}

export function ordenarPorBusqueda<T extends PerfilBuscable>(perfiles: T[], busqueda: string): T[] {
  if (!busqueda.trim()) return perfiles;
  return perfiles
    .map((p) => ({ p, c: coincidenciaBusqueda(p, busqueda) }))
    .filter(({ c }) => c > 0)
    .sort((a, b) => b.c - a.c)
    .map(({ p }) => p);
}
