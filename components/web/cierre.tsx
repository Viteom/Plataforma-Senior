import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Retrato as DatosRetrato } from "@/lib/web/contenido";

import { MARCO, retraso } from "./marco";
import { Retrato } from "./retrato";

// El cierre es una fila del tablero: un cuadro ancho en maíz con la acción, a un lado un retrato y
// al otro un cuadro de color que se sale de la pantalla.
export function Cierre({
  titulo,
  texto,
  accion,
  secundaria,
  retrato,
}: {
  titulo: string;
  texto: string;
  accion: { href: string; texto: string };
  secundaria?: { href: string; texto: string };
  retrato: DatosRetrato;
}) {
  return (
    <section aria-labelledby="cierre" className="overflow-hidden bg-bg pb-24 lg:pb-36">
      <div className={MARCO}>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-12 lg:gap-3">
          <div aria-hidden className="relative order-2 h-32 lg:order-none lg:col-span-2 lg:h-auto">
            <Retrato retrato={retrato} fondo="bg-surface" className="absolute inset-0 rounded-lg border-0" />
          </div>
          <div
            className="col-span-2 flex min-h-[22rem] flex-col justify-center gap-5 rounded-lg bg-accent p-6 text-on-accent sm:p-10 lg:col-span-8"
          >
            <h2 id="cierre" data-aparecer className="titular-marca max-w-[18ch] text-afiche">
              {titulo}
            </h2>
            <p data-aparecer style={retraso(1)} className="max-w-[44ch] text-lg sm:text-xl">
              {texto}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button asChild className="active:scale-[0.97]">
                <Link href={accion.href}>{accion.texto}</Link>
              </Button>
              {secundaria && (
                <Link href={secundaria.href} className="inline-flex min-h-tap items-center text-lg font-bold underline underline-offset-4">
                  {secundaria.texto}
                </Link>
              )}
            </div>
          </div>
          <div aria-hidden className="relative order-3 h-32 lg:order-none lg:col-span-2 lg:h-auto">
            <div className="absolute inset-y-0 right-0 left-0 rounded-lg bg-primary lg:-right-[50vw]" />
          </div>
        </div>
      </div>
    </section>
  );
}
