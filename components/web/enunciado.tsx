import { ArrowDown } from "lucide-react";
import Link from "next/link";

import { RETRATOS } from "@/lib/web/contenido";

import { retraso } from "./marco";
import { Retrato } from "./retrato";

// Tablero de enunciados: un cuadro oscuro con la frase, uno claro con una sola palabra, uno con
// retrato y, debajo, el texto largo que lo explica.
export function Enunciado() {
  return (
    <section aria-labelledby="lo-que-sabes" className="bg-bg px-4 md:px-8">
      <div className="mx-auto grid max-w-web grid-cols-2 gap-1.5 lg:grid-cols-12 lg:grid-rows-[38svh_38svh] lg:gap-2">
        <div
          data-aparecer
          className="col-span-2 flex min-h-[34svh] items-end rounded-lg bg-primary p-5 text-on-primary lg:col-span-8 lg:row-span-2 lg:min-h-0 lg:p-8"
        >
          <h2 id="lo-que-sabes" className="titular-marca text-afiche lg:text-gigante">
            Lo que sabes importa
          </h2>
        </div>
        <div
          data-aparecer
          style={retraso(1)}
          aria-hidden
          className="flex aspect-square items-end overflow-hidden rounded-lg bg-surface p-4 lg:col-span-4 lg:aspect-auto lg:p-6"
        >
          <span className="titular-marca text-xl whitespace-nowrap sm:text-titular">Capacidades</span>
        </div>
        <div data-aparecer style={retraso(2)} className="aspect-square overflow-hidden rounded-lg lg:col-span-4 lg:aspect-auto">
          <Retrato retrato={RETRATOS.rojo} className="h-full border-0" tamanos="(min-width: 64rem) 30vw, 48vw" />
        </div>
      </div>
      <div className="mx-auto grid max-w-web gap-8 py-16 lg:grid-cols-12 lg:gap-6 lg:py-28">
        <Link
          href="#como-funciona"
          className="group inline-flex min-h-action items-center gap-2 self-end text-xl font-bold underline underline-offset-4 max-lg:order-2 lg:col-span-4"
        >
          Ver cómo funciona
          <ArrowDown aria-hidden className="size-6 transition-transform duration-150 group-hover:translate-y-1" />
        </Link>
        <p data-aparecer className="max-w-[46ch] text-xl lg:col-span-6 lg:col-start-7 lg:text-2xl lg:leading-snug">
          Una trayectoria no se resume en el último cargo. En Kánna cuentas lo que sabes hacer, los retos
          que has resuelto y en qué te gustaría participar ahora. Las organizaciones buscan por
          capacidades, no por años: tu edad no se muestra ni entra en la búsqueda. Trabajas por horas,
          por proyecto, como mentor o guiando un taller, y pones el valor de tu experiencia.
        </p>
      </div>
    </section>
  );
}
