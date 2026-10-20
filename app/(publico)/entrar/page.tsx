"use client";

import { Mail, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { cn } from "@/lib/utils";

type Medio = "celular" | "correo";

const medios = [
  { valor: "celular" as const, etiqueta: "Celular", icono: Smartphone },
  { valor: "correo" as const, etiqueta: "Correo", icono: Mail },
];

export default function Entrar() {
  const router = useRouter();
  const [medio, setMedio] = useState<Medio>("celular");

  // Hito 1: solo navega. En el hito 2 envía el código con Twilio Verify o Resend.
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    router.push("/entrar/codigo");
  }

  return (
    <Pantalla
      titulo="Entrar"
      intro="Le enviamos un código de 6 números. No necesita contraseña."
    >
      <form onSubmit={enviar} className="flex flex-col gap-8" noValidate>
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
          <Campo id="celular" etiqueta="Número de celular" ayuda="Solo los 10 números, sin el +57.">
            {(p) => (
              <div className="flex items-stretch gap-2">
                <span className="flex min-h-action items-center rounded-sm bg-surface-strong px-4 text-lg font-bold">
                  +57
                </span>
                <Input
                  {...p}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="300 123 4567"
                  maxLength={12}
                />
              </div>
            )}
          </Campo>
        ) : (
          <Campo id="correo" etiqueta="Correo electrónico">
            {(p) => (
              <Input
                {...p}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
              />
            )}
          </Campo>
        )}

        <Button type="submit" ancho="completo">
          Enviar código
        </Button>
      </form>
    </Pantalla>
  );
}
