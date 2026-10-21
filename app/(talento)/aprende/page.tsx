import { ExternalLink, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { Tarjeta } from "@/components/ui/tarjeta";
import { listarCursos, TEMAS } from "@/lib/datos/aprende";
import type { TemaCurso } from "@/lib/emprende/ruta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Aprende" };

const MODALIDAD = { virtual: "Por internet", presencial: "Presencial", mixta: "Mixta" };

export default async function Aprende({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema: crudo } = await searchParams;
  const tema = TEMAS.some((t) => t.valor === crudo) ? (crudo as TemaCurso) : undefined;
  const cursos = await listarCursos(tema);

  return (
    <Pantalla titulo="Aprende" intro="Cursos gratuitos de otras entidades, elegidos para usted.">
      {/* Filtros como enlaces: funcionan sin JavaScript y el tema no es un dato personal. */}
      <nav aria-label="Temas">
        <ul className="flex flex-wrap gap-2">
          {[{ valor: undefined, etiqueta: "Todos" }, ...TEMAS].map((t) => {
            const activo = t.valor === tema;
            return (
              <li key={t.etiqueta}>
                <Link
                  href={t.valor ? `/aprende?tema=${t.valor}` : "/aprende"}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-tap items-center rounded-full border-2 px-4 transition-colors duration-150",
                    activo ? "border-text bg-primary font-bold text-on-primary" : "border-border hover:bg-surface",
                  )}
                >
                  {t.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {cursos.length ? (
        <ul className="flex flex-col gap-4">
          {cursos.map((c) => (
            <li key={c.id}>
              <Tarjeta>
                <p className="text-base text-text-muted">
                  {c.entidad}
                  {c.modalidad && ` · ${MODALIDAD[c.modalidad]}`}
                  {c.gratuito && " · Gratis"}
                </p>
                <h2 className="text-xl">{c.titulo}</h2>
                {c.descripcion && <p>{c.descripcion}</p>}
                <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4">
                  Ir al curso
                  <ExternalLink aria-hidden className="size-5" />
                  <span className="sr-only">(se abre en otra página)</span>
                </a>
              </Tarjeta>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md bg-surface p-5">Todavía no hay cursos de este tema. Estamos buscando los mejores para usted.</p>
      )}

      <Tarjeta className="bg-surface">
        <Lightbulb aria-hidden className="size-8" />
        <h2 className="text-xl">¿Quiere emprender?</h2>
        <p>Responda unas preguntas y le sugerimos una ruta según la etapa de su idea.</p>
        <Link href="/emprende" className="inline-flex min-h-tap items-center self-start font-bold underline underline-offset-4">
          Ir a Emprende
        </Link>
      </Tarjeta>
    </Pantalla>
  );
}
