// Íconos de la app a partir de los logos del brandbook de Kánna (public/marca/):
// `node scripts/generar-iconos.mjs`
import { readFileSync } from "node:fs";

import sharp from "sharp";

const archivo = (nombre) => readFileSync(`public/marca/${nombre}`);

// Maskable: Android recorta en círculo, así que el símbolo va al 60 % sobre cobalto.
const simbolo = readFileSync("public/marca/kanna-simbolo-negativo.svg", "utf8")
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1E3BFF"/>
  <g transform="translate(102 102) scale(2.85)"><g transform="translate(4 4)">${simbolo}</g></g>
</svg>`;

const salidas = [
  ["public/iconos/icono-192.png", 192, archivo("kanna-icono-app.svg")],
  ["public/iconos/icono-512.png", 512, archivo("kanna-icono-app.svg")],
  ["public/iconos/icono-maskable-512.png", 512, Buffer.from(maskable)],
  ["app/apple-icon.png", 180, archivo("kanna-simbolo-fondo.svg")], // iOS redondea solo
  ["app/icon.png", 64, archivo("kanna-favicon.svg")],
];

for (const [ruta, tam, svg] of salidas) {
  await sharp(svg, { density: 300 }).resize(tam, tam).png().toFile(ruta);
  console.log(ruta);
}
