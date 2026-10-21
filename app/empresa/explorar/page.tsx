"use client";

import { Check, Search } from "lucide-react";
import { useState } from "react";

import { TarjetaPerfil } from "@/components/empresa/tarjeta-perfil";
import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { formasContratar, perfilesEjemplo, type FormaContratar } from "@/lib/demo";
import { cn } from "@/lib/utils";

export default function Explorar() {
  const [filtros, setFiltros] = useState<FormaContratar[]>([]);

  const perfiles = filtros.length
    ? perfilesEjemplo.filter((p) => p.formas.some((f) => filtros.includes(f)))
    : perfilesEjemplo;

  function alternar(f: FormaContratar) {
    setFiltros((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));
  }

  return (
    <Pantalla
      titulo="Explorar perfiles"
      intro="Personas que ya resolvieron problemas como el suyo. Filtre por cómo quiere contratar."
    >
      <form role="search" method="get" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="buscar" className="sr-only">
          Buscar por oficio, situación o norma
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-text-muted" />
          <input
            id="buscar"
            type="search"
            placeholder="Ej.: certificación INVIMA, cierre contable"
            className="min-h-action w-full rounded-sm border-2 border-border bg-bg pr-4 pl-13 text-base placeholder:text-text-muted focus-visible:border-text"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      <fieldset>
        <legend className="mb-3 text-lg font-bold">Forma de contratar</legend>
        <div className="flex flex-wrap gap-2">
          {formasContratar.map(({ valor, etiqueta }) => {
            const activo = filtros.includes(valor);
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={activo}
                onClick={() => alternar(valor)}
                className={cn(
                  "inline-flex min-h-tap items-center gap-2 rounded-full border-2 px-4 text-base transition-colors duration-150",
                  activo ? "border-text bg-primary font-bold text-on-primary" : "border-border hover:bg-surface",
                )}
              >
                {activo && <Check aria-hidden className="size-5" />}
                {etiqueta}
              </button>
            );
          })}
        </div>
      </fieldset>

      <section aria-labelledby="resultados" className="flex flex-col gap-4">
        <h2 id="resultados" className="text-xl" aria-live="polite">
          {perfiles.length} {perfiles.length === 1 ? "perfil" : "perfiles"}
          <span className="ml-2 text-base font-normal text-text-muted">(datos de ejemplo)</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {perfiles.map((p) => (
            <TarjetaPerfil key={p.id} perfil={p} />
          ))}
        </div>
      </section>

      <Pendiente hito={4}>Perfiles reales ordenados por coincidencia con lo que escribe en el buscador.</Pendiente>
    </Pantalla>
  );
}
