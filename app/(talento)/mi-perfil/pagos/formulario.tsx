"use client";

import { Banknote, Landmark, Smartphone, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { useAccion } from "@/components/ui/use-accion";

import { guardarPreferenciaPago, type Estado } from "../acciones";

type Metodo = "nequi" | "daviplata" | "banco" | "giro";

const OPCIONES: { valor: Metodo; nombre: string; detalle: string; Icono: LucideIcon }[] = [
  { valor: "nequi", nombre: "Nequi", detalle: "Te llega al celular.", Icono: Smartphone },
  { valor: "daviplata", nombre: "Daviplata", detalle: "Te llega al celular.", Icono: Smartphone },
  {
    valor: "banco",
    nombre: "Cuenta de banco",
    detalle: "De ahorros o corriente, a tu nombre. El número lo escribes en la página segura de pagos cuando firmes tu primer acuerdo.",
    Icono: Landmark,
  },
  {
    valor: "giro",
    nombre: "Giro para cobrar en efectivo",
    detalle: "Lo retiras con tu cédula en un punto Gana u otra red cercana. Si tiene costo, te lo decimos antes.",
    Icono: Banknote,
  },
];

type Props = {
  actual: { metodo: Metodo; celular: string | null } | null;
  // El celular con el que entra, ya oculto a medias («300 *** 4567»); null si entra con correo.
  celularCuenta: string | null;
};

export function FormularioPagos({ actual, celularCuenta }: Props) {
  const [metodo, setMetodo] = useState<Metodo | null>(actual?.metodo ?? null);
  const [mismo, setMismo] = useState(celularCuenta !== null && !actual?.celular);
  const [celular, setCelular] = useState(actual?.celular ?? "");
  // También en la demostración es una acción del servidor (POST): el celular nunca va en la URL.
  const { estado, enviar, pendiente, alEnviar } = useAccion<Estado>(guardarPreferenciaPago, {});
  const billetera = metodo === "nequi" || metodo === "daviplata";
  const nombre = OPCIONES.find((o) => o.valor === metodo)?.nombre;

  return (
    <form action={enviar} onSubmit={alEnviar} className="flex flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-xl font-bold">Elige una opción</legend>
        {OPCIONES.map(({ valor, nombre, detalle, Icono }) => (
          <label
            key={valor}
            className="flex cursor-pointer items-start gap-3 rounded-lg border-2 border-border bg-raised p-4 has-[:checked]:border-text has-[:checked]:ring-1 has-[:checked]:ring-text has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
          >
            <input
              type="radio"
              name="metodo"
              value={valor}
              checked={metodo === valor}
              onChange={() => setMetodo(valor)}
              className="mt-2.5 size-6 shrink-0 accent-primary"
            />
            <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-md bg-surface">
              <Icono className="size-6" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold">{nombre}</span>
              <span className="text-base text-text-muted">{detalle}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {billetera && (
        <div className="flex flex-col gap-4 rounded-lg bg-surface p-4">
          {celularCuenta ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 font-bold">
                ¿Tu {nombre} está en el celular con el que entras, {celularCuenta}?
              </legend>
              {[
                { v: true, t: `Sí, es mi ${nombre}` },
                { v: false, t: "Está en otro número" },
              ].map(({ v, t }) => (
                <label key={t} className="flex min-h-tap cursor-pointer items-center gap-3">
                  <input type="radio" checked={mismo === v} onChange={() => setMismo(v)} className="size-6 accent-primary" />
                  {t}
                </label>
              ))}
            </fieldset>
          ) : null}
          <input type="hidden" name="mismo_celular" value={celularCuenta && mismo ? "si" : "no"} />
          {(!celularCuenta || !mismo) && (
            <Campo id="celular-pago" etiqueta={`Número de tu ${nombre}`} ayuda="Solo los 10 números, sin el +57.">
              {(p) => (
                <Input
                  {...p}
                  name="celular"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={16}
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                />
              )}
            </Campo>
          )}
        </div>
      )}

      {estado.error && (
        <p role="alert" className="font-bold text-danger">
          {estado.error}
        </p>
      )}
      {estado.aviso && (
        <p role="status" className="font-bold">
          {estado.aviso}
        </p>
      )}
      <Button type="submit" ancho="completo" disabled={pendiente || !metodo}>
        {pendiente ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
