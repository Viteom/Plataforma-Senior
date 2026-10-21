"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MARCA } from "@/lib/marca";
import { estaActivo, navEquipo } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

import { BotonAyuda } from "./boton-ayuda";
import { BotonSalir } from "./boton-salir";

// Equipo: barra lateral en escritorio, bloque superior en celular.
export function BarraEquipo() {
  const pathname = usePathname();

  return (
    <aside className="border-b-2 border-border-subtle bg-surface lg:sticky lg:top-0 lg:h-dvh lg:w-72 lg:shrink-0 lg:border-r-2 lg:border-b-0">
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/equipo" className="inline-flex min-h-tap flex-col justify-center">
            <span className="text-lg font-bold">{MARCA.nombre}</span>
            <span className="text-sm text-text-muted">Equipo</span>
          </Link>
          <BotonAyuda className="lg:hidden" />
        </div>
        <nav aria-label="Principal">
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navEquipo.map(({ href, etiqueta, icono: Icono }) => {
              const activo = estaActivo(pathname, href, ["/equipo"]);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "flex min-h-tap items-center gap-3 rounded-md px-3 py-2 text-base transition-colors duration-150",
                      activo
                        ? "bg-bg font-bold text-text ring-2 ring-text"
                        : "text-text-muted hover:bg-bg hover:text-text",
                    )}
                  >
                    <Icono aria-hidden className="size-5 shrink-0" />
                    {etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <BotonAyuda className="hidden self-start lg:inline-flex" />
          <BotonSalir />
        </div>
      </div>
    </aside>
  );
}
