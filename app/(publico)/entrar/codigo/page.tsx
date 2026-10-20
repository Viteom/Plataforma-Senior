"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";

const ESPERA_REENVIO = 45;

export default function Codigo() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(ESPERA_REENVIO);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  // Hito 1: primera vez → perfil en 3 pasos. En el hito 2 se valida el código y,
  // si la persona ya tiene perfil, va a /inicio.
  function entrar(e: React.FormEvent) {
    e.preventDefault();
    router.push("/perfil/nuevo");
  }

  return (
    <Pantalla
      titulo="Escriba el código"
      intro={
        <>
          Se lo enviamos por mensaje de texto. Sirve durante 10 minutos.{" "}
          <Link href="/entrar" className="font-bold text-text underline underline-offset-4">
            Cambiar número
          </Link>
        </>
      }
    >
      <form onSubmit={entrar} className="flex flex-col gap-8" noValidate>
        <Campo id="codigo" etiqueta="Código de 6 números">
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              className={`${p.className} text-center text-2xl tracking-[0.3em]`}
            />
          )}
        </Campo>

        <Button type="submit" ancho="completo">
          Entrar
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-base text-text-muted">
          {segundos > 0
            ? `Puede pedir otro código en ${segundos} segundos.`
            : "¿No le llegó? Puede pedir otro código."}
        </p>
        {/* Solo se anuncia cuando ya se puede reenviar, no cada segundo */}
        <p aria-live="polite" className="sr-only">
          {segundos === 0 ? "Ya puede pedir otro código." : ""}
        </p>
        <Button
          variant="secundario"
          size="normal"
          disabled={segundos > 0}
          onClick={() => setSegundos(ESPERA_REENVIO)}
        >
          Enviar otro código
        </Button>
      </div>
    </Pantalla>
  );
}
