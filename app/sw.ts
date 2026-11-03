import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";
import { borrarCachesPrivadas } from "../lib/privacidad/cache";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Una lista de exclusiones siempre deja fuera una ruta nueva. Solo se almacenan archivos
// públicos estáticos y el aviso sin conexión. HTML, RSC, API y otros dominios van a la red.
const esEstatico = (url: URL) => url.origin === self.location.origin && (
  ["/_next/static/", "/iconos/", "/marca/", "/web/"].some(p => url.pathname.startsWith(p))
  || url.pathname === "/sin-conexion"
);
self.addEventListener("activate", event => event.waitUntil(borrarCachesPrivadas()));

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST?.filter(e => esEstatico(new URL(typeof e === "string" ? e : e.url, self.location.origin))),
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Respuestas con sesión, formularios y datos de Supabase nunca se guardan en el dispositivo.
    {
      matcher: ({ url, request }) => !esEstatico(url) || request.method !== "GET"
        || request.headers.has("rsc") || request.headers.has("next-router-state-tree") || request.headers.has("next-action"),
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
