import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FilaRetratos } from "../fila-retratos";
import { Escuchar } from "./escuchar";
import { FranjaOrganizaciones } from "./franja-organizaciones";

// El banner en tres tiempos sobre noche profunda: 1) solo los títulos y las dos puertas,
// 2) una fila de retratos altos que se desliza despacio, 3) la barra de organizaciones.
// Sin fotos detrás del titular: el mensaje se lee primero y las personas llegan después.
export function Banner() {
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

      <FilaRetratos className="pb-14 lg:pb-20" />

      <FranjaOrganizaciones />
    </section>
  );
}
