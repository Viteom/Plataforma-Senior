import type { FormaContratar, Modalidad } from "@/lib/formas";

// Oficios que siempre se hacen en persona (cuidado, aseo, cocina, obra, campo, conducción, taller
// mecánico…). Con uno de estos oficios no se ofrece trabajo desde la casa. La excepción son las
// mentorías y los talleres, y solo si la persona lo activa.
//
// La lista vive en la tabla oficios_presenciales y la mantiene el equipo desde el panel; esta es la
// misma lista inicial, para cuando la tabla no responde y para la demostración.
export const OFICIOS_PRESENCIALES_BASE = [
  "cuidad",
  "enfermer",
  "servicios generales",
  "aseo",
  "limpieza",
  "oficios varios",
  "empleada domestica",
  "cocin",
  "chef",
  "meser",
  "mantenimiento",
  "construccion",
  "obra",
  "albanil",
  "electricista",
  "plomer",
  "jardin",
  "agricult",
  "cultiv",
  "ganader",
  "finca",
  "conduct",
  "chofer",
  "taxista",
  "mecanic",
  "taller mecanico",
  "vigilan",
  "seguridad privada",
  "peluquer",
  "manicur",
  "carpinter",
  "soldad",
];

// Formas que sí se pueden dar a distancia aunque el oficio sea presencial.
export const FORMAS_A_DISTANCIA: FormaContratar[] = ["mentoria", "experiencia"];

// Minúscula, sin tildes y solo letras: así «Cuidadora», «cuidado» y «CUIDADOR» se reconocen igual.
export const normalizarOficio = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// La palabra se busca al comienzo de una palabra del oficio: «cocin» reconoce «cocinera», pero
// «obra» no se confunde con «maniobra».
export function esOficioPresencial(oficio: string, palabras: string[] = OFICIOS_PRESENCIALES_BASE): boolean {
  const texto = ` ${normalizarOficio(oficio)}`;
  return palabras.some((p) => {
    const k = normalizarOficio(p);
    return k.length >= 3 && texto.includes(` ${k}`);
  });
}

// La modalidad que se guarda en cada forma de trabajar. Con un oficio presencial todo es
// presencial; las mentorías y los talleres pueden ser «las dos» si la persona lo activó.
export function modalidadDeLaForma(
  forma: FormaContratar,
  elegida: Modalidad,
  oficioPresencial: boolean,
  distancia: boolean,
): Modalidad {
  if (!oficioPresencial) return elegida;
  return distancia && FORMAS_A_DISTANCIA.includes(forma) ? "mixto" : "presencial";
}

// Para el panel: la palabra que escribe el equipo se guarda igual que se compara.
export function palabraValida(crudo: string): string | null {
  const k = normalizarOficio(crudo);
  return /^[a-z ]{3,40}$/.test(k) ? k : null;
}
