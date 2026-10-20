import Link from "next/link";

import { iconoAyuda as IconoAyuda } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

// La salida humana: presente en el encabezado de todas las pantallas, con texto visible.
export function BotonAyuda({ className }: { className?: string }) {
  return (
    <Link
      href="/ayuda"
      className={cn(
        "inline-flex min-h-tap items-center gap-2 rounded-md border-2 border-text bg-bg px-3 text-base font-bold text-text transition-colors duration-150 hover:bg-surface",
        className,
      )}
    >
      <IconoAyuda aria-hidden className="size-6" />
      Ayuda
    </Link>
  );
}
