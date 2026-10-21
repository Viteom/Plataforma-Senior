"use client";

import { Mail, Smartphone } from "lucide-react";
import { useActionState, useState } from "react";

import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { cn } from "@/lib/utils";

import { entrarDemo, enviarCodigo, type EstadoEntrar } from "./acciones";

type Medio = "celular" | "correo";

const medios = [
  { valor: "celular" as const, etiqueta: "Celular", icono: Smartphone },
  { valor: "correo" as const, etiqueta: "Correo", icono: Mail },
];

type Props = { para: "talento" | "empresa"; demo: boolean };

export function FormularioEntrar({ para, demo }: Props) {
  // Las empresas suelen entrar con correo; el talento, con celular (brief).
  const [medio, setMedio] = useState<Medio>(para === "empresa" ? "correo" : "celular");
  // Campos controlados: React 19 vacía el formulario después de cada envío, y tras un error
  // la persona no debería tener que escribir todo de nuevo.
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(enviarCodigo, {});

  return (
    <Pantalla
      titulo={para === "empresa" ? "Entrar como empresa" : "Entrar"}
      intro="Le enviamos un código de 6 números. No necesita contraseña."
    >
      <form
        // Siempre una acción de servidor (POST): el número nunca viaja en la URL.
        action={demo ? entrarDemo : accion}
        className="flex flex-col gap-8"
        noValidate
      >
        <input type="hidden" name="para" value={para} />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-lg font-bold">¿Dónde quiere recibir el código?</legend>
          <div className="grid grid-cols-2 gap-3">
            {medios.map(({ valor, etiqueta, icono: Icono }) => (
              <label
                key={valor}
                className={cn(
                  "flex min-h-action items-center justify-center gap-2 rounded-md border-2 px-3 text-lg transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus",
                  medio === valor
                    ? "border-text bg-surface-strong font-bold"
                    : "border-border hover:bg-surface",
                )}
              >
                <input
                  type="radio"
                  name="medio"
                  value={valor}
                  checked={medio === valor}
                  onChange={() => setMedio(valor)}
                  className="sr-only"
                />
                <Icono aria-hidden className="size-6" />
                {etiqueta}
              </label>
            ))}
          </div>
        </fieldset>

        {medio === "celular" ? (
          <Campo id="celular" etiqueta="Número de celular" ayuda="Solo los 10 números, sin el +57." error={estado.error}>
            {(p) => (
              <div className="flex items-stretch gap-2">
                <span className="flex min-h-action items-center rounded-sm bg-surface-strong px-4 text-lg font-bold">
                  +57
                </span>
                <Input
                  {...p}
                  name="celular"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="300 123 4567"
                  maxLength={16}
                />
              </div>
            )}
          </Campo>
        ) : (
          <Campo id="correo" etiqueta="Correo electrónico" error={estado.error}>
            {(p) => (
              <Input
                {...p}
                name="correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
              />
            )}
          </Campo>
        )}

        <Button type="submit" ancho="completo" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar código"}
        </Button>
      </form>
    </Pantalla>
  );
}
