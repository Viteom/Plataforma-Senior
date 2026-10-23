"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";

import { codigoDemo, reenviarCodigo, verificarCodigo, type EstadoEntrar } from "../acciones";

const ESPERA_REENVIO = 45;

type Props = { enviadoA: string | null; porCorreo: boolean; demo: boolean };

export function FormularioCodigo({ enviadoA, porCorreo, demo }: Props) {
  const [segundos, setSegundos] = useState(ESPERA_REENVIO);
  // Controlado para que un código mal escrito no se borre al mostrar el error.
  const [codigo, setCodigo] = useState("");
  const [estado, verificar, verificando] = useActionState<EstadoEntrar, FormData>(verificarCodigo, {});
  const [reenvio, reenviar, reenviando] = useActionState<EstadoEntrar>(reenviarCodigo, {});

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  // Un reenvío que salió bien reinicia la espera de 45 segundos.
  useEffect(() => {
    if (reenvio.aviso) setSegundos(ESPERA_REENVIO);
  }, [reenvio]);

  const medio = porCorreo ? "correo" : "mensaje de texto";

  return (
    <Pantalla
      titulo="Escribe el código"
      intro={
        <>
          Te lo enviamos por {medio}
          {enviadoA && (
            <>
              {" "}
              al <span className="font-bold text-text">{enviadoA}</span>
            </>
          )}
          . Sirve durante 10 minutos.{" "}
          <Link href="/entrar" className="font-bold text-text underline underline-offset-4">
            Cambiar
          </Link>
        </>
      }
    >
      <form
        action={demo ? codigoDemo : verificar}
        className="flex flex-col gap-8"
        noValidate
      >
        <Campo id="codigo" etiqueta="Código de 6 números" error={estado.error}>
          {(p) => (
            <Input
              {...p}
              name="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              className={`${p.className} text-center text-2xl tracking-[0.3em]`}
            />
          )}
        </Campo>

        <Button type="submit" ancho="completo" disabled={verificando}>
          {verificando ? "Revisando…" : "Entrar"}
        </Button>
      </form>

      <form action={demo ? undefined : reenviar} className="flex flex-col gap-2">
        <p className="text-base text-text-muted">
          {segundos > 0
            ? `Puedes pedir otro código en ${segundos} segundos.`
            : "¿No te llegó? Puedes pedir otro código."}
        </p>
        {/* Solo se anuncia cuando ya se puede reenviar o cuando cambia el resultado, no cada segundo */}
        <p aria-live="polite" className="text-base font-bold">
          {segundos === 0 && !reenvio.error && !reenvio.aviso ? <span className="sr-only">Ya puedes pedir otro código.</span> : null}
          {reenvio.aviso}
          {reenvio.error && <span className="text-danger">{reenvio.error}</span>}
        </p>
        <Button
          type={demo ? "button" : "submit"}
          variant="secundario"
          size="normal"
          disabled={segundos > 0 || reenviando}
          onClick={demo ? () => setSegundos(ESPERA_REENVIO) : undefined}
        >
          {reenviando ? "Enviando…" : "Enviar otro código"}
        </Button>
      </form>
    </Pantalla>
  );
}
