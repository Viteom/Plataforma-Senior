import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import type { Retrato as DatosRetrato } from "@/lib/web/contenido";

import { MARCO, retraso } from "./marco";
import { Retrato } from "./retrato";

type Item = { titulo: string; texto: string };

// Capítulo de color con una lista dicha en grande: el título arriba y los puntos en dos columnas.
export function ListaGrande({
  id,
  titulo,
  texto,
  items,
  color = "bg-deep text-on-deep",
  acento = "text-accent",
  pie,
}: {
  id: string;
  titulo: string;
  texto?: string;
  items: Item[];
  color?: string;
  acento?: string;
  pie?: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={cn("py-24 lg:py-36", color)}>
      <div className={MARCO}>
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id={`${id}-titulo`} data-aparecer className="titular-marca text-afiche lg:col-span-7">
            {titulo}
          </h2>
          {texto && (
            <p data-aparecer style={retraso(1)} className="max-w-[40ch] text-xl lg:col-span-4 lg:col-start-9 lg:self-end">
              {texto}
            </p>
          )}
        </div>
        <ul className="mt-16 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:mt-24">
          {items.map((it, i) => (
            <li key={it.titulo} data-aparecer style={retraso(i % 2)} className="flex flex-col gap-3">
              <h3 className={cn("titular-marca text-titular", acento)}>{it.titulo}</h3>
              <p className="max-w-[40ch] text-xl">{it.texto}</p>
            </li>
          ))}
        </ul>
        {pie && <div className="mt-16 lg:mt-24">{pie}</div>}
      </div>
    </section>
  );
}

type Puerta = { titulo: string; texto: string; href: string; accion: string; color: string; imagen?: DatosRetrato };

// Dos mitades a sangre, cada una con su color, su frase y su camino.
export function DosPuertas({ id, titulo, puertas }: { id: string; titulo: string; puertas: [Puerta, Puerta] }) {
  return (
    <section aria-labelledby={id} className="grid lg:grid-cols-2">
      <h2 id={id} className="sr-only">
        {titulo}
      </h2>
      {puertas.map((p, i) => (
        <Link
          key={p.titulo}
          href={p.href}
          className={cn(
            "group flex min-h-[60svh] flex-col justify-between gap-12 px-4 py-16 md:px-8 lg:min-h-[80svh] lg:py-20",
            i === 1 && "lg:pl-12",
            p.color,
          )}
        >
          <span className="flex flex-wrap items-start justify-between gap-8">
            <span data-aparecer style={retraso(i)} className="titular-marca max-w-[14ch] text-afiche">
              {p.titulo}
            </span>
            {p.imagen && (
              <span data-aparecer style={retraso(i + 1)} className="block w-40 sm:w-52 lg:w-60">
                <Retrato retrato={p.imagen} className="aspect-[4/5] w-full transition-transform duration-500 group-hover:-rotate-2" tamanos="15rem" />
              </span>
            )}
          </span>
          <span className="flex flex-col gap-6">
            <span data-aparecer style={retraso(i + 1)} className="max-w-[40ch] text-xl">
              {p.texto}
            </span>
            <span className="inline-flex items-center gap-2 text-xl font-bold underline underline-offset-4">
              {p.accion}
              <ArrowRight aria-hidden className="size-7 transition-transform duration-150 group-hover:translate-x-1.5" />
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}

// Una afirmación enorme a la izquierda y lo que la sostiene a la derecha.
export function Declaracion({
  id,
  titulo,
  children,
  color = "bg-bg text-text",
  retrato,
  fondoRetrato = "bg-accent",
}: {
  id: string;
  titulo: React.ReactNode;
  children: React.ReactNode;
  color?: string;
  retrato?: DatosRetrato;
  fondoRetrato?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("py-24 lg:py-36", color)}>
      <div className={cn(MARCO, "grid gap-10 lg:grid-cols-12 lg:gap-6")}>
        <h2 id={id} data-aparecer className="titular-marca text-afiche lg:col-span-6">
          {titulo}
        </h2>
        <div className="flex flex-col gap-10 lg:col-span-5 lg:col-start-8 lg:pt-4">
          <div data-aparecer style={retraso(1)} className="flex max-w-[48ch] flex-col gap-5 text-lg sm:text-xl">
            {children}
          </div>
          {retrato && (
            <div data-aparecer style={retraso(2)}>
              <Retrato retrato={retrato} fondo={fondoRetrato} className="max-h-[28rem] w-full" tamanos="(min-width: 64rem) 36vw, 90vw" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
