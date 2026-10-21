"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { useAccion } from "@/components/ui/use-accion";
import type { Propuesta } from "@/lib/datos/equipo";

import { enviarElegidos, type Estado } from "../../acciones";

const MAX = 5;

// Elegir hasta 5 de los 10 propuestos, con una línea de por qué que verá la empresa (brief).
export function ElegirPropuestos({ need, propuestas }: { need: string; propuestas: Propuesta[] }) {
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [razones, setRazones] = useState<Record<string, string>>({});
  const { estado, enviar, pendiente: enviando, alEnviar } = useAccion<Estado>(enviarElegidos, {});

  const alternar = (id: string) =>
    setElegidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : e.length < MAX ? [...e, id] : e));

  return (
    <form action={enviar} onSubmit={alEnviar} className="flex flex-col gap-6">
      <input type="hidden" name="need" value={need} />
      {elegidos.map((id) => (
        <input key={id} type="hidden" name="elegido" value={id} />
      ))}
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-bold">
          {propuestas.length} propuestos por el puntaje · elegidos {elegidos.length} de {MAX}
        </legend>
        {propuestas.map((p) => {
          const elegido = elegidos.includes(p.id);
          return (
            <div key={p.id} className={`flex flex-col gap-3 rounded-md border-2 p-4 ${elegido ? "border-text" : "border-border-subtle"}`}>
              <label className="flex min-h-tap items-start gap-3">
                <input
                  type="checkbox"
                  checked={elegido}
                  onChange={() => alternar(p.id)}
                  disabled={!elegido && elegidos.length >= MAX}
                  className="mt-1 size-6 shrink-0 accent-[var(--color-primary)]"
                />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-lg font-bold">{p.nombre}</span>
                    <span className="font-bold">Puntaje {p.puntaje} de 100</span>
                  </span>
                  <span className="text-text-muted">
                    {[p.oficio, p.ubicacion].filter(Boolean).join(" · ")}
                  </span>
                  {p.coincidencias.length > 0 && <span className="text-base">Coincide en: {p.coincidencias.join(", ")}</span>}
                  {p.faltan.length > 0 && <span className="text-base font-bold">Le falta (obligatorio): {p.faltan.join(", ")}</span>}
                </span>
              </label>
              {elegido && (
                <Campo id={`razon-${p.id}`} etiqueta="Por qué (lo verá la empresa)" ayuda="Una línea. Sin edad, años ni fechas.">
                  {(props) => (
                    <Input
                      {...props}
                      name={`razon-${p.id}`}
                      value={razones[p.id] ?? ""}
                      onChange={(e) => setRazones((r) => ({ ...r, [p.id]: e.target.value }))}
                      maxLength={200}
                    />
                  )}
                </Campo>
              )}
            </div>
          );
        })}
      </fieldset>
      {estado.error && (
        <p role="alert" className="font-bold text-danger">
          {estado.error}
        </p>
      )}
      {estado.aviso && (
        <p role="status" className="font-bold text-success">
          {estado.aviso}
        </p>
      )}
      <Button type="submit" disabled={enviando || !elegidos.length} className="self-start">
        {enviando
          ? "Enviando…"
          : !elegidos.length
            ? "Elija al menos una persona"
            : elegidos.length === 1
              ? "Enviar a la persona elegida"
              : `Enviar a las ${elegidos.length} personas elegidas`}
      </Button>
    </form>
  );
}
