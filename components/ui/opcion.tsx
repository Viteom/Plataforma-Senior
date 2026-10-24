import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
  tipo?: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  icono?: React.ReactNode;
  className?: string;
};

// Opción grande y tocable (radio o casilla). La selección se ve con borde grueso,
// fondo y una marca dibujada, no solo con color.
export function Opcion({
  tipo = "radio",
  name,
  value,
  checked,
  onChange,
  titulo,
  descripcion,
  icono,
  className,
}: Props) {
  return (
    <label
      className={cn(
        "flex min-h-action items-start gap-3 rounded-md border-2 p-4 transition-[background-color,border-color,transform] duration-100 ease-out active:scale-[0.99] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus",
        checked ? "border-text bg-surface-strong" : "border-border hover:bg-surface active:bg-surface-strong",
        className,
      )}
    >
      <input
        type={tipo}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 size-6 shrink-0 accent-[var(--color-primary)] focus-visible:outline-none"
      />
      {icono}
      <span className="flex flex-col gap-1">
        <span className={cn("text-lg", checked && "font-bold")}>{titulo}</span>
        {descripcion && <span className="text-base text-text-muted">{descripcion}</span>}
      </span>
    </label>
  );
}
