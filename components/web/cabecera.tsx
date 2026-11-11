"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/marca/logo";
import { cn } from "@/lib/utils";

import { MARCO } from "./marco";

// Dos puertas: Soy talento y Soy empresa (Talento del campo vive dentro de la ruta de talento).
// En el home y en las portadas oscuras (Soy talento, Soy empresa) va transparente sobre el banner y
// se vuelve sólida al bajar; en las demás páginas es sólida desde el principio. La ayuda es el botón flotante (components/web/ayuda-flotante.tsx).
const CON_PORTADA_OSCURA = ["/", "/talento", "/organizaciones"];

export function CabeceraWeb() {
  const enHome = CON_PORTADA_OSCURA.includes(usePathname());
  const [solida, setSolida] = useState(!enHome);

  useEffect(() => {
    if (!enHome) {
      setSolida(true);
      return;
    }
    const revisar = () => setSolida(window.scrollY > window.innerHeight * 0.75);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, [enHome]);

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-30 transition-[background-color,box-shadow] duration-200",
        enHome ? "fixed" : "sticky",
        !solida ? "bg-transparent" : enHome ? "bg-neutro/95 shadow-[0_1px_0_var(--color-border-subtle)] backdrop-blur" : "bg-bg",
      )}
    >
      <div className={cn(MARCO, "flex min-h-20 items-center gap-2 font-web sm:gap-3")}>
        <Link href="/" className="mr-auto inline-flex min-h-tap shrink-0 items-center">
          <Logo alto={30} negativo={!solida} className="max-sm:!w-[84px]" />
        </Link>
        <Link
          href="/entrar"
          className={cn(
            "hidden min-h-tap items-center px-3 text-base font-medium underline-offset-4 hover:underline md:inline-flex",
            solida ? "text-tinta" : "text-white",
          )}
        >
          Entrar
        </Link>
        <Link
          href="/talento"
          className="inline-flex min-h-tap items-center rounded-full bg-accent px-3.5 text-sm whitespace-nowrap font-semibold text-on-accent transition-colors hover:bg-accent-hover sm:min-h-12 sm:px-5 sm:text-base"
        >
          Soy talento
        </Link>
        <Link
          href="/organizaciones"
          className={cn(
            "inline-flex min-h-tap items-center rounded-full px-3.5 text-sm whitespace-nowrap font-semibold ring-2 ring-inset transition-colors sm:min-h-12 sm:px-5 sm:text-base",
            solida ? "text-tinta ring-tinta hover:bg-neutro-2" : "text-white ring-white/70 hover:bg-white/10",
          )}
        >
          Soy empresa
        </Link>
      </div>
    </header>
  );
}
