"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/marca/logo";
import { estaActivo, navEmpresa, navEmpresaCelular } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

import { BarraInferior } from "./barra-inferior";
import { BotonAyuda } from "./boton-ayuda";
import { BotonSalir } from "./boton-salir";

// En escritorio, barra superior con los destinos. Por debajo de 1280 px no caben en una fila:
// ahí van a una barra inferior como la del talento, para que el contenido empiece arriba y la
// navegación quede donde llega el pulgar.
export function BarraEmpresa() {
  const pathname = usePathname();

  return (
    <>
      <header className="border-b-2 border-border-subtle bg-bg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:gap-x-6 xl:flex-nowrap xl:px-8">
          {/* shrink-0: sin esto el logo se encoge y «Empresas» se monta sobre el menú. */}
          <Link href="/empresa" className="inline-flex min-h-tap shrink-0 items-center gap-2">
            <Logo alto={28} />
            {/* En celular no cabe junto a Salir y Ayuda; ahí el área la dice la barra inferior. */}
            <span className="hidden rounded-sm bg-surface-strong px-2 text-sm font-bold sm:inline-block">Empresas</span>
          </Link>
          <nav aria-label="Principal" className="hidden min-w-0 xl:block xl:flex-1">
            <ul className="flex gap-1">
              {navEmpresa.map(({ href, etiqueta, icono: Icono }) => {
                const activo = estaActivo(pathname, href, ["/empresa"]);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={activo ? "page" : undefined}
                      className={cn(
                        "flex min-h-tap items-center gap-2 rounded-md px-3 text-base whitespace-nowrap transition-colors duration-150 active:bg-surface-strong",
                        activo ? "bg-surface-strong font-bold text-text" : "text-text-muted hover:bg-surface hover:text-text",
                      )}
                    >
                      {/* Los íconos solo caben en pantallas muy anchas; el texto siempre va. */}
                      <Icono aria-hidden className="hidden size-5 shrink-0 2xl:block" />
                      {etiqueta}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-3 xl:ml-0">
            <Link
              href="/empresa/equipo"
              aria-current={estaActivo(pathname, "/empresa/equipo") ? "page" : undefined}
              className="hidden min-h-tap items-center px-1 text-base font-bold whitespace-nowrap underline underline-offset-4 hover:decoration-2 xl:inline-flex"
            >
              Equipo
            </Link>
            <Link
              href="/empresa/datos"
              aria-current={estaActivo(pathname, "/empresa/datos") ? "page" : undefined}
              className="hidden min-h-tap items-center px-1 text-base font-bold whitespace-nowrap underline underline-offset-4 hover:decoration-2 xl:inline-flex"
            >
              Mi empresa
            </Link>
            <BotonSalir />
            <BotonAyuda />
          </div>
        </div>
      </header>
      <BarraInferior items={navEmpresaCelular} className="xl:hidden" />
    </>
  );
}
