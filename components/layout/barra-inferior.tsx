"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { estaActivo, navTalento } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

// Barra inferior del talento. El destino activo se marca con fondo, texto en negrita
// y aria-current, no solo con color.
export function BarraInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-border-subtle bg-bg pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {navTalento.map(({ href, etiqueta, icono: Icono }) => {
          const activo = estaActivo(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-18 flex-col items-center justify-center gap-1 px-1 text-sm leading-tight transition-colors duration-150",
                  activo ? "font-bold text-text" : "text-text-muted hover:text-text",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full",
                    activo && "bg-surface-strong",
                  )}
                >
                  <Icono aria-hidden className="size-6" strokeWidth={activo ? 2.5 : 2} />
                </span>
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
