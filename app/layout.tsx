import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque, Instrument_Serif } from "next/font/google";

import { ToqueActivo } from "@/components/layout/toque-activo";
import { MARCA } from "@/lib/marca";

import "./globals.css";

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

// Letras de marca: solo en titulares grandes de la web. La app se lee en Atkinson.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: MARCA.nombre, template: `%s · ${MARCA.nombre}` },
  description: MARCA.descripcion,
  applicationName: MARCA.nombre,
  appleWebApp: { capable: true, title: MARCA.nombreCorto, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f2ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${atkinson.variable} ${bricolage.variable} ${instrument.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-on-primary"
        >
          Saltar al contenido
        </a>
        {children}
        <ToqueActivo />
      </body>
    </html>
  );
}
