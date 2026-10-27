import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Respuestas con sesión, formularios y datos de Supabase nunca se guardan en el dispositivo.
    {
      matcher: ({ url }) =>
        [
          "/bienestar",
          "/mi-perfil",
          "/oportunidades",
          "/empresa",
          "/equipo",
          "/gestor",
          "/perfil",
          "/huella",
          "/entrar",
          "/inicio",
        ].some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`)) ||
        url.hostname.endsWith(".supabase.co"),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  // Sin señal y sin la página en caché: mostrar un aviso claro en vez del error del navegador.
  fallbacks: {
    entries: [
      {
        url: "/sin-conexion",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
