// Íconos provisionales en gris hasta el brandbook: `node scripts/generar-iconos.mjs`
import sharp from "sharp";

const svg = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#141414"/>
  <text x="256" y="${256 + 80 - pad}" font-family="Verdana, sans-serif" font-size="${260 - pad * 2}"
        font-weight="700" fill="#ffffff" text-anchor="middle">PS</text>
</svg>`;

const salidas = [
  ["public/iconos/icono-192.png", 192, 0],
  ["public/iconos/icono-512.png", 512, 0],
  ["public/iconos/icono-maskable-512.png", 512, 30], // zona segura para recortes de Android
  ["app/apple-icon.png", 180, 0],
  ["app/icon.png", 64, 0],
];

for (const [ruta, tam, pad] of salidas) {
  await sharp(Buffer.from(svg(pad))).resize(tam, tam).png().toFile(ruta);
  console.log(ruta);
}
