"use client";

import { Pause, Play } from "lucide-react";
import { useState } from "react";

import { OFICIOS } from "@/lib/web/contenido";

import { MARCO } from "./marco";

// Una sola línea de oficios que corre despacio y se sale por los dos bordes. Se puede pausar
// (WCAG 2.2.2) y no se mueve con movimiento reducido. El lector de pantalla recibe la lista quieta.
export function BandaOficios() {
  const [pausa, setPausa] = useState(false);
  const linea = OFICIOS.join("  •  ");
  return (
    <section aria-labelledby="todos-los-oficios" className="bg-bg">
      <div data-pausa={pausa} className="banda overflow-hidden bg-accent py-10 text-on-accent lg:py-14">
        <div aria-hidden className="banda-pista flex w-max whitespace-nowrap">
          <span className="titular-marca pr-16 text-gigante">{linea}  •</span>
          <span className="titular-marca pr-16 text-gigante">{linea}  •</span>
        </div>
      </div>
      <div className={`${MARCO} flex flex-wrap items-center gap-x-10 gap-y-4 py-8`}>
        <div>
          <h2 id="todos-los-oficios" className="text-xl font-bold">
            Caben todos los oficios
          </h2>
          <p className="text-lg">Si el tuyo no está en la lista, también cabe.</p>
        </div>
        <ul className="sr-only">
          {OFICIOS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setPausa(!pausa)}
          aria-pressed={pausa}
          className="inline-flex min-h-tap items-center gap-2 rounded-full border-2 border-text px-4 text-base font-bold transition-colors duration-150 hover:bg-surface active:scale-[0.97]"
        >
          {pausa ? <Play aria-hidden className="size-5" /> : <Pause aria-hidden className="size-5" />}
          {pausa ? "Mover la lista" : "Detener la lista"}
        </button>
      </div>
    </section>
  );
}
