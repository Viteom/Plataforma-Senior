import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Service worker de la PWA. Apagado en desarrollo para no servir pantallas viejas.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
