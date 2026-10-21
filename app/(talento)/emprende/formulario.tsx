"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Opcion } from "@/components/ui/opcion";
import { useAccion } from "@/components/ui/use-accion";
import { ETAPAS, NECESIDADES, type Etapa, type Necesidad } from "@/lib/emprende/ruta";

import { guardarDiagnostico, type EstadoDiagnostico } from "./acciones";

export function Diagnostico() {
  const [etapa, setEtapa] = useState<Etapa | null>(null);
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [asesoria, setAsesoria] = useState(false);
  const { estado, enviar, pendiente, alEnviar } = useAccion<EstadoDiagnostico>(guardarDiagnostico, {});

  if (estado.ruta) {
    return (
      <section aria-labelledby="ruta" className="flex flex-col gap-5">
        <h2 id="ruta" className="text-xl">
          Su ruta
        </h2>
        <ol className="flex flex-col gap-4">
          {estado.ruta.map((p, i) => (
            <li key={p.titulo} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-strong font-bold">{i + 1}</span>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold">{p.titulo}</p>
                <p>{p.descripcion}</p>
                {p.tema && (
                  <Link href={`/aprende?tema=${p.tema}`} className="inline-flex min-h-tap items-center self-start font-bold underline underline-offset-4">
                    Ver cursos
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
        {estado.asesoria && (
          <p role="status" className="rounded-md bg-surface p-4 font-bold">
            Listo: alguien del equipo le contacta para la asesoría.
          </p>
        )}
      </section>
    );
  }

  return (
    <form action={enviar} onSubmit={alEnviar} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿En qué va su negocio?</legend>
        {ETAPAS.map((e) => (
          <Opcion key={e.valor} name="etapa" value={e.valor} checked={etapa === e.valor} onChange={() => setEtapa(e.valor)} titulo={e.etiqueta} />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-bold">¿Con qué necesita ayuda?</legend>
        <p className="mb-2 text-text-muted">Puede elegir varias.</p>
        {NECESIDADES.map((n) => (
          <Opcion
            key={n.valor}
            tipo="checkbox"
            name="necesidades"
            value={n.valor}
            checked={necesidades.includes(n.valor)}
            onChange={() => setNecesidades((x) => (x.includes(n.valor) ? x.filter((v) => v !== n.valor) : [...x, n.valor]))}
            titulo={n.etiqueta}
          />
        ))}
      </fieldset>
      <Opcion tipo="checkbox" name="asesoria" value="si" checked={asesoria} onChange={() => setAsesoria(!asesoria)} titulo="Quiero que alguien me asesore" descripcion="Una persona del equipo le contacta." />
      {estado.error && (
        <p role="alert" className="font-bold text-danger">
          {estado.error}
        </p>
      )}
      <Button type="submit" ancho="completo" disabled={pendiente}>
        {pendiente ? "Preparando…" : "Ver mi ruta"}
      </Button>
    </form>
  );
}
