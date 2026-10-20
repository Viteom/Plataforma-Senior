import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Campo, Textarea } from "@/components/ui/campo";
import { formasContratar } from "@/lib/demo";

export const metadata: Metadata = { title: "Buscar por un problema" };

export default function ProblemaNuevo() {
  return (
    <div className="max-w-3xl">
      <Pantalla
        titulo="Buscar por un problema"
        intro="Cuéntenos qué necesita resolver. Lo convertimos en requisitos y le proponemos hasta 5 perfiles revisados por nuestro equipo."
      >
        <form className="flex flex-col gap-8">
          <Campo
            id="problema"
            etiqueta="¿Qué problema necesita resolver?"
            ayuda="Ej.: Vamos a abrir una segunda planta y necesitamos cumplir con INVIMA en 6 meses."
          >
            {(p) => <Textarea {...p} rows={6} />}
          </Campo>

          <fieldset>
            <legend className="mb-3 text-lg font-bold">¿Cómo lo quiere contratar?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {formasContratar.map(({ valor, etiqueta }) => (
                <label key={valor} className="flex min-h-tap items-center gap-3 rounded-md border-2 border-border px-4 py-2 text-lg hover:bg-surface">
                  <input type="checkbox" name="formas" value={valor} className="size-6 accent-[var(--color-primary)]" />
                  {etiqueta}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="/empresa/problema/ejemplo">Buscar talento</Link>
            </Button>
          </div>
        </form>
        <Pendiente hito={4}>La IA traduce el problema en requisitos y el equipo cura los resultados.</Pendiente>
      </Pantalla>
    </div>
  );
}
