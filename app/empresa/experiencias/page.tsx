import { Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { experienciaEjemplo as exp } from "@/lib/demo";

export const metadata: Metadata = { title: "Experiencias con saberes" };

export default function Experiencias() {
  return (
    <Pantalla
      titulo="Experiencias con saberes"
      intro="Talleres y ceremonias para su equipo, guiados por sabedoras y sabedores desde su oficio."
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article className="relative flex flex-col gap-4 overflow-hidden rounded-md border-2 border-border-subtle transition-colors duration-150 focus-within:border-text hover:border-text">
          {/* Espacio reservado para la foto: evita saltos cuando llegue */}
          <div className="flex aspect-[4/3] items-center justify-center bg-surface-strong">
            <Sparkles aria-hidden className="size-12 text-text-muted" />
          </div>
          <div className="flex flex-col gap-3 px-5 pb-5">
            <p className="self-start rounded-sm border-2 border-dashed border-border px-2 text-sm font-bold">
              Borrador
            </p>
            <h2 className="text-xl">
              <Link href={`/empresa/experiencias/${exp.slug}`} className="after:absolute after:inset-0">
                {exp.nombre}
              </Link>
            </h2>
            <p className="line-clamp-3 text-text-muted">{exp.proposito}</p>
            <p className="flex items-center gap-2 text-base">
              <Users aria-hidden className="size-5" />
              {exp.paraQuien}
            </p>
          </div>
        </article>
      </div>
    </Pantalla>
  );
}
