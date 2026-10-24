"use client";

import { Check, CircleDot, Plus, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { nombreCapaEmpresa, ORDEN_CAPAS } from "@/lib/capas";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import type { Capa } from "@/lib/ia/tipos";
import { buscarRequisitos, CAPAS_LIBRES, problemaRequisitoLibre, sugerirRequisitos } from "@/lib/reto";
import { cn } from "@/lib/utils";

// Qué debe saber la persona. Con más de cien opciones no sirve mostrarlas todas: primero lo que
// ya elegiste, luego sugerencias según el reto (por palabras, sin IA), un buscador, la lista
// completa plegada y, si no está, escribirlo. Cada toque avanza: no → deseable → obligatorio → no.
// El estado se lee en el texto del botón, no solo en el color.

type Nivel = "no" | "deseable" | "obligatorio";
const SIGUIENTE: Record<Nivel, Nivel> = { no: "deseable", deseable: "obligatorio", obligatorio: "no" };
const TEXTO: Record<Nivel, string> = { no: "", deseable: "Deseable", obligatorio: "Obligatorio" };

type Libre = { capa: Capa; etiqueta: string; nivel: Nivel };

function Ficha({ etiqueta, nivel, onClick, nota }: { etiqueta: string; nivel: Nivel; onClick: () => void; nota?: string }) {
  const Icono = nivel === "obligatorio" ? Check : nivel === "deseable" ? CircleDot : Plus;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${etiqueta}: ${nivel === "no" ? "no requerido" : TEXTO[nivel].toLowerCase()}`}
      className={cn(
        "inline-flex min-h-tap items-center gap-2 rounded-sm border-2 px-3 py-1 text-left text-base transition-[background-color,transform] duration-100 active:scale-[0.97]",
        nivel === "obligatorio" && "border-text bg-primary font-bold text-on-primary",
        nivel === "deseable" && "border-text bg-surface-strong font-bold",
        nivel === "no" && "border-dashed border-border hover:bg-surface active:bg-surface-strong",
      )}
    >
      <Icono aria-hidden className="size-5 shrink-0" />
      <span className="flex flex-col">
        {etiqueta}
        {(nivel !== "no" || nota) && (
          <span className="text-sm font-normal">{[TEXTO[nivel], nota].filter(Boolean).join(" · ")}</span>
        )}
      </span>
    </button>
  );
}

export function Requisitos({ taxonomia, reto }: { taxonomia: EntradaTaxonomia[]; reto: string }) {
  const [niveles, setNiveles] = useState<Record<string, Nivel>>({});
  const [libres, setLibres] = useState<Libre[]>([]);
  const [consulta, setConsulta] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [capaNueva, setCapaNueva] = useState<Capa>("situaciones");
  const [errorNuevo, setErrorNuevo] = useState<string | null>(null);

  const nivel = (id: string) => niveles[id] ?? "no";
  const tocar = (id: string) => setNiveles((x) => ({ ...x, [id]: SIGUIENTE[nivel(id)] }));
  const tocarLibre = (i: number) =>
    setLibres((x) => x.map((l, j) => (j === i ? { ...l, nivel: SIGUIENTE[l.nivel] } : l)).filter((l) => l.nivel !== "no"));

  const elegidos = taxonomia.filter((t) => nivel(t.id) !== "no");
  const sugeridos = useMemo(() => sugerirRequisitos(reto, taxonomia), [reto, taxonomia]);
  const encontrados = useMemo(() => buscarRequisitos(consulta, taxonomia).slice(0, 12), [consulta, taxonomia]);

  function agregar() {
    const texto = nuevo.replace(/\s+/g, " ").trim();
    const problema = problemaRequisitoLibre(texto);
    if (problema) return setErrorNuevo(problema);
    const repetido =
      libres.some((l) => l.etiqueta.toLowerCase() === texto.toLowerCase()) ||
      taxonomia.some((t) => t.etiqueta.toLowerCase() === texto.toLowerCase());
    if (repetido) return setErrorNuevo("Ya está en la lista: búscalo arriba.");
    setLibres((x) => [...x, { capa: capaNueva, etiqueta: texto, nivel: "deseable" }]);
    setNuevo("");
    setErrorNuevo(null);
  }

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="mb-1 text-lg font-bold">¿Qué debe saber la persona?</legend>
      <p className="text-text-muted">
        Toca una vez para «Deseable», dos veces para «Obligatorio». Elige o escribe al menos uno.
      </p>
      {elegidos.map((t) => (
        <input key={t.id} type="hidden" name={nivel(t.id)} value={t.id} />
      ))}
      {libres.map((l) => (
        <input key={`${l.capa}|${l.etiqueta}`} type="hidden" name={`libre_${l.nivel}`} value={`${l.capa}|${l.etiqueta}`} />
      ))}

      {(elegidos.length > 0 || libres.length > 0) && (
        <section aria-labelledby="elegidos" className="flex flex-col gap-2 rounded-md bg-surface p-4">
          <h3 id="elegidos" className="text-lg">
            Lo que pides ({elegidos.length + libres.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {elegidos.map((t) => (
              <Ficha key={t.id} etiqueta={t.etiqueta} nivel={nivel(t.id)} onClick={() => tocar(t.id)} />
            ))}
            {libres.map((l, i) => (
              <Ficha key={`${l.capa}|${l.etiqueta}`} etiqueta={l.etiqueta} nivel={l.nivel} nota="escrito por ti" onClick={() => tocarLibre(i)} />
            ))}
          </div>
          <p className="text-base text-text-muted">Toca otra vez un obligatorio para quitarlo.</p>
        </section>
      )}

      <section aria-labelledby="sugeridos" className="flex flex-col gap-2">
        <h3 id="sugeridos" className="inline-flex items-center gap-2 text-lg">
          <Sparkles aria-hidden className="size-5" />
          Sugerencias para tu reto
        </h3>
        {sugeridos.length ? (
          <div className="flex flex-wrap gap-2">
            {sugeridos.map((t) => (
              <Ficha key={t.id} etiqueta={t.etiqueta} nivel={nivel(t.id)} onClick={() => tocar(t.id)} />
            ))}
          </div>
        ) : (
          <p className="text-base text-text-muted">
            {reto.trim().length < 20
              ? "Escribe tu reto arriba y aquí te sugerimos conocimientos."
              : "No encontramos sugerencias para ese texto. Búscalas o escríbelas abajo."}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-2">
        <label htmlFor="buscar-requisito" className="text-lg font-bold">
          Busca un conocimiento, norma u oficio
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-muted" />
          <input
            id="buscar-requisito"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Ej.: INVIMA, cartera, ebanistería"
            className="min-h-action w-full rounded-sm border-2 border-border bg-bg pr-4 pl-12 text-base placeholder:text-text-muted focus-visible:border-text"
          />
        </div>
        {consulta.trim().length >= 2 && (
          <div aria-live="polite" className="flex flex-wrap gap-2">
            {encontrados.length ? (
              encontrados.map((t) => <Ficha key={t.id} etiqueta={t.etiqueta} nivel={nivel(t.id)} onClick={() => tocar(t.id)} />)
            ) : (
              <p className="text-base text-text-muted">No está en la lista. Escríbelo abajo.</p>
            )}
          </div>
        )}
      </div>

      <details className="group">
        <summary className="inline-flex min-h-tap list-none items-center font-bold underline underline-offset-4 [&::-webkit-details-marker]:hidden">
          Ver todas las opciones ({taxonomia.filter((t) => t.capa !== "transferir").length})
        </summary>
        <div className="mt-4 flex flex-col gap-6">
          {ORDEN_CAPAS.filter((c) => c !== "transferir").map((capa) => {
            const opciones = taxonomia.filter((t) => t.capa === capa);
            if (!opciones.length) return null;
            return (
              <div key={capa} className="flex flex-col gap-2">
                <h3 className="text-lg">{nombreCapaEmpresa[capa]}</h3>
                <div className="flex flex-wrap gap-2">
                  {opciones.map((t) => (
                    <Ficha key={t.id} etiqueta={t.etiqueta} nivel={nivel(t.id)} onClick={() => tocar(t.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </details>

      <section aria-labelledby="escribir-requisito" className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
        <h3 id="escribir-requisito" className="text-lg">
          ¿No está en la lista? Escríbelo
        </h3>
        <p className="text-base text-text-muted">Nuestro equipo lo revisa antes de buscar. No escribas edades ni años.</p>
        <div className="grid gap-3 sm:grid-cols-[14rem_1fr]">
          <select
            aria-label="Tipo de conocimiento"
            value={capaNueva}
            onChange={(e) => setCapaNueva(e.target.value as Capa)}
            className="min-h-action rounded-sm border-2 border-border bg-bg px-3 text-base focus-visible:border-text"
          >
            {CAPAS_LIBRES.map((c) => (
              <option key={c} value={c}>
                {nombreCapaEmpresa[c]}
              </option>
            ))}
          </select>
          <input
            aria-label="Conocimiento que necesitas"
            aria-invalid={errorNuevo ? true : undefined}
            aria-describedby={errorNuevo ? "error-requisito" : undefined}
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregar();
              }
            }}
            placeholder="Ej.: Manejo de cámaras de frío"
            maxLength={60}
            className="min-h-action rounded-sm border-2 border-border bg-bg px-4 text-base placeholder:text-text-muted focus-visible:border-text aria-[invalid=true]:border-danger"
          />
        </div>
        {errorNuevo && (
          <p id="error-requisito" role="alert" className="font-bold text-danger">
            {errorNuevo}
          </p>
        )}
        <Button type="button" variant="secundario" size="normal" onClick={agregar} className="self-start">
          <Plus aria-hidden />
          Agregar
        </Button>
      </section>
    </fieldset>
  );
}
