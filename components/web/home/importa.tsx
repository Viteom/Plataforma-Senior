"use client";

import { ArrowDown, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { RETRATOS } from "@/lib/web/home";

// «Lo vivido vale más»: el titular arriba y debajo una fila de retratos altos que se desliza
// despacio. Se detiene al pasar el mouse, al enfocarla o con el botón (WCAG 2.2.2); con movimiento
// reducido queda quieta y se recorre de lado con el dedo.
export function Importa() {
  const [pausa, setPausa] = useState(false);
  // La pista va dos veces para que el giro no tenga salto; la copia no se anuncia.
  const pista = [...RETRATOS, ...RETRATOS];

  return (
    <section aria-labelledby="titulo-importa" className="overflow-hidden bg-neutro py-24 font-web text-tinta lg:py-32">
      <div className="mx-auto max-w-web px-4 text-center md:px-8">
        <h2 id="titulo-importa" className="text-seccion font-medium tracking-[-0.035em] text-balance">
          <span className="resaltado">Lo vivido</span> vale más <span className="block text-tinta-suave">que un diploma.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-lg sm:text-xl">
          Kánna convierte tu historia en una huella de capacidades que las organizaciones entienden. La cuentas con tu voz o
          por escrito; nosotros la ordenamos contigo.
        </p>
        <Link
          href="#como-funciona"
          className="mt-8 inline-flex min-h-action items-center gap-2 rounded-full bg-primary px-7 text-lg font-semibold text-on-primary active:scale-[0.97]"
        >
          Así funciona
          <ArrowDown aria-hidden className="size-5" />
        </Link>
      </div>

      <div
        className="banda mt-14 overflow-x-auto motion-safe:overflow-x-hidden motion-reduce:snap-x motion-reduce:snap-mandatory lg:mt-20"
        data-pausa={pausa}
        role="region"
        aria-label="Retratos de oficios y profesiones"
        tabIndex={0}
      >
        <ul className="banda-pista flex w-max gap-3 pr-3 motion-reduce:pl-4 md:gap-5 md:pr-5">
          {pista.map(({ foto, oficio, lugar }, i) => {
            const copia = i >= RETRATOS.length;
            return (
              <li
                key={`${foto}-${i}`}
                aria-hidden={copia || undefined}
                className="group relative aspect-[2/3] w-[min(46vw,15rem)] shrink-0 snap-start overflow-hidden rounded-retrato bg-neutro-2 md:w-72"
              >
                <Image
                  src={`/web/home/${foto}.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 18rem, 46vw"
                  className="object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <p className="absolute inset-x-3 bottom-3 rounded-full bg-raised px-4 py-2 text-center text-base leading-tight md:inset-x-4 md:bottom-4">
                  <b className="font-semibold">{oficio}</b>
                  <span className="hidden text-text-muted md:inline"> · {lugar}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mx-auto mt-6 flex max-w-web justify-center px-4 motion-reduce:hidden md:px-8">
        <button
          type="button"
          aria-pressed={pausa}
          onClick={() => setPausa((p) => !p)}
          className="inline-flex min-h-tap items-center gap-2 rounded-full bg-raised px-5 text-base font-semibold"
        >
          {pausa ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
          {pausa ? "Mover retratos" : "Detener retratos"}
        </button>
      </div>
    </section>
  );
}
