import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FilaRetratos } from "./fila-retratos";

type Accion = { href: string; texto: string };

// Portada de «Soy talento» y «Soy empresa», en la misma línea del home: noche profunda, el símbolo,
// el titular en dos tiempos (la segunda línea en la cursiva de marca, color maíz), las acciones y
// debajo la fila de retratos. La cabecera va transparente encima (components/web/cabecera.tsx).
export function PortadaOscura({
  titulo,
  remate,
  texto,
  accion,
  secundaria,
  nota,
  desde,
  children,
}: {
  /** Algo al pie de la portada, sobre el mismo fondo (la barra de organizaciones). */
  children?: React.ReactNode;
  titulo: string;
  /** Segunda línea del titular, en cursiva. */
  remate: string;
  texto: string;
  accion: Accion;
  secundaria?: Accion;
  /** Una garantía corta debajo de las acciones. */
  nota?: string;
  /** Por cuál retrato empieza la fila. */
  desde?: number;
}) {
  return (
    <section aria-labelledby="titulo-portada" className="overflow-hidden bg-deep text-on-deep">
      <div className="px-5 pt-36 pb-14 text-center font-web lg:pt-44 lg:pb-20">
        <Image src="/marca/kanna-simbolo-negativo.svg" alt="" width={96} height={96} unoptimized className="mx-auto w-14 lg:w-20" />
        <h1 id="titulo-portada" className="mt-6 text-banner font-semibold tracking-[-0.045em] text-balance">
          {titulo} <span className="block font-editorial font-normal tracking-[-0.02em] text-accent">{remate}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[44ch] text-lg text-azul-claro sm:text-xl">{texto}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={accion.href}
            className="inline-flex min-h-action items-center rounded-full bg-accent px-7 text-lg font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.97]"
          >
            {accion.texto}
          </Link>
          {secundaria && (
            <Link
              href={secundaria.href}
              className="inline-flex min-h-action items-center rounded-full border-2 border-on-deep px-7 text-lg font-semibold transition-colors hover:bg-on-deep hover:text-deep active:scale-[0.97]"
            >
              {secundaria.texto}
            </Link>
          )}
        </div>
        {nota && (
          <p className="mx-auto mt-8 inline-flex max-w-[calc(100%-1rem)] items-center gap-2 rounded-full bg-primary px-5 py-2 text-base font-semibold">
            <ShieldCheck aria-hidden className="size-5 shrink-0 text-accent" />
            {nota}
          </p>
        )}
      </div>
      <FilaRetratos desde={desde} className="pb-14 lg:pb-20" />
      {children}
    </section>
  );
}
