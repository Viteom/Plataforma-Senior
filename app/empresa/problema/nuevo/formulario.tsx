"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { useAccion } from "@/components/ui/use-accion";
import { formasContratar, modalidades } from "@/lib/formas";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import { PLAZOS } from "@/lib/reto";

import { crearNecesidad, type Estado } from "../../acciones";
import { Requisitos } from "./requisitos";

const opcion = "flex min-h-tap items-center gap-3 rounded-md border-2 border-border px-4 py-2 text-lg hover:bg-surface active:bg-surface-strong has-[:checked]:border-text has-[:checked]:bg-surface-strong has-[:checked]:font-bold";

export function FormularioProblema({ taxonomia }: { taxonomia: EntradaTaxonomia[] }) {
  const { estado, enviar: crear, pendiente: creando, alEnviar } = useAccion<Estado>(crearNecesidad, {});
  // El reto alimenta las sugerencias de requisitos mientras se escribe.
  const [reto, setReto] = useState("");

  return (
    <form action={crear} onSubmit={alEnviar} className="flex flex-col gap-8">
      <Campo
        id="problema"
        etiqueta="¿Qué reto necesitas resolver?"
        ayuda="Cuéntalo como se lo contarías a un colega. Ej.: Vamos a abrir una segunda planta y necesitamos cumplir con INVIMA en 6 meses."
      >
        {(p) => <Textarea {...p} name="problema" rows={5} value={reto} onChange={(e) => setReto(e.target.value)} />}
      </Campo>

      <Campo id="intentado" etiqueta="¿Qué han intentado hasta ahora? (opcional)" ayuda="Así la persona llega sabiendo lo que no funcionó.">
        {(p) => <Textarea {...p} name="intentado" rows={3} maxLength={800} className={`${p.className} min-h-28`} />}
      </Campo>

      <fieldset>
        <legend className="mb-3 text-lg font-bold">¿Para cuándo lo necesitas?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAZOS.map(({ valor, etiqueta }) => (
            <label key={valor} className={opcion}>
              <input type="radio" name="plazo" value={valor} className="size-6 accent-[var(--color-primary)]" />
              {etiqueta}
            </label>
          ))}
        </div>
      </fieldset>

      <Requisitos taxonomia={taxonomia} reto={reto} />

      <fieldset>
        <legend className="mb-3 text-lg font-bold">¿Cómo lo quieres contratar?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {formasContratar.map(({ valor, etiqueta }) => (
            <label key={valor} className={opcion}>
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
