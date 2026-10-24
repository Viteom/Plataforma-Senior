"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { MENU_WEB } from "@/lib/web/contenido";

const activa = (ruta: string, href: string) => ruta === href || ruta.startsWith(`${href}/`);

// Menú de la web: en pantalla grande, enlaces a la vista; en celular, un desplegable que funciona
// sin script (<details>).
export function EnlacesWeb() {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {MENU_WEB.map(({ href, etiqueta }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={activa(ruta, href) ? "page" : undefined}
              className="inline-flex min-h-tap items-center rounded-full px-4 text-lg font-bold transition-colors duration-150 hover:bg-surface aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
            >
              {etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MenuCelular() {
  const ruta = usePathname();
  return (
    // Se vuelve a montar al cambiar de página para que el menú quede cerrado.
    <details key={ruta} className="group relative lg:hidden">
      <summary className="inline-flex min-h-tap list-none items-center gap-2 rounded-full border-2 border-text px-4 text-base font-bold transition-colors duration-150 hover:bg-surface [&::-webkit-details-marker]:hidden">
        <Menu aria-hidden className="size-6 group-open:hidden" />
        <X aria-hidden className="hidden size-6 group-open:block" />
        Menú
      </summary>
      <nav
        aria-label="Principal"
        className="absolute top-full right-0 z-40 mt-2 hidden group-open:block w-[min(20rem,calc(100vw-2rem))] rounded-md bg-raised p-2 shadow-float"
      >
        <ul className="flex flex-col">
          {MENU_WEB.map(({ href, etiqueta }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={activa(ruta, href) ? "page" : undefined}
                className={cn(
                  "flex min-h-action items-center rounded-sm px-4 text-lg font-bold hover:bg-surface",
                  "aria-[current=page]:bg-surface",
                )}
              >
                {etiqueta}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/confianza" className="flex min-h-action items-center rounded-sm px-4 text-lg font-bold hover:bg-surface">
              Confianza
            </Link>
          </li>
        </ul>
      </nav>
    </details>
  );
}
