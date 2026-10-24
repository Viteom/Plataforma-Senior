import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Retrato as DatosRetrato } from "@/lib/web/contenido";

// Retrato en grabado (líneas casi negro sobre transparente) puesto sobre un color plano, con el
// borde blanco grueso del brandbook.
export function Retrato({
  retrato,
  fondo = "bg-accent",
  className,
  prioridad,
  tamanos = "(min-width: 64rem) 40vw, 90vw",
}: {
  retrato: DatosRetrato;
  fondo?: string;
  className?: string;
  prioridad?: boolean;
  tamanos?: string;
}) {
  return (
    <figure className={cn("retrato overflow-hidden", fondo, className)}>
      <Image
        src={retrato.src}
        alt={retrato.alt}
        width={retrato.ancho}
        height={retrato.alto}
        priority={prioridad}
        sizes={tamanos}
        className="h-full w-full object-cover"
      />
    </figure>
  );
}
