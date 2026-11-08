import { ArrowLeft, ArrowRight, CircleCheck, ExternalLink, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { buttonVariants } from "@/components/ui/button";
import { EscucharPantalla, TarjetaVideo } from "@/components/talento/voz";
import { Tarjeta } from "@/components/ui/tarjeta";
import { listarCursos, TEMAS } from "@/lib/datos/aprende";
import { miEmprendimiento, misCursosVistos } from "@/lib/datos/emprende";
import { VIDEOS_TALENTO } from "@/lib/talento/videos";
import type { TemaCurso } from "@/lib/emprende/ruta";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Aprende" };

const MODALIDAD = { virtual: "Por internet", presencial: "Presencial", mixta: "Mixta" };

export default async function Aprende({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema: crudo } = await searchParams;
  const tema = TEMAS.some((t) => t.valor === crudo) ? (crudo as TemaCurso) : undefined;
  const [cursos, vistos, ruta] = await Promise.all([listarCursos(tema), misCursosVistos(), miEmprendimiento()]);

  return (
    <Pantalla titulo="Aprende">
      <EscucharPantalla className="-mt-4" />
      {ruta && (
        <Link href="/emprende" className={buttonVariants({ variant: "secundario", size: "normal", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Volver a mi ruta de Emprende
        </Link>
      )}

      <section aria-labelledby="videos" className="flex flex-col gap-3">
        <h2 id="videos" className="text-2xl">
          Videos cortos
        </h2>
        <TarjetaVideo v={VIDEOS_TALENTO[0]} forma="destacado" />
        <ul className="flex flex-col gap-2.5">
          {VIDEOS_TALENTO.slice(1).map((v) => (
            <li key={v.id}>
              <TarjetaVideo v={v} forma="fila" />
            </li>
          ))}
        </ul>
      </section>

      <h2 className="-mb-4 text-2xl">Cursos gratis</h2>
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
                    activo ? "border-text bg-text font-bold text-bg" : "border-transparent bg-raised font-bold hover:bg-surface",
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
              <Tarjeta className="rounded-lg border-0 bg-raised shadow-tarjeta">
                <p className="text-base text-text-muted">
                  {c.entidad}
                  {c.modalidad && ` · ${MODALIDAD[c.modalidad]}`}
                  {c.gratuito && " · Gratis"}
                </p>
                <h2 className="text-xl">{c.titulo}</h2>
                {vistos.has(c.id) && (
                  <p className="inline-flex items-center gap-2 self-start rounded-full bg-exito-fondo px-3 py-1 text-base font-bold text-exito-texto">
                    <CircleCheck aria-hidden className="size-5" />
                    Ya lo abriste
                  </p>
                )}
                {c.descripcion && <p>{c.descripcion}</p>}
                <a href={`/aprende/ir/${c.id}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secundario", size: "normal", className: "self-start" })}>
                  Ir al curso
                  <ExternalLink aria-hidden />
                  <span className="sr-only">(se abre en otra pestaña)</span>
                </a>
                <p className="text-base text-text-muted">Se abre en otra pestaña. Kánna sigue abierta en esta: vuelve cuando quieras.</p>
              </Tarjeta>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg bg-raised p-5">Todavía no hay cursos de este tema. Estamos buscando los mejores para ti.</p>
      )}

      <Tarjeta className="rounded-lg border-0 bg-surface">
        <Lightbulb aria-hidden className="size-8" />
        <h2 className="text-xl">¿Quieres emprender?</h2>
        <p>Responde unas preguntas y te sugerimos una ruta según la etapa de tu idea.</p>
        <Link href="/emprende" className={buttonVariants({ variant: "secundario", size: "normal", className: "self-start" })}>
          Ir a Emprende
          <ArrowRight aria-hidden />
        </Link>
      </Tarjeta>
    </Pantalla>
  );
}
