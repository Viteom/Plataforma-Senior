import { Check, Search } from "lucide-react";
import type { Metadata } from "next";

import { AvisoEmpresa } from "@/components/empresa/estado";
import { TarjetaPerfil } from "@/components/empresa/tarjeta-perfil";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { listarPerfiles, obtenerMiEmpresa } from "@/lib/datos/consultas";
import { MODO_DEMO } from "@/lib/demo";
import { esForma, formasContratar } from "@/lib/formas";

export const metadata: Metadata = { title: "Explorar perfiles" };

type Busqueda = { q?: string; formas?: string | string[] };

// Búsqueda por GET a propósito: lo que escribe una empresa no es un dato personal y así la URL se
// puede compartir. Funciona sin JavaScript.
export default async function Explorar({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const { q = "", formas } = await searchParams;
  const elegidas = (Array.isArray(formas) ? formas : formas ? [formas] : []).filter(esForma);
  const [perfiles, empresa] = await Promise.all([listarPerfiles(q, elegidas), obtenerMiEmpresa()]);

  return (
    <Pantalla
      titulo="Explorar perfiles"
      intro="Personas con experiencia para aportar a tu reto. Filtra por cómo quieres contratar."
    >
      <AvisoEmpresa empresa={empresa} />

      <form role="search" method="get" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="buscar" className="sr-only">
            Buscar por oficio, situación o norma
          </label>
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-6 -translate-y-1/2 text-text-muted" />
            <input
              id="buscar"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Ej.: certificación INVIMA, cierre contable"
              className="min-h-action w-full rounded-sm border-2 border-border bg-bg pr-4 pl-13 text-base placeholder:text-text-muted focus-visible:border-text"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </div>

        <fieldset>
          <legend className="mb-3 text-lg font-bold">Forma de contratar</legend>
          <div className="flex flex-wrap gap-2">
            {formasContratar.map(({ valor, etiqueta }) => (
              <label
                key={valor}
                className="inline-flex min-h-tap items-center gap-2 rounded-full border-2 border-border px-4 text-base has-[:checked]:border-text has-[:checked]:bg-primary has-[:checked]:font-bold has-[:checked]:text-on-primary has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus"
              >
                <input type="checkbox" name="formas" value={valor} defaultChecked={elegidas.includes(valor)} className="peer sr-only" />
                <Check aria-hidden className="hidden size-5 peer-checked:block" />
                {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      <section aria-labelledby="resultados" className="flex flex-col gap-4">
        <h2 id="resultados" className="text-xl">
          {perfiles.length} {perfiles.length === 1 ? "perfil" : "perfiles"}
          {q && ` para «${q}»`}
          {MODO_DEMO && <span className="ml-2 text-base font-normal text-text-muted">(datos de ejemplo)</span>}
        </h2>
        {perfiles.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {perfiles.map((p) => (
              <TarjetaPerfil key={p.id} perfil={p} />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-surface p-5">
            No encontramos perfiles con esa búsqueda. Prueba con otras palabras o cuéntanos el reto en «Buscar por un
            problema»: nuestro equipo te ayuda a encontrar a la persona.
          </p>
        )}
      </section>
    </Pantalla>
  );
}
