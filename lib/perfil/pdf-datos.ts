import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

// «Descargar mis datos» en PDF: un documento que la persona puede leer, imprimir o guardar, en vez
// de un .json que nadie sabe abrir. Se arma en el navegador con los mismos datos de la descarga
// (Ley 1581): nada sale a otro servicio. Siempre lleva la nota de protección de datos.

export const NOTA_PROTECCION = [
  "Kánna trata tus datos según la Ley 1581 de 2012 de Colombia (protección de datos personales).",
  "Este documento tiene toda la información que guardamos de tu cuenta. Es tuyo: guárdalo en un lugar seguro y no lo compartas con personas que no conoces.",
  "Tu edad nunca la ve una empresa. Tu fecha de nacimiento y tu autorización de datos las guarda el equipo aparte; puedes pedirlas desde Ayuda.",
  "Puedes corregir o borrar tus datos cuando quieras desde Mi perfil. Nadie de Kánna ni de una organización te va a pedir dinero.",
];

const SECCIONES: Record<string, string> = {
  cuenta: "Tu cuenta",
  perfil: "Tu perfil",
  formas_de_trabajar: "Cómo quieres trabajar",
  historias: "Tus historias",
  huella: "Tu huella",
  evidencias: "Tus evidencias",
  solicitudes_de_ayuda: "Lo que le pediste al equipo",
  metas_privadas: "Tus metas (privadas)",
  seguimiento_bienestar: "Cómo te has sentido",
  como_recibir_pagos: "Cómo recibes tus pagos",
};

const CAMPOS: Record<string, string> = {
  celular: "Celular",
  correo: "Correo",
  nombre: "Nombre",
  ubicacion: "Lugar",
  oficio: "Oficio",
  resumen: "Resumen",
  visibilidad: "Quién ve tu perfil",
  estado: "Estado",
  created_at: "Fecha",
  creado_en: "Fecha",
  actualizado_en: "Actualizado",
  zona_local: "Barrio o vereda",
  tipo: "Forma",
  horas_semana: "Horas a la semana",
  modalidad: "Dónde",
  tarifa_esperada: "Valor esperado",
  texto: "Texto",
  origen: "Cómo la contaste",
  capa: "Parte de la huella",
  etiqueta: "Etiqueta",
  confirmada: "Confirmada",
  descripcion: "Descripción",
  referencia_nombre: "Referencia",
  referencia_telefono: "Teléfono de la referencia",
  canal: "Por dónde",
  motivo: "Motivo",
  horas_meta: "Meta de horas",
  ingreso_meta: "Meta de ingreso",
  consentimiento_en: "Autorizaste el",
  energia: "Energía",
  trato_respetuoso: "Trato respetuoso",
  pago_a_tiempo: "Pago a tiempo",
  quiere_contacto: "Pediste contacto",
  metodo: "Método",
};
// Identificadores internos: no le dicen nada a la persona.
const OCULTOS = new Set(["connection_id", "id", "talent_id", "user_id"]);

function valor(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// Helvetica estándar solo dibuja el juego de letras de Windows (tildes y ñ sí; emojis no).
const EXTRA = new Set("–—‘’“”•…€·¿¡".split(""));
function limpiar(t: string) {
  return [...t].filter((c) => c === "\n" || (c >= " " && c.charCodeAt(0) <= 255) || EXTRA.has(c)).join("");
}

export type LineaPdf = { texto: string; tipo: "titulo" | "seccion" | "subtitulo" | "texto" | "nota" };

// Convierte la descarga en líneas legibles. Separado del dibujo para poder probarlo.
export function lineasDatos(datos: Record<string, unknown>): LineaPdf[] {
  const l: LineaPdf[] = [{ texto: "Mis datos en Kánna", tipo: "titulo" }];
  if (typeof datos.descargado_en === "string") l.push({ texto: `Descargado el ${valor(datos.descargado_en)}`, tipo: "texto" });
  l.push({ texto: "Cómo cuidamos tus datos", tipo: "seccion" });
  NOTA_PROTECCION.forEach((t) => l.push({ texto: t, tipo: "nota" }));

  for (const [clave, titulo] of Object.entries(SECCIONES)) {
    if (!(clave in datos)) continue;
    l.push({ texto: titulo, tipo: "seccion" });
    const v = datos[clave];
    const filas = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
    if (!filas.length) {
      l.push({ texto: "Sin datos.", tipo: "texto" });
      continue;
    }
    filas.forEach((fila, i) => {
      if (Array.isArray(v) && filas.length > 1) l.push({ texto: `${i + 1}.`, tipo: "subtitulo" });
      for (const [k, x] of Object.entries(fila as Record<string, unknown>)) {
        if (OCULTOS.has(k)) continue;
        l.push({ texto: `${CAMPOS[k] ?? k.replace(/_/g, " ")}: ${valor(x)}`, tipo: "texto" });
      }
    });
  }
  return l;
}

const ESTILO = {
  titulo: { tam: 22, negrita: true, antes: 0 },
  seccion: { tam: 16, negrita: true, antes: 18 },
  subtitulo: { tam: 13, negrita: true, antes: 8 },
  texto: { tam: 13, negrita: false, antes: 4 },
  nota: { tam: 12, negrita: false, antes: 4 },
} as const;

function partir(texto: string, fuente: PDFFont, tam: number, ancho: number): string[] {
  const salida: string[] = [];
  for (const parrafo of texto.split("\n")) {
    let linea = "";
    for (const palabra of parrafo.split(" ")) {
      const prueba = linea ? `${linea} ${palabra}` : palabra;
      if (fuente.widthOfTextAtSize(prueba, tam) <= ancho) linea = prueba;
      else {
        if (linea) salida.push(linea);
        linea = palabra;
      }
    }
    salida.push(linea);
  }
  return salida;
}

export async function pdfDatos(datos: Record<string, unknown>): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Mis datos en Kánna");
  doc.setLanguage("es-CO");
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const [ANCHO, ALTO, MARGEN] = [595, 842, 56];
  const tinta = rgb(0.1, 0.12, 0.2);
  let pagina: PDFPage = doc.addPage([ANCHO, ALTO]);
  let y = ALTO - MARGEN;

  for (const { texto, tipo } of lineasDatos(datos)) {
    const e = ESTILO[tipo];
    const fuente = e.negrita ? negrita : normal;
    y -= e.antes;
    for (const linea of partir(limpiar(texto), fuente, e.tam, ANCHO - MARGEN * 2)) {
      if (y - e.tam < MARGEN) {
        pagina = doc.addPage([ANCHO, ALTO]);
        y = ALTO - MARGEN;
      }
      y -= e.tam * 1.35;
      pagina.drawText(linea, { x: MARGEN, y, size: e.tam, font: fuente, color: tinta });
    }
  }
  return doc.save();
}
