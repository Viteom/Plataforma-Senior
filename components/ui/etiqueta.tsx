import { Check, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";

// Chip de huella. El estado se lee en el texto y el ícono, no solo en el borde.
export function Etiqueta({ texto, confirmada }: { texto: string; confirmada?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-tap items-center gap-2 rounded-sm border-2 px-3 text-base",
        confirmada ? "border-text bg-bg font-bold" : "border-dashed border-border bg-surface",
      )}
    >
      {confirmada ? (
        <Check aria-hidden className="size-5" />
      ) : (
        <CircleDashed aria-hidden className="size-5" />
      )}
      {texto}
      <span className="sr-only">{confirmada ? "(confirmada)" : "(por confirmar)"}</span>
    </span>
  );
}
