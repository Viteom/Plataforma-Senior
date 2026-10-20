import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";

import { BotonAyuda } from "./boton-ayuda";

type Props = {
  inicioHref?: string;
  volver?: { href: string; etiqueta?: string };
  ancho?: "celular" | "amplio";
  sinAyuda?: boolean;
};

// Encabezado de celular: marca o "Volver" a la izquierda, Ayuda a la derecha.
export function Encabezado({ inicioHref = "/", volver, ancho = "celular", sinAyuda }: Props) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-border-subtle bg-bg">
      <div
        className={cn(
          "mx-auto flex min-h-16 items-center justify-between gap-3 px-4",
          ancho === "celular" ? "max-w-xl" : "max-w-6xl",
        )}
      >
        {volver ? (
          <Link
            href={volver.href}
            className="-ml-1 inline-flex min-h-tap items-center gap-2 px-1 text-base font-bold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden className="size-6" />
            {volver.etiqueta ?? "Volver"}
          </Link>
        ) : (
          <Link href={inicioHref} className="inline-flex min-h-tap items-center text-lg font-bold">
            {MARCA.nombre}
          </Link>
        )}
        {!sinAyuda && <BotonAyuda />}
      </div>
    </header>
  );
}
