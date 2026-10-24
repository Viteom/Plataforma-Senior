import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Retrato as DatosRetrato } from "@/lib/web/contenido";

import { MARCO } from "./marco";
import { Retrato } from "./retrato";

// Primera pantalla de cada página: el titular enorme arriba, a todo el ancho; debajo, la frase que
// dice qué es y las acciones a la izquierda, y a la derecha un círculo gigante de color que entra
// recortado por el borde, con el retrato en grabado encima. Nada se monta sobre el titular.
export function Afiche({
  titulo,
  texto,
  acciones,
  retrato,
  forma = "bg-primary",
  fondoRetrato = "bg-accent",
  formatoRetrato = "aspect-[2/3] h-[min(36rem,62svh)]",
  nota,
}: {
  titulo: React.ReactNode;
  texto: React.ReactNode;
  acciones?: React.ReactNode;
  retrato: DatosRetrato;
  forma?: string;
  fondoRetrato?: string;
  formatoRetrato?: string;
  nota?: string; // una garantía corta al pie de la columna de texto
}) {
  return (
    <section className="relative overflow-hidden bg-bg pb-14 lg:min-h-[calc(100svh-5rem)] lg:pb-0">
      <div className={cn(MARCO, "relative pt-6 lg:pt-10")}>
        <h1 className="titular-marca text-gigante">{titulo}</h1>
        <div className="mt-8 grid gap-12 lg:mt-12 lg:grid-cols-12 lg:gap-6">
          <div className="relative z-10 flex flex-col gap-8 lg:col-span-5 lg:pb-16">
            <p className="max-w-[40ch] text-lg sm:text-xl">{texto}</p>
            {acciones && <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{acciones}</div>}
            {nota && (
              <p className="flex max-w-[34ch] items-start gap-3 rounded-md bg-surface p-4 text-lg font-bold lg:mt-auto">
                <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-deep" />
                {nota}
              </p>
            )}
          </div>
          <div className="relative flex justify-center lg:col-span-6 lg:col-start-7 lg:justify-end">
            <div
              aria-hidden
              className={cn(
                "absolute top-12 left-1/2 size-[130vw] -translate-x-1/2 rounded-full",
                "lg:top-10 lg:left-0 lg:size-[120vh] lg:translate-x-0",
                forma,
              )}
            />
            <div className="persiana relative max-w-full lg:mr-[6%]">
              <Retrato
                retrato={retrato}
                fondo={fondoRetrato}
                prioridad
                className={cn("max-w-[78vw]", formatoRetrato)}
                tamanos="(min-width: 64rem) 30vw, 80vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
