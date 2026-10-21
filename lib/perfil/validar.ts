import { esForma, type FormaContratar, type Modalidad } from "@/lib/formas";

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
  visibilidad: string;
  autorizo: boolean;
};

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
    if (!texto(b.nombre, 2, 80)) e.nombre = "Escriba su nombre.";
    if (!texto(b.ubicacion, 2, 80)) e.ubicacion = "Escriba la ciudad o vereda donde vive.";
    if (!texto(b.oficio, 2, 120)) e.oficio = "Cuéntenos en pocas palabras a qué se ha dedicado.";
    if (b.requisito !== "edad" && b.requisito !== "experiencia") {
      e.requisito = b.requisito === "ninguno" ? "Por ahora no podemos seguir." : "Elija una opción.";
    }
  }
  if (paso === 2) {
    if (!b.formas.length || !b.formas.every(esForma)) e.formas = "Elija al menos una forma de trabajar.";
    if (b.horas.trim()) {
      const h = Number(b.horas);
      if (!Number.isInteger(h) || h < 1 || h > 48) e.horas = "Escriba un número de horas entre 1 y 48.";
    }
    if (!["presencial", "remoto", "mixto"].includes(b.modalidad)) e.modalidad = "Elija una opción.";
    for (const [forma, valor] of Object.entries(b.tarifas)) {
      if (!b.formas.includes(forma) || !valor.trim()) continue;
      const n = Number(valor.replace(/[^\d]/g, ""));
      if (!Number.isFinite(n) || n <= 0) e.tarifas = "Escriba la tarifa solo con números, sin puntos.";
    }
  }
  if (paso === 3) {
    if (b.visibilidad !== "reservado" && b.visibilidad !== "visible") e.visibilidad = "Elija una opción.";
    if (!b.autorizo) e.autorizo = "Para crear su perfil necesitamos su autorización.";
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
    visibilidad: s(datos.visibilidad),
    autorizo: datos.autorizo === true,
  };
}
