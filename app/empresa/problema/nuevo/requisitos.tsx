"use client";

import { Check, CircleDot, Plus } from "lucide-react";
import { useState } from "react";

import { nombreCapa } from "@/lib/capas";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import { CAPAS } from "@/lib/ia/tipos";
import { cn } from "@/lib/utils";

// Elegir requisitos de la taxonomía (sin IA). Cada toque avanza: no → deseable → obligatorio → no.
// El estado se lee en el texto del botón, no solo en el estilo.

type Nivel = "no" | "deseable" | "obligatorio";
const SIGUIENTE: Record<Nivel, Nivel> = { no: "deseable", deseable: "obligatorio", obligatorio: "no" };
const TEXTO: Record<Nivel, string> = { no: "", deseable: "Deseable", obligatorio: "Obligatorio" };

export function Requisitos({ taxonomia }: { taxonomia: EntradaTaxonomia[] }) {
  const [niveles, setNiveles] = useState<Record<string, Nivel>>({});
  const nivel = (id: string) => niveles[id] ?? "no";

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="mb-1 text-lg font-bold">¿Qué debe saber la persona?</legend>
      <p className="text-text-muted">
        Toque una vez para «Deseable», dos veces para «Obligatorio». Elija al menos uno.
      </p>
      {Object.entries(niveles).map(([id, n]) =>
        n === "no" ? null : <input key={id} type="hidden" name={n} value={id} />,
      )}
      {CAPAS.filter((c) => c !== "transferir").map((capa) => {
        const opciones = taxonomia.filter((t) => t.capa === capa);
        if (!opciones.length) return null;
        return (
          <div key={capa} className="flex flex-col gap-2">
            <h3 className="text-lg">{nombreCapa[capa]}</h3>
            <div className="flex flex-wrap gap-2">
              {opciones.map((t) => {
                const n = nivel(t.id);
                const Icono = n === "obligatorio" ? Check : n === "deseable" ? CircleDot : Plus;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNiveles((x) => ({ ...x, [t.id]: SIGUIENTE[n] }))}
                    aria-label={`${t.etiqueta}: ${n === "no" ? "no requerido" : TEXTO[n].toLowerCase()}`}
                    className={cn(
                      "inline-flex min-h-tap items-center gap-2 rounded-sm border-2 px-3 text-left text-base transition-colors duration-150",
                      n === "obligatorio" && "border-text bg-primary font-bold text-on-primary",
                      n === "deseable" && "border-text bg-surface-strong font-bold",
                      n === "no" && "border-dashed border-border hover:bg-surface",
                    )}
                  >
                    <Icono aria-hidden className="size-5 shrink-0" />
                    {t.etiqueta}
                    {n !== "no" && <span className="text-sm font-normal">({TEXTO[n]})</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
