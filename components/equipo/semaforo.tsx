import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

// El semáforo de trabajo digno de un reto o un acuerdo. Cada color lleva su ícono y su palabra:
// nunca se comunica solo con color.
const COLORES = {
  verde: { Icono: CheckCircle2, titulo: "Verde: cumple las reglas", clase: "bg-surface" },
  amarillo: { Icono: Clock, titulo: "Amarillo: necesita una mirada del equipo", clase: "bg-accent text-on-accent" },
  rojo: { Icono: AlertTriangle, titulo: "Rojo: no cumple y vuelve a la organización", clase: "border-2 border-danger bg-bg" },
} as const;

export function Semaforo({
  color,
  motivos = [],
  automatico,
}: {
  color: string | null | undefined;
  motivos?: string[] | null;
  automatico?: boolean;
}) {
  if (!color || !(color in COLORES)) return null;
  const { Icono, titulo, clase } = COLORES[color as keyof typeof COLORES];
  return (
    <div className={cn("flex flex-col gap-2 rounded-md p-4", clase)}>
      <p className="inline-flex items-center gap-2 font-bold">
        <Icono aria-hidden className="size-6 shrink-0" />
        {titulo}
        {automatico && color !== "amarillo" && <span className="font-normal">· decidido automáticamente</span>}
      </p>
      {motivos && motivos.length > 0 && (
        <ul className="list-disc pl-6">
          {motivos.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
