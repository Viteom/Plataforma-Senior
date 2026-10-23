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
      { source: "/empresa/experiencias", destination: "/empresa/campo", permanent: true },
      { source: "/empresa/experiencias/:slug", destination: "/empresa/campo/:slug", permanent: true },
    ];
  },
  experimental: {
    // El registro asistido envía foto, audio de la historia y firma juntos.
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default withSerwist(nextConfig);
