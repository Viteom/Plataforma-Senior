import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { Accesibilidad } from "@/components/layout/accesibilidad";
import { ToqueActivo } from "@/components/layout/toque-activo";
import { esProduccion } from "@/lib/ambiente";
import { MARCA } from "@/lib/marca";
import { supabaseConfigurado } from "@/lib/supabase/config";

import "./globals.css";

const atkinson = localFont({
  src: [
    { path: "./fonts/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/atkinsonhyperlegible/AtkinsonHyperlegible-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-atkinson",
  display: "swap",
});

// Letras de marca: solo en titulares grandes de la web. La app se lee en Atkinson.
const bricolage = localFont({
  src: [{ path: "./fonts/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf", weight: "600 800", style: "normal" }],
  variable: "--font-bricolage",
  display: "swap",
});

// Web informativa: una sans limpia para los titulares en dos tonos. La app sigue en Atkinson.
const geist = localFont({
  src: [{ path: "./fonts/geist/Geist[wght].ttf", weight: "400 600", style: "normal" }],
  variable: "--font-geist",
  display: "swap",
});

const instrument = localFont({
  src: "./fonts/instrumentserif/InstrumentSerif-Italic.ttf",
  weight: "400",
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: MARCA.nombre, template: `%s · ${MARCA.nombre}` },
  description: MARCA.descripcion,
  applicationName: MARCA.nombre,
  appleWebApp: { capable: true, title: MARCA.nombreCorto, statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // El ambiente de pruebas no debe aparecer en buscadores (la demostración sin base sí).
  ...(supabaseConfigurado && !esProduccion ? { robots: { index: false, follow: false } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6efe4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${atkinson.variable} ${bricolage.variable} ${geist.variable} ${instrument.variable}`}>
      <body className="min-h-dvh antialiased">
        {/* Aplica la letra grande y el contraste guardados antes de pintar, para que no parpadee.
            Es un archivo propio y no un script en línea: así la política de contenido lo deja pasar. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/letra-y-contraste.js" />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-on-primary"
        >
          Saltar al contenido
        </a>
        {/* Con Supabase conectado y fuera de producción: que nadie confunda pruebas con datos reales. */}
        {supabaseConfigurado && !esProduccion && (
          <p className="bg-accent px-4 py-1 text-center text-sm font-bold text-on-accent">
            Ambiente de pruebas: los datos son de ejemplo
          </p>
        )}
        {children}
        <Accesibilidad />
        <ToqueActivo />
      </body>
    </html>
  );
}
