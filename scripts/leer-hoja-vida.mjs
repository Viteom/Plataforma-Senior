// Proceso aislado en memoria y tiempo por la acción del servidor. Solo extrae texto; nunca HTML.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const [ruta, extension] = process.argv.slice(2);
const bytes = await readFile(ruta);
let texto = "";
if (extension === "pdf") {
  if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
    throw Error("formato");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const tarea = getDocument({
    data: new Uint8Array(bytes),
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
  });
  const doc = await tarea.promise;
  try {
    if (doc.numPages > 30) throw Error("paginas");
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const contenido = await page.getTextContent();
      texto +=
        contenido.items
          .map((x) => ("str" in x ? x.str + (x.hasEOL ? "\n" : " ") : ""))
          .join("") + "\n";
      if (texto.length > 30000) break;
    }
  } finally {
    await tarea.destroy();
  }
} else if (extension === "docx") {
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw Error("formato");
  // Rechaza archivos ZIP64, directorios truncados y expansiones grandes antes de descomprimir.
  const fin = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fin < 0 || fin + 22 > bytes.length) throw Error("zip");
  const entradas = bytes.readUInt16LE(fin + 10);
  let posicion = bytes.readUInt32LE(fin + 16);
  let total = 0;
  if (entradas > 1000 || entradas === 65535 || posicion >= bytes.length)
    throw Error("zip");
  for (let i = 0; i < entradas; i++) {
    if (posicion + 46 > fin || bytes.readUInt32LE(posicion) !== 0x02014b50)
      throw Error("zip");
    const largo = bytes.readUInt32LE(posicion + 24);
    total += largo;
    if (largo === 0xffffffff || total > 20 * 1024 * 1024)
      throw Error("zip-grande");
    posicion +=
      46 +
      bytes.readUInt16LE(posicion + 28) +
      bytes.readUInt16LE(posicion + 30) +
      bytes.readUInt16LE(posicion + 32);
  }
  texto = (
    await require("mammoth").extractRawText(
      { buffer: bytes },
      { externalFileAccess: false },
    )
  ).value;
} else if (extension === "doc") {
  if (bytes.subarray(0, 8).toString("hex") !== "d0cf11e0a1b11ae1")
    throw Error("formato");
  const Extractor = require("word-extractor");
  texto = (await new Extractor().extract(bytes)).getBody();
} else throw Error("formato");
process.stdout.write(JSON.stringify({ texto: texto.slice(0, 30000) }));
