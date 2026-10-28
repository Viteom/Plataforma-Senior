import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { panelEquipo } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";

export const metadata: Metadata = { title: "Curaduría de retos" };

const ETIQUETA_SEMAFORO: Record<string, string> = { verde: "Verde", amarillo: "Amarillo: revisar", rojo: "Rojo: devuelto" };

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

export default async function CuraduriaRetos() {
  const { conteos, cola } = await panelEquipo();
  const resumen = [
    { cuantos: conteos.amarillos, que: conteos.amarillos === 1 ? "reto en amarillo por revisar" : "retos en amarillo por revisar" },
    {
      cuantos: conteos.muestra,
      que: conteos.muestra === 1 ? "aprobación automática por confirmar" : "aprobaciones automáticas por confirmar",
    },
  ];

  return (
    <Pantalla titulo="Curaduría de retos" intro="Búsquedas de las organizaciones que esperan una decisión del equipo.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {resumen.map(({ cuantos, que }) => (
          <li key={que} className="flex flex-col rounded-md border-2 border-border-subtle p-5">
            <span className="text-3xl font-bold">{cuantos}</span>
            <span>{que}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/equipo/semaforo"
        className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4"
      >
        Reglas y umbrales del semáforo de trabajo digno
        <ArrowRight aria-hidden className="size-5" />
      </Link>

      <section aria-labelledby="titulo-cola" className="flex flex-col gap-3">
        <h2 id="titulo-cola" className="text-xl">
          Búsquedas por curar ({cola.length})
        </h2>
        {cola.length ? (
          <ul className="flex flex-col gap-3">
            {cola.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/equipo/problema/${n.id}`}
                  className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4 transition-colors duration-150 hover:border-text"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{n.empresa}</span>
                    {n.semaforo && (
                      <span className="rounded-full bg-surface px-3 text-base font-bold">
                        {ETIQUETA_SEMAFORO[n.semaforo] ?? n.semaforo}
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2">{n.problema}</span>
                  <span className="text-base text-text-muted">Desde el {fecha(n.creado_en)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No hay búsquedas esperando.</p>
        )}
      </section>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
