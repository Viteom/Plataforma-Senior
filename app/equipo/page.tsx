import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";

export const metadata: Metadata = { title: "Curaduría" };

const pendientes = [
  { cuantos: 2, que: "problemas de empresas por curar", href: "/equipo/problema/ejemplo" },
  { cuantos: 1, que: "solicitud de experiencia por cotizar", href: "/equipo/experiencias" },
  { cuantos: 3, que: "solicitudes de ayuda abiertas", href: "/equipo/ayuda" },
  { cuantos: 4, que: "etiquetas nuevas por revisar", href: "/equipo" },
];

export default function PanelCuraduria() {
  return (
    <Pantalla titulo="Panel de curaduría" intro="Lo que espera una decisión del equipo hoy.">
      <ul className="grid gap-4 sm:grid-cols-2">
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
      <p className="text-base text-text-muted">Datos de ejemplo.</p>
      <Pendiente hito={4}>Cola real de curaduría y revisión de etiquetas fuera de la taxonomía.</Pendiente>
    </Pantalla>
  );
}
