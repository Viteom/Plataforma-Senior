import { ArrowLeft, House } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/marca/logo";
import { cn } from "@/lib/utils";

import { BotonAyuda } from "./boton-ayuda";
import { BotonSalir } from "./boton-salir";

type Props = {
  inicioHref?: string;
  volver?: { href: string; etiqueta?: string };
  ancho?: "celular" | "amplio";
  sinAyuda?: boolean;
  tono?: "borde" | "lleno";
  /** Muestra «Cerrar sesión» a la vista (en las pruebas nadie lo encontraba al final de Mi perfil). */
  salir?: boolean;
  /** Muestra «Inicio» con texto, para volver mientras se llena el perfil. */
  inicioVisible?: boolean;
};

// Encabezado de celular: marca o "Volver" a la izquierda, Ayuda a la derecha.
export function Encabezado({ inicioHref = "/", volver, ancho = "celular", sinAyuda, tono, salir, inicioVisible }: Props) {
  return (
    <header className={cn("sticky top-0 z-20 bg-bg", tono === "lleno" ? "bg-bg/90 backdrop-blur" : "border-b-2 border-border-subtle")}>
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
        ) : inicioVisible ? (
          <Link
            href={inicioHref}
            className="-ml-1 inline-flex min-h-tap items-center gap-2 px-1 text-base font-bold underline-offset-4 hover:underline"
          >
            <House aria-hidden className="size-6" />
            Volver al inicio
          </Link>
        ) : (
          <Link href={inicioHref} className="inline-flex min-h-tap items-center">
            <Logo alto={30} />
          </Link>
        )}
        <div className="flex items-center gap-2">
          {salir && <BotonSalir texto="Salir" />}
          {!sinAyuda && <BotonAyuda tono={tono} />}
        </div>
      </div>
    </header>
  );
}
