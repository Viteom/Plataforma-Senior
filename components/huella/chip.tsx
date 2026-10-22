import { Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  texto: string;
  activo: boolean;
  onAlternar: () => void;
  nueva?: boolean;
};

// Etiqueta que se puede quitar o agregar. El estado se lee en el ícono y en el texto
// del lector de pantalla (aria-pressed), no solo en el color.
export function ChipAlternable({ texto, activo, onAlternar, nueva }: Props) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onAlternar}
      className={cn(
        "inline-flex min-h-tap items-center gap-2 rounded-sm border-2 px-3 text-left text-base transition-colors duration-150",
        activo ? "border-text bg-bg font-bold" : "border-dashed border-border bg-surface text-text-muted hover:bg-surface-strong",
      )}
    >
      {activo ? <Check aria-hidden className="size-5 shrink-0" /> : <Plus aria-hidden className="size-5 shrink-0" />}
      {texto}
      {nueva && <span className="text-sm font-normal text-text-muted">(la revisa el equipo)</span>}
    </button>
  );
}
