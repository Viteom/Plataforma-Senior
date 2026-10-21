"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MARCA } from "@/lib/marca";
import { estaActivo, navEmpresa } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

import { BotonAyuda } from "./boton-ayuda";
import { BotonSalir } from "./boton-salir";

// Empresa trabaja en escritorio: barra superior. En pantallas pequeñas los destinos
// pasan a una cuadrícula de 2 × 2 debajo de la marca (por debajo de 1280 px no caben en una fila).
export function BarraEmpresa() {
  const pathname = usePathname();

  return (
    <header className="border-b-2 border-border-subtle bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 xl:flex-nowrap xl:px-8">
        <Link href="/empresa/explorar" className="inline-flex min-h-tap items-center text-lg font-bold">
          {MARCA.nombre}
          <span className="ml-2 rounded-sm bg-surface-strong px-2 text-sm">Empresas</span>
        </Link>
        <nav aria-label="Principal" className="order-last w-full xl:order-none xl:w-auto xl:flex-1">
          <ul className="grid grid-cols-2 gap-2 xl:flex xl:gap-1">
            {navEmpresa.map(({ href, etiqueta, icono: Icono }) => {
              const activo = estaActivo(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "flex min-h-tap items-center gap-2 rounded-md px-3 text-base transition-colors duration-150 xl:whitespace-nowrap",
                      activo
                        ? "bg-surface-strong font-bold text-text"
                        : "text-text-muted hover:bg-surface hover:text-text",
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
        <div className="ml-auto flex items-center gap-3 xl:ml-0">
          <Link
            href="/empresa/datos"
            aria-current={estaActivo(pathname, "/empresa/datos") ? "page" : undefined}
            className="inline-flex min-h-tap items-center px-1 text-base font-bold underline underline-offset-4 hover:decoration-2"
          >
            Mi empresa
          </Link>
          <BotonSalir />
          <BotonAyuda />
        </div>
      </div>
    </header>
  );
}
