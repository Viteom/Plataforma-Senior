"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { estaActivo, navTalento, type ItemNav } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

// Barra inferior del celular (talento y organización). El destino activo se marca con fondo,
// texto en negrita y aria-current, no solo con color. Responde al tocar, no al soltar.
export function BarraInferior({ items = navTalento, className }: { items?: ItemNav[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className={cn("fixed inset-x-0 bottom-0 z-20 border-t-2 border-border-subtle bg-bg pb-[env(safe-area-inset-bottom)]", className)}
    >
      <ul className="mx-auto grid max-w-xl px-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ href, etiqueta, corta, icono: Icono }) => {
          const activo = estaActivo(pathname, href, ["/empresa"]);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "group flex min-h-18 flex-col items-center justify-center gap-1 px-1 text-center text-sm leading-tight transition-colors duration-150",
                  activo ? "font-bold text-text" : "text-text-muted hover:text-text",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-[background-color,transform] duration-100 group-active:scale-90 group-active:bg-surface-strong",
                    activo && "bg-surface-strong",
                  )}
                >
                  <Icono aria-hidden className="size-6" strokeWidth={activo ? 2.5 : 2} />
                </span>
                {corta ?? etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
