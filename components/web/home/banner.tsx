import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FRANJA } from "@/lib/web/home";

import { Escuchar } from "./escuchar";

// El banner a pantalla completa: nueve oficios y profesiones, el titular con el símbolo de Kánna
// en medio y las dos puertas. En tablet quedan seis columnas y en celular cuatro.
export function Banner() {
  return (
    <section aria-labelledby="titulo-banner" className="relative h-svh min-h-[640px] overflow-hidden bg-tinta text-white">
      <div aria-hidden className="absolute inset-0 grid grid-cols-4 gap-[3px] md:grid-cols-6 xl:grid-cols-9">
        {/* Sin oficio ni ciudad encima: en las pruebas se leían como «lo que Kánna está buscando». */}
        {FRANJA.map(({ foto, oficio }, i) => (
          <div key={oficio} className={`relative overflow-hidden ${i >= 6 ? "hidden xl:block" : i >= 4 ? "hidden md:block" : ""}`}>
            <Image
              src={foto.src}
              alt=""
              fill
              priority={i < 4}
              sizes="(min-width: 1280px) 11vw, (min-width: 768px) 17vw, 25vw"
              className="respira object-cover object-[center_22%]"
              style={{ animationDelay: `${-(i % 3) * 5}s` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden className="velo-banner pointer-events-none absolute inset-0" />

      <div className="relative z-10 grid h-full place-items-center px-5 pt-24 pb-32 text-center font-web">
        <div>
          <h1
            id="titulo-banner"
            className="grid items-center justify-items-center gap-1.5 text-banner font-semibold tracking-[-0.045em] text-balance md:grid-cols-[auto_auto_auto] md:gap-x-[0.28em]"
          >
            <span>Tu experiencia</span>
            <Image src="/marca/kanna-simbolo-negativo.svg" alt="" width={140} height={140} unoptimized className="order-first w-16 md:order-none md:w-[clamp(4.5rem,9vw,8.75rem)]" />
            <span>abre caminos</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[40ch] text-lg opacity-95 sm:text-xl">
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
              className="inline-flex min-h-action items-center rounded-full bg-white px-7 text-lg font-semibold text-tinta active:scale-[0.97]"
            >
              Busco talento para mi organización
            </Link>
          </div>
          <Escuchar />
        </div>
      </div>
    </section>
  );
}
