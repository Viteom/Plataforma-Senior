"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";

import { entrarConClave, pasoDemo, verificarSegundoFactor, type EstadoEntradaEquipo } from "./acciones";

export function FormularioClave({ demo }: { demo: boolean }) {
  const [estado, accion, enviando] = useActionState<EstadoEntradaEquipo, FormData>(entrarConClave, {});
  // Controlados: React 19 vacía el formulario después de cada envío.
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [verClave, setVerClave] = useState(false);

  return (
    <form action={demo ? pasoDemo : accion} className="flex flex-col gap-6" noValidate>
      {demo && <input type="hidden" name="siguiente" value="codigo" />}
      <Campo id="correo" etiqueta="Correo del equipo">
        {(p) => (
          <Input
            {...p}
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        )}
      </Campo>
      <Campo id="clave" etiqueta="Clave" error={estado.error}>
        {(p) => (
          <div className="relative">
            <Input
              {...p}
              name="clave"
              type={verClave ? "text" : "password"}
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={`${p.className} pr-28`}
            />
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              aria-pressed={verClave}
              className="absolute top-1/2 right-2 min-h-tap -translate-y-1/2 px-3 font-bold underline underline-offset-4"
            >
              {verClave ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        )}
      </Campo>
      <Button type="submit" ancho="completo" disabled={enviando}>
        {enviando ? "Revisando…" : "Continuar"}
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}

export function FormularioCodigo({ demo, texto }: { demo: boolean; texto: string }) {
  const [estado, accion, enviando] = useActionState<EstadoEntradaEquipo, FormData>(verificarSegundoFactor, {});
  const [codigo, setCodigo] = useState("");

  return (
    <form action={demo ? pasoDemo : accion} className="flex flex-col gap-6" noValidate>
      {demo && <input type="hidden" name="siguiente" value="panel" />}
      <Campo id="codigo" etiqueta="Código de 6 números" error={estado.error}>
        {(p) => (
          <Input
            {...p}
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={`${p.className} text-center text-3xl font-bold tracking-[0.4em]`}
          />
        )}
      </Campo>
      <Button type="submit" ancho="completo" disabled={enviando}>
        {enviando ? "Revisando…" : texto}
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}
