import Link from "next/link";

import { iconoAyuda as IconoAyuda } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

// La salida humana: presente en el encabezado de todas las pantallas, con texto visible.
// «lleno»: la píldora azul noche de las pantallas del talento, la misma línea de la web.
export function BotonAyuda({ className, tono = "borde" }: { className?: string; tono?: "borde" | "lleno" }) {
  if (tono === "lleno")
    return (
      <Link
        href="/ayuda"
        data-no-leer
        className={cn(
          "inline-flex min-h-tap items-center gap-2 rounded-full bg-primary py-1 pr-4 pl-1.5 text-base font-bold text-on-primary transition-transform duration-100 ease-out active:scale-[0.97]",
          className,
        )}
      >
        <span className="grid size-8 place-items-center rounded-full bg-accent text-on-accent">
          <IconoAyuda aria-hidden className="size-5" />
        </span>
        Ayuda
      </Link>
    );
  return (
    <Link
      href="/ayuda"
      className={cn(
        "inline-flex min-h-tap items-center gap-2 rounded-md border-2 border-text bg-bg px-3 text-base font-bold text-text transition-[background-color,transform] duration-100 ease-out hover:bg-surface active:scale-[0.97] active:bg-surface-strong",
        className,
      )}
    >
      <IconoAyuda aria-hidden className="size-6" />
      Ayuda
    </Link>
  );
}
