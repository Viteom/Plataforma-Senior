"use client";

import { Button } from "@/components/ui/button";
import { useAccion } from "@/components/ui/use-accion";
import { cn } from "@/lib/utils";

export type EstadoAccion = { error?: string; aviso?: string };

type Props = {
  accion: (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>;
  campos: Record<string, string>;
  texto: string;
  textoEnviando?: string;
  variant?: "primario" | "secundario" | "suave" | "enlace";
  size?: "accion" | "normal";
  ancho?: "completo" | "auto";
  className?: string;
  children?: React.ReactNode; // campos visibles adicionales
};

// Un botón que ejecuta una acción del servidor (POST) y muestra el resultado en palabras.
export function BotonAccion({ accion, campos, texto, textoEnviando = "Guardando…", variant, size, ancho, className, children }: Props) {
  const { estado, enviar, pendiente: enviando, alEnviar } = useAccion<EstadoAccion>(accion, {});
  const hecho = Boolean(estado.aviso);

  return (
    <form action={enviar} onSubmit={alEnviar} className={cn("flex flex-col gap-3", className)}>
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      {children}
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
      {!hecho && (
        <Button type="submit" variant={variant} size={size} ancho={ancho} disabled={enviando}>
          {enviando ? textoEnviando : texto}
        </Button>
      )}
    </form>
  );
}
