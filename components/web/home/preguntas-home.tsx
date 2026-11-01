"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { PREGUNTAS_HOME } from "@/lib/web/home";

// Preguntas frecuentes por público. Talento del campo va dentro de cada uno.
export function PreguntasHome() {
  const [publico, setPublico] = useState<keyof typeof PREGUNTAS_HOME>("talento");

  return (
    <section id="preguntas" aria-labelledby="titulo-preguntas" className="scroll-mt-20 bg-neutro py-20 font-web text-tinta lg:py-32">
      <div className="mx-auto max-w-web px-4 md:px-8">
        <h2 id="titulo-preguntas" className="text-seccion font-medium tracking-[-0.035em]">
          Preguntas <span className="text-tinta-suave">frecuentes</span>
        </h2>
        <div role="group" aria-label="Preguntas para" className="mt-8 inline-flex gap-1 rounded-full bg-raised p-1">
          {(["talento", "empresas"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={publico === p}
              onClick={() => setPublico(p)}
              className="min-h-12 rounded-full px-5 text-base font-semibold text-tinta-suave aria-pressed:bg-tinta aria-pressed:text-white"
            >
              {p === "talento" ? "Talento" : "Empresas"}
            </button>
          ))}
        </div>
        <div className="mt-8 max-w-[56rem]">
          {PREGUNTAS_HOME[publico].map((q, i) => (
            <details key={`${publico}-${q.p}`} open={i === 0} className="group border-b border-border-subtle">
              <summary className="flex min-h-action cursor-pointer list-none items-center justify-between gap-5 py-5 text-xl font-medium [&::-webkit-details-marker]:hidden">
                {q.p}
                <Plus aria-hidden className="size-6 shrink-0 group-open:hidden" />
                <Minus aria-hidden className="hidden size-6 shrink-0 group-open:block" />
              </summary>
              <p className="max-w-[64ch] pb-6 text-lg text-text-muted">{q.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
