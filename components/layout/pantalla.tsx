import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
  titulo: string;
  intro?: React.ReactNode;
  antesDelTitulo?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

// Cuerpo común de cada pantalla: un h1, una introducción corta y el contenido.
export function Pantalla({ titulo, intro, antesDelTitulo, className, children }: Props) {
  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <div className="flex flex-col gap-3">
        {antesDelTitulo}
        <h1 className="text-2xl lg:text-3xl">{titulo}</h1>
        {intro && <div className="max-w-prose text-lg text-text-muted">{intro}</div>}
      </div>
      {children}
    </div>
  );
}
