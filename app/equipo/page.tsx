import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { panelEquipo } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";

export const metadata: Metadata = { title: "Curaduría" };

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

export default async function PanelCuraduria() {
  const { conteos, cola } = await panelEquipo();
  const pendientes = [
    { cuantos: conteos.necesidades, que: conteos.necesidades === 1 ? "búsqueda por curar" : "búsquedas por curar", href: "#cola" },
    { cuantos: conteos.empresas, que: conteos.empresas === 1 ? "empresa por verificar" : "empresas por verificar", href: "/equipo/empresas" },
    { cuantos: conteos.reportes, que: conteos.reportes === 1 ? "reporte abierto" : "reportes abiertos", href: "/equipo/empresas" },
    { cuantos: conteos.evidencias, que: conteos.evidencias === 1 ? "evidencia por revisar" : "evidencias por revisar", href: "/equipo/evidencias" },
    { cuantos: conteos.ayuda, que: conteos.ayuda === 1 ? "solicitud de ayuda" : "solicitudes de ayuda", href: "/equipo/ayuda" },
    { cuantos: conteos.avisos, que: conteos.avisos === 1 ? "aviso por dar" : "avisos por dar", href: "/equipo/ayuda#avisos" },
  ];

  return (
    <Pantalla titulo="Panel de curaduría" intro="Lo que espera una decisión del equipo.">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pendientes.map(({ cuantos, que, href }) => (
          <li key={que}>
            <Link
              href={href}
              className="flex min-h-28 items-center justify-between gap-4 rounded-md border-2 border-border-subtle p-5 transition-colors duration-150 hover:border-text"
            >
              <span className="flex flex-col">
                <span className="text-3xl font-bold">{cuantos}</span>
                <span>{que}</span>
              </span>
              <ArrowRight aria-hidden className="size-6 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      <section id="cola" aria-labelledby="titulo-cola" className="flex scroll-mt-6 flex-col gap-3">
        <h2 id="titulo-cola" className="text-xl">
          Búsquedas por curar
        </h2>
        {cola.length ? (
          <ul className="flex flex-col gap-3">
            {cola.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/equipo/problema/${n.id}`}
                  className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4 transition-colors duration-150 hover:border-text"
                >
                  <span className="text-lg font-bold">{n.empresa}</span>
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
