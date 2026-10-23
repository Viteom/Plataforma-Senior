import Image from "next/image";

import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";

// Logo horizontal del brandbook. Positivo sobre fondos claros, negativo sobre oscuros.
// Nunca se redibuja: siempre sale de public/marca/.
const PROPORCION = 4540.76 / 1215.2;

export function Logo({ alto = 32, negativo, className }: { alto?: number; negativo?: boolean; className?: string }) {
  return (
    <Image
      src={negativo ? "/marca/kanna-horizontal-negativo.svg" : "/marca/kanna-horizontal.svg"}
      alt={MARCA.nombre}
      width={Math.round(alto * PROPORCION)}
      height={alto}
      unoptimized
      priority
      className={cn("h-auto", className)}
      style={{ width: Math.round(alto * PROPORCION) }}
    />
  );
}
