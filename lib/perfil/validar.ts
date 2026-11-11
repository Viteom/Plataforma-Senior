import { esForma, type FormaContratar, type Modalidad } from "@/lib/formas";
import { esHogar, esSituacion, type Hogar, type SituacionIngresos } from "@/lib/ingresos";

// Validación del perfil en 3 pasos. La usan el formulario (para no avanzar con errores) y la
// acción del servidor (que nunca confía en lo que llega del navegador).

// Versión del texto de autorización de datos. Cambia cuando el abogado apruebe el texto final.
export const VERSION_AUTORIZACION = "v0-borrador-2026-10";

export type BorradorPerfil = {
  nombre: string;
  ubicacion: string;
  oficio: string;
  requisito: "edad" | "experiencia" | "ninguno" | "";
  formas: string[];
  horas: string;
  modalidad: string;
  tarifas: Record<string, string>;
  orientacion: boolean;
  // Opcional y privado: pensión o subsidio, solo para avisarle a la persona (nunca al matching).
  ingresos: SituacionIngresos | "";
  hogar: Hogar | "";
  // Privados (talent_private): nunca los ve una organización ni entran al matching.
  pais: string;
  ciudadTrabajo: string;
  postura: Postura | "";
  movilidad: Movilidad | "";
  cedula: string;
  sexo: Sexo | "";
  // Oficio presencial: las mentorías y los talleres también pueden ser desde la casa.
  distancia: boolean;
  visibilidad: string;
  autorizo: boolean;
  // «Entrar ya y completar después»: guarda con lo mínimo (paso 1) y lo demás se llena en Mi perfil.
  despues: boolean;
};

export type Postura = "de_pie" | "con_silla" | "igual";
export type Movilidad = "toda_la_ciudad" | "cerca" | "sin_desplazarme";
export type Sexo = "hombre" | "mujer" | "otro" | "no_dice";

export const POSTURAS: { valor: Postura; etiqueta: string }[] = [
  { valor: "de_pie", etiqueta: "De pie o caminando" },
  { valor: "con_silla", etiqueta: "Con silla, la mayor parte del tiempo" },
  { valor: "igual", etiqueta: "Me da igual" },
];
export const MOVILIDADES: { valor: Movilidad; etiqueta: string }[] = [
  { valor: "toda_la_ciudad", etiqueta: "Me muevo por toda la ciudad" },
  { valor: "cerca", etiqueta: "Prefiero cerca de mi casa" },
  { valor: "sin_desplazarme", etiqueta: "Prefiero no desplazarme" },
];
export const SEXOS: { valor: Sexo; etiqueta: string }[] = [
  { valor: "mujer", etiqueta: "Mujer" },
  { valor: "hombre", etiqueta: "Hombre" },
  { valor: "otro", etiqueta: "Otro" },
  { valor: "no_dice", etiqueta: "Prefiero no decirlo" },
];
export const PAISES = ["Colombia", "Venezuela", "Ecuador", "Perú", "Panamá", "Estados Unidos", "España", "Otro país"];

// Horas a la semana en tres respuestas sencillas; «otro número» abre el campo.
export const HORAS_RAPIDAS: { valor: string; etiqueta: string }[] = [
  { valor: "10", etiqueta: "Unas pocas (hasta 10)" },
  { valor: "20", etiqueta: "Medio tiempo (unas 20)" },
  { valor: "40", etiqueta: "Casi todo el día (unas 40)" },
];

const esPostura = (v: unknown): v is Postura => POSTURAS.some((x) => x.valor === v);
const esMovilidad = (v: unknown): v is Movilidad => MOVILIDADES.some((x) => x.valor === v);
const esSexo = (v: unknown): v is Sexo => SEXOS.some((x) => x.valor === v);

// La cédula se escribe como sea («1.023.456-7», con espacios); se guarda solo con letras y números.
export const limpiarCedula = (v: string) => v.replace(/[\s.\-]/g, "");
const cedulaValida = (v: string) => /^[A-Za-z0-9]{4,15}$/.test(v);

export type PerfilValido = {
  nombre: string;
  ubicacion: string;
  oficio: string;
  requisito: "edad" | "experiencia";
  formas: FormaContratar[];
  horas: number | null;
  modalidad: Modalidad;
  tarifas: Partial<Record<FormaContratar, number>>;
  orientacion: boolean;
  ingresos: SituacionIngresos | null;
  hogar: Hogar | null;
  pais: string;
  ciudadTrabajo: string | null;
  postura: Postura | null;
  movilidad: Movilidad | null;
  cedula: string | null;
  sexo: Sexo | null;
  distancia: boolean;
  visibilidad: "reservado" | "visible";
};

export type Errores = Partial<Record<keyof BorradorPerfil | "general", string>>;

export const borradorVacio: BorradorPerfil = {
  nombre: "",
  ubicacion: "",
  oficio: "",
  requisito: "",
  formas: [],
  horas: "",
  modalidad: "presencial",
  tarifas: {},
  orientacion: false,
  ingresos: "",
  hogar: "",
  pais: "Colombia",
  ciudadTrabajo: "",
  postura: "",
  movilidad: "",
  cedula: "",
  sexo: "",
  distancia: false,
  despues: false,
  visibilidad: "reservado",
  autorizo: false,
};

const texto = (v: string, min: number, max: number) => {
  const t = v.replace(/\s+/g, " ").trim();
  return t.length >= min && t.length <= max ? t : null;
};

