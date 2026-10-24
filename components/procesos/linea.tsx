import { Check, ChevronRight, Circle, CircleDot, Clock, Hand, UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { ETAPAS, textoTurno, type Etapa, type Lado, type Situacion } from "@/lib/procesos";

// Las seis etapas en una línea. Hecha, la de ahora y las que faltan se distinguen con ícono,
// peso de letra y texto para lector de pantalla, no solo con color.
export function LineaProceso({ etapa }: { etapa: Etapa }) {
  const actual = ETAPAS.findIndex((e) => e.id === etapa);
  const terminado = etapa === "terminado";
  return (
    <ol aria-label="Etapas" className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {ETAPAS.map((e, i) => {
        const hecha = i < actual || terminado;
        const ahora = i === actual && !terminado;
        return (
          <li key={e.id} aria-current={ahora ? "step" : undefined} className="flex items-center gap-1 text-base">
            {hecha ? (
              <Check aria-hidden className="size-5 shrink-0 text-deep" strokeWidth={3} />
            ) : ahora ? (
              <CircleDot aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={2.5} />
            ) : (
              <Circle aria-hidden className="size-5 shrink-0 text-border" />
            )}
            <span className={cn(ahora && "font-bold", !hecha && !ahora && "text-text-muted")}>{e.nombre}</span>
            <span className="sr-only">{hecha ? ", hecha" : ahora ? ", etapa actual" : ", pendiente"}</span>
            {i < ETAPAS.length - 1 && <ChevronRight aria-hidden className="size-4 shrink-0 text-text-muted" />}
          </li>
        );
      })}
    </ol>
  );
}

const ICONO_TURNO = { tuyo: Hand, otro: Clock, equipo: UsersRound, nadie: null };

// Qué está pasando y a quién le toca. Cuando te toca, el cuadro es lima y lo dice en palabras.
export function CuadroSituacion({ s, lado }: { s: Situacion; lado: Lado }) {
  const turno = textoTurno(s.turno, lado);
  const Icono = ICONO_TURNO[s.turno];
  return (
    <div className={cn("flex flex-col gap-1 rounded-md p-4", s.turno === "tuyo" ? "bg-accent text-on-accent" : "bg-surface")}>
      {turno && (
        <p className="inline-flex items-center gap-2 text-base font-bold">
          {Icono && <Icono aria-hidden className="size-5 shrink-0" />}
          {turno}
        </p>
      )}
      <p className="text-lg font-bold first-letter:uppercase">{s.titulo}</p>
      {s.detalle && <p className="text-base first-letter:uppercase">{s.detalle}</p>}
    </div>
  );
}
