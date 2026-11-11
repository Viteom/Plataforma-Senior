import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { RETRATOS } from "@/lib/web/home";

import { Escuchar } from "./escuchar";
import { FranjaOrganizaciones } from "./franja-organizaciones";

// El banner en tres tiempos sobre noche profunda: 1) solo los títulos y las dos puertas,
// 2) una fila de retratos altos que se desliza despacio, 3) la barra de organizaciones.
// Sin fotos detrás del titular: el mensaje se lee primero y las personas llegan después.
export function Banner() {
  // La pista va dos veces para que el giro no tenga salto; la copia no se anuncia.
  const pista = [...RETRATOS, ...RETRATOS];

  return (
    <section aria-labelledby="titulo-banner" className="overflow-hidden bg-deep text-on-deep">
      <div className="px-5 pt-36 pb-14 text-center font-web lg:pt-44 lg:pb-20">
        <Image src="/marca/kanna-simbolo-negativo.svg" alt="" width={96} height={96} unoptimized className="mx-auto w-14 lg:w-20" />
        <h1 id="titulo-banner" className="mt-6 text-banner font-semibold tracking-[-0.045em] text-balance">
          Tu experiencia <span className="block font-editorial font-normal tracking-[-0.02em] text-accent">abre caminos</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[40ch] text-lg text-azul-claro sm:text-xl">
          Para personas de 45 años o más y talento del campo colombiano. Oficios y profesiones, al mismo nivel.
        </p>
        {/* Una talento de 60 años tocó «Buscar talento» creyendo que era para ella: la pregunta va
            explícita y cada botón dice quién es la persona, no qué busca la plataforma. */}
        <p className="mt-8 text-xl font-semibold">¿Buscas trabajo o buscas talento?</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/entrar"
            className="inline-flex min-h-action items-center gap-2 rounded-full bg-accent px-7 text-lg font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.97]"
          >
            Busco trabajo: crear mi perfil
            <ArrowRight aria-hidden className="size-5" />
          </Link>
          <Link
            href="/organizaciones"
            className="inline-flex min-h-action items-center rounded-full border-2 border-on-deep px-7 text-lg font-semibold transition-colors hover:bg-on-deep hover:text-deep active:scale-[0.97]"
          >
            Busco talento para mi organización
          </Link>
        </div>
        <Escuchar />
      </div>

      {/* Retratos altos. Se detienen al pasar el mouse o al enfocarlos; con movimiento reducido
          quedan quietos y se recorren de lado con el dedo. */}
      <div
        className="banda overflow-x-auto pb-14 motion-safe:overflow-x-hidden motion-reduce:snap-x motion-reduce:snap-mandatory lg:pb-20"
        role="region"
        aria-label="Retratos de oficios y profesiones"
        tabIndex={0}
      >
        <ul className="banda-pista flex w-max gap-4 pr-4 motion-reduce:pl-4 md:gap-6 md:pr-6">
          {pista.map(({ foto }, i) => (
            <li
              key={`${foto}-${i}`}
              aria-hidden={i >= RETRATOS.length || undefined}
              className="group relative aspect-[5/8] w-[min(58vw,17rem)] shrink-0 snap-start overflow-hidden rounded-retrato bg-primary md:w-80"
            >
              <Image
                src={`/web/home/${foto}.webp`}
                alt=""
                fill
                priority={i < 4}
                sizes="(min-width: 768px) 20rem, 58vw"
                className="object-cover object-[center_20%] transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </li>
          ))}
        </ul>
      </div>

      <FranjaOrganizaciones />
    </section>
  );
}
