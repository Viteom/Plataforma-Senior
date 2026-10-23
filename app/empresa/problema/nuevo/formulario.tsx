"use client";

import { Button } from "@/components/ui/button";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { useAccion } from "@/components/ui/use-accion";
import { formasContratar, modalidades } from "@/lib/formas";
import type { EntradaTaxonomia } from "@/lib/ia/huella";

import { crearNecesidad, type Estado } from "../../acciones";
import { Requisitos } from "./requisitos";

export function FormularioProblema({ taxonomia }: { taxonomia: EntradaTaxonomia[] }) {
  const { estado, enviar: crear, pendiente: creando, alEnviar } = useAccion<Estado>(crearNecesidad, {});

  return (
    <form action={crear} onSubmit={alEnviar} className="flex flex-col gap-8">
      <Campo
        id="problema"
        etiqueta="¿Qué reto necesitas resolver?"
        ayuda="Ej.: Vamos a abrir una segunda planta y necesitamos cumplir con INVIMA en 6 meses."
      >
        {(p) => <Textarea {...p} name="problema" rows={5} />}
      </Campo>

      <Requisitos taxonomia={taxonomia} />

      <fieldset>
        <legend className="mb-3 text-lg font-bold">¿Cómo lo quieres contratar?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {formasContratar.map(({ valor, etiqueta }) => (
            <label key={valor} className="flex min-h-tap items-center gap-3 rounded-md border-2 border-border px-4 py-2 text-lg hover:bg-surface">
              <input type="checkbox" name="formatos" value={valor} className="size-6 accent-[var(--color-primary)]" />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-lg font-bold">¿Dónde?</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {modalidades.map(({ valor, etiqueta }, i) => (
            <label key={valor} className="flex min-h-tap items-center gap-3 text-lg">
              <input type="radio" name="modalidad" value={valor} defaultChecked={i === 0} className="size-6 accent-[var(--color-primary)]" />
              {valor === "remoto" ? "A distancia" : etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Campo id="ubicacion" etiqueta="Ciudad o región (opcional)">
          {(p) => <Input {...p} name="ubicacion" />}
        </Campo>
        <Campo id="presupuesto" etiqueta="Presupuesto en pesos (opcional)" ayuda="Solo números. Nos ayuda a proponerte personas en tu rango.">
          {(p) => <Input {...p} name="presupuesto" inputMode="numeric" />}
        </Campo>
      </div>

      {estado.error && (
        <p role="alert" className="font-bold text-danger">
          {estado.error}
        </p>
      )}
      <Button type="submit" disabled={creando} className="self-start">
        {creando ? "Enviando…" : "Buscar talento"}
      </Button>
    </form>
  );
}
