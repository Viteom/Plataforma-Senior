"use client";

import Image from "next/image";
import { useState } from "react";

import { OFICIOS_HOME } from "@/lib/web/home";

// Oficios y profesiones al mismo nivel: cada uno cambia el retrato.
export function Oficios() {
  const [actual, setActual] = useState(0);
  const o = OFICIOS_HOME[actual];

  return (
    <section aria-labelledby="titulo-oficios" className="bg-neutro py-20 font-web text-tinta lg:py-32">
      <div className="mx-auto grid max-w-web items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-[4/4.4] overflow-hidden rounded-lg bg-neutro-2 lg:aspect-[4/5]">
          <Image key={o.foto.src} src={o.foto.src} alt={o.foto.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover object-[center_22%]" />
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-base font-semibold backdrop-blur">
            <span aria-hidden className="size-2 rounded-full bg-accent ring-3 ring-accent/35" />
            {o.pie}
          </span>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="mb-2 inline-flex rounded-full bg-raised px-3.5 py-1.5 text-sm font-medium">Oficios y profesiones</span>
          <h2 id="titulo-oficios" className="sr-only">
            Oficios y profesiones, al mismo nivel
          </h2>
          <div role="group" aria-label="Elige un oficio o profesión" className="flex flex-col items-center gap-3">
            {OFICIOS_HOME.map((x, i) => (
              <button
                key={x.nombre}
                type="button"
                aria-pressed={i === actual}
                onClick={() => setActual(i)}
                className="rounded-md bg-raised px-6 py-2 text-oficio font-medium tracking-[-0.03em] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 aria-pressed:bg-accent aria-pressed:text-on-accent"
              >
                {x.nombre}
              </button>
            ))}
          </div>
          <p className="mt-4 max-w-[36ch] text-base text-text-muted">Más de 200 capacidades entre oficios y profesiones. Ninguna vale menos que otra.</p>
        </div>
      </div>
    </section>
  );
}
