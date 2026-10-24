import type { Pregunta } from "@/lib/web/contenido";

import { MARCO, retraso } from "./marco";

// Preguntas frecuentes: el título se queda quieto a la izquierda mientras pasan las preguntas.
// Cada una es un cuadro relleno; la abierta se pone lima (y el + pasa a −). Una abierta a la vez.
export function Preguntas({ id = "preguntas", titulo = "Preguntas frecuentes", preguntas }: { id?: string; titulo?: string; preguntas: Pregunta[] }) {
  return (
    <section aria-labelledby={id} className="bg-bg py-24 lg:py-36">
      <div className={`${MARCO} grid gap-10 lg:grid-cols-12 lg:gap-6`}>
        <h2 id={id} data-aparecer className="titular-marca text-afiche lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          {titulo}
        </h2>
        <div data-aparecer style={retraso(1)} className="flex flex-col gap-2 lg:col-span-7">
          {preguntas.map((p) => (
            <details
              key={p.pregunta}
              name={id}
              className="group rounded-md bg-surface transition-colors duration-200 open:bg-accent open:text-on-accent"
            >
              <summary className="flex min-h-18 list-none items-center justify-between gap-6 px-6 py-4 text-xl font-bold transition-colors duration-150 hover:bg-surface-strong group-open:hover:bg-accent-hover rounded-md [&::-webkit-details-marker]:hidden">
                {p.pregunta}
                <span aria-hidden className="relative size-4 shrink-0">
                  <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-current" />
                  <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-current transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="max-w-[52ch] px-6 pb-6 text-lg">{p.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
