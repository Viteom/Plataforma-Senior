import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Service worker de la PWA. Apagado en desarrollo para no servir pantallas viejas.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // La sección de experiencias pasó a llamarse Talento del campo.
  async redirects() {
    return [
      {
        source: "/empresa/experiencias",
        destination: "/empresa/campo",
        permanent: true,
      },
      {
        source: "/empresa/experiencias/:slug",
        destination: "/empresa/campo/:slug",
        permanent: true,
      },
    ];
  },
  // El lector corre en un subproceso: conserva su script y dependencias al empaquetar.
  outputFileTracingIncludes: {
    "/*": [
      "./scripts/leer-hoja-vida.mjs",
      "./node_modules/pdfjs-dist/**",
      "./node_modules/@napi-rs/canvas/**",
      "./node_modules/@napi-rs/canvas-linux-x64-gnu/**",
      "./node_modules/mammoth/**",
      "./node_modules/@xmldom/xmldom/**",
      "./node_modules/mammoth/node_modules/argparse/**",
      "./node_modules/sprintf-js/**",
      "./node_modules/base64-js/**",
      "./node_modules/dingbat-to-unicode/**",
      "./node_modules/jszip/**",
      "./node_modules/lie/**",
      "./node_modules/immediate/**",
      "./node_modules/pako/**",
      "./node_modules/readable-stream/**",
      "./node_modules/core-util-is/**",
      "./node_modules/inherits/**",
      "./node_modules/readable-stream/node_modules/isarray/**",
      "./node_modules/process-nextick-args/**",
      "./node_modules/safe-buffer/**",
      "./node_modules/string_decoder/**",
      "./node_modules/util-deprecate/**",
      "./node_modules/setimmediate/**",
      "./node_modules/lop/**",
      "./node_modules/duck/**",
      "./node_modules/underscore/**",
      "./node_modules/option/**",
      "./node_modules/xmlbuilder/**",
      "./node_modules/word-extractor/**",
      "./node_modules/saxes/**",
      "./node_modules/xmlchars/**",
      "./node_modules/yauzl/**",
      "./node_modules/fd-slicer/**",
      "./node_modules/pend/**",
      "./node_modules/buffer-crc32/**",
    ],
  },
  experimental: {
    // El registro asistido envía foto, audio de la historia y firma juntos.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default withSerwist(nextConfig);