// Valida los campos de un paso (1, 2 o 3). Devuelve los errores de ese paso.
export function erroresDelPaso(b: BorradorPerfil, paso: 1 | 2 | 3): Errores {
  const e: Errores = {};
  if (paso === 1) {
    if (!texto(b.nombre, 2, 80)) e.nombre = "Escribe tu nombre.";
    if (!texto(b.ubicacion, 2, 80)) e.ubicacion = "Escribe la ciudad o vereda donde vives.";
    if (!texto(b.pais, 2, 60)) e.pais = "Elige el país donde vives.";
    if (!texto(b.oficio, 2, 120)) e.oficio = "Cuéntanos en pocas palabras a qué te has dedicado.";
    if (b.requisito !== "edad" && b.requisito !== "experiencia") {
      e.requisito = b.requisito === "ninguno" ? "Por ahora no podemos seguir." : "Elige una opción.";
    }
    // La autorización va en el paso 1: sin ella no se guarda nada, ni siquiera el perfil mínimo.
    if (!b.autorizo) e.autorizo = "Para crear tu perfil necesitamos tu autorización.";
  }
  if (paso === 2) {
    // Quien entra ya y completa después puede dejar las formas en blanco.
    if (!b.formas.every(esForma) || (!b.formas.length && !b.despues)) e.formas = "Elige al menos una forma de trabajar.";
    if (b.horas.trim()) {
      const h = Number(b.horas);
      if (!Number.isInteger(h) || h < 1 || h > 48) e.horas = "Escribe un número de horas entre 1 y 48.";
    }
    if (!["presencial", "remoto", "mixto"].includes(b.modalidad)) e.modalidad = "Elige una opción.";
    if (b.ciudadTrabajo.trim() && !texto(b.ciudadTrabajo, 2, 80)) e.ciudadTrabajo = "Escribe la ciudad o el municipio.";
    for (const [forma, valor] of Object.entries(b.tarifas)) {
      if (!b.formas.includes(forma) || !valor.trim()) continue;
      const n = Number(valor.replace(/[^\d]/g, ""));
      if (!Number.isFinite(n) || n <= 0) e.tarifas = "Escribe la tarifa solo con números, sin puntos.";
    }
  }
  if (paso === 3) {
    if (b.visibilidad !== "reservado" && b.visibilidad !== "visible") e.visibilidad = "Elige una opción.";
    const cedula = limpiarCedula(b.cedula);
    if (cedula && !cedulaValida(cedula)) e.cedula = "Revisa el número: solo números (y letras si es un documento de otro país).";
  }
  return e;
}

export function validarPerfil(b: BorradorPerfil): { ok: true; perfil: PerfilValido } | { ok: false; errores: Errores; paso: 1 | 2 | 3 } {
  for (const paso of [1, 2, 3] as const) {
    const errores = erroresDelPaso(b, paso);
    if (Object.keys(errores).length) return { ok: false, errores, paso };
  }
  const formas = b.formas.filter(esForma);
  const tarifas: PerfilValido["tarifas"] = {};
  for (const f of formas) {
    const n = Number((b.tarifas[f] ?? "").replace(/[^\d]/g, ""));
    if (n > 0) tarifas[f] = n;
  }
  return {
    ok: true,
    perfil: {
      nombre: texto(b.nombre, 2, 80)!,
      ubicacion: texto(b.ubicacion, 2, 80)!,
      oficio: texto(b.oficio, 2, 120)!,
      requisito: b.requisito as "edad" | "experiencia",
      formas,
      horas: b.horas.trim() ? Number(b.horas) : null,
      modalidad: b.modalidad as Modalidad,
      tarifas,
      orientacion: b.orientacion,
      ingresos: b.ingresos || null,
      hogar: b.ingresos === "colombia_mayor" && b.hogar ? b.hogar : null,
      pais: texto(b.pais, 2, 60)!,
      ciudadTrabajo: texto(b.ciudadTrabajo, 2, 80),
      postura: b.postura || null,
      movilidad: b.movilidad || null,
      cedula: limpiarCedula(b.cedula) || null,
      sexo: b.sexo || null,
      distancia: b.distancia,
      visibilidad: b.visibilidad as "reservado" | "visible",
    },
  };
}

// El formulario envía todo el borrador en un campo oculto; esto lo reconstruye sin confiar en él.
export function leerBorrador(crudo: unknown): BorradorPerfil {
  let datos: Record<string, unknown> = {};
  try {
    datos = typeof crudo === "string" ? JSON.parse(crudo) : {};
  } catch {
    datos = {};
  }
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const tarifas: Record<string, string> = {};
  if (datos.tarifas && typeof datos.tarifas === "object") {
    for (const [k, v] of Object.entries(datos.tarifas as Record<string, unknown>)) tarifas[k] = s(v);
  }
  return {
    nombre: s(datos.nombre),
    ubicacion: s(datos.ubicacion),
    oficio: s(datos.oficio),
    requisito: (["edad", "experiencia", "ninguno"].includes(s(datos.requisito)) ? s(datos.requisito) : "") as BorradorPerfil["requisito"],
    formas: Array.isArray(datos.formas) ? datos.formas.map(s) : [],
    horas: s(datos.horas),
    modalidad: s(datos.modalidad),
    tarifas,
    orientacion: datos.orientacion === true,
    ingresos: esSituacion(datos.ingresos) ? datos.ingresos : "",
    hogar: esHogar(datos.hogar) ? datos.hogar : "",
    // Sin país (borradores de antes) se asume Colombia.
    pais: s(datos.pais) || "Colombia",
    ciudadTrabajo: s(datos.ciudadTrabajo),
    postura: esPostura(datos.postura) ? datos.postura : "",
    movilidad: esMovilidad(datos.movilidad) ? datos.movilidad : "",
    cedula: s(datos.cedula),
    sexo: esSexo(datos.sexo) ? datos.sexo : "",
    distancia: datos.distancia === true,
    visibilidad: s(datos.visibilidad),
    autorizo: datos.autorizo === true,
    despues: datos.despues === true,
  };
}
