// Revisión local de la historia ANTES de enviarla a un proveedor de IA
// (docs/ia-desde-moai.md, sección 3). Sin dependencias de servidor: el formulario la usa también
// para avisarle a la persona qué se va a reemplazar.
//
// Regla 1: lo que el modelo no recibe no lo puede convertir en etiqueta. Por eso años, fechas,
// edades y tiempos de servicio salen como [fecha] o [tiempo]. La persona sigue viendo su texto
// original; el reemplazo solo afecta lo que sale hacia el proveedor.

export type Preparacion = {
  texto: string;
  reemplazos: { fechas: number; tiempos: number; contacto: number; documentos: number; nombre: number };
  // Posibles nombres de otras personas: se le muestran para que los cambie por el cargo.
  nombresPosibles: string[];
};

const MESES = "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre";
const NUMEROS_LETRA =
  "dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|veinticinco|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta";

// Orden importante: primero lo más específico.
const PATRONES: { tipo: keyof Preparacion["reemplazos"]; re: RegExp; por: string }[] = [
  { tipo: "contacto", re: /[\w.+-]+@[\w-]+(\.[\w-]+)+/g, por: "[correo]" },
  { tipo: "contacto", re: /(\+?57[\s-]?)?\b3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g, por: "[celular]" },
  {
    tipo: "documentos",
    re: /\b(c\.?\s?c\.?|c[ée]dula|nit|documento|pasaporte)\s*(n[oº°.]*\s*)?:?\s*[\d.\s-]{6,}\d/gi,
    por: "[documento]",
  },
  { tipo: "documentos", re: /\b\d{1,3}(\.\d{3}){2,3}\b/g, por: "[número]" },
  // Edades y tiempos: "cuando tenía 30", "a los 25 años", "llevo 20 años", "treinta años".
  { tipo: "tiempos", re: /\b(cuando\s+)?ten[ií]a\s+\d{1,2}(\s+años)?/gi, por: "[tiempo]" },
  { tipo: "tiempos", re: /\ba\s+los\s+\d{1,2}(\s+años)?\b/gi, por: "[tiempo]" },
  { tipo: "tiempos", re: /\b\d{1,2}\s+años(\s+de\s+edad)?\b/gi, por: "[tiempo]" },
  { tipo: "tiempos", re: new RegExp(`\\b(${NUMEROS_LETRA})\\s+años\\b`, "gi"), por: "[tiempo]" },
  // Fechas: "14 de marzo de 1998", "14/03/1998", "en 1998", "en el 98", "los años 80".
  { tipo: "fechas", re: new RegExp(`\\b\\d{1,2}\\s+de\\s+(${MESES})(\\s+(de|del)\\s+\\d{2,4})?`, "gi"), por: "[fecha]" },
  { tipo: "fechas", re: new RegExp(`\\b(${MESES})\\s+(de|del)\\s+\\d{2,4}\\b`, "gi"), por: "[fecha]" },
  { tipo: "fechas", re: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, por: "[fecha]" },
  { tipo: "fechas", re: /\b(19[3-9]\d|20[0-4]\d)\b/g, por: "[fecha]" },
  { tipo: "fechas", re: /\b(los\s+)?años\s+'?\d{2}\b/gi, por: "[fecha]" },
  { tipo: "fechas", re: /\b(en\s+el|del|en\s+los)\s+'?\d{2}\b/gi, por: "[fecha]" },
];

const quitarTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Palabras con mayúscula que no son nombres de personas.
const NO_NOMBRES = new Set(
  [
    "invima", "dian", "sena", "ica", "retie", "niif", "iso", "sg-sst", "nsr-10", "eps", "ips", "arl",
    "colombia", "antioquia", "medellín", "bogotá", "cali", "barranquilla", "cartagena", "rionegro",
    "valle", "aburrá", "cundinamarca", "santander", "boyacá", "nariño", "cauca", "caldas", "risaralda",
    "quindío", "tolima", "huila", "meta", "córdoba", "sucre", "bolívar", "atlántico", "magdalena",
    "cesar", "guajira", "chocó", "pasto", "manizales", "pereira", "armenia", "ibagué", "neiva",
    "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo", "dios",
  ].map((p) => quitarTildes(p)),
);

export function prepararHistoria(original: string, nombrePersona?: string | null): Preparacion {
  const reemplazos: Preparacion["reemplazos"] = { fechas: 0, tiempos: 0, contacto: 0, documentos: 0, nombre: 0 };
  let texto = original.replace(/\s+/g, " ").trim();

  for (const { tipo, re, por } of PATRONES) {
    texto = texto.replace(re, () => {
      reemplazos[tipo]++;
      return por;
    });
  }

  // Nombre propio al final: si fuera antes, "Ana" rompería "ana@correo.com" y el correo pasaría.
  // Completo primero, luego cada palabra (nombre o apellido).
  if (nombrePersona?.trim()) {
    const partes = nombrePersona.trim().split(/\s+/).filter((p) => p.length >= 3);
    for (const fragmento of [nombrePersona.trim(), ...partes]) {
      // Límites por letras Unicode: \b no reconoce tildes ("Ángela").
      const re = new RegExp(`(?<!\\p{L})${escapar(fragmento)}(?!\\p{L})`, "giu");
      texto = texto.replace(re, () => {
        reemplazos.nombre++;
        return "[la persona]";
      });
    }
  }

  return { texto, reemplazos, nombresPosibles: buscarNombres(texto) };
}

// Heurística sencilla: dos palabras seguidas con mayúscula que no empiezan oración ("Carlos
// Pérez"), o un tratamiento seguido de una ("don Jorge", "la doctora Marta"). No es perfecta: por
// eso la historia completa nunca se muestra a una empresa.
export function buscarNombres(texto: string): string[] {
  const encontrados = new Set<string>();
  const palabra = "[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+";
  const tratamiento = /\b(don|doña|señor|señora|sr\.|sra\.|ingeniero|ingeniera|doctor|doctora|dr\.|dra\.|profesor|profesora)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/g;
  for (const m of texto.matchAll(tratamiento)) encontrados.add(m[2]);

  const pares = new RegExp(`(^|[^.!?¿¡\\s]\\s+)(${palabra}(?:\\s+${palabra})+)`, "g");
  for (const m of texto.matchAll(pares)) {
    const candidato = m[2];
    const palabras = candidato.split(/\s+/);
    if (palabras.some((p) => NO_NOMBRES.has(quitarTildes(p.toLowerCase())))) continue;
    // Al inicio de una oración la primera mayúscula no cuenta.
    const inicio = m.index === 0 || /[.!?¿¡]\s*$/.test(texto.slice(0, m.index + m[1].length));
    if (inicio && palabras.length < 3) continue;
    encontrados.add(candidato);
  }
  return [...encontrados];
}
