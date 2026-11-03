import { ArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { REJILLA } from "@/lib/web/home";

// «Lo que sabes importa»: retratos que cuelgan desde arriba y el titular en dos tonos. En tablet y
// celular cada columna muestra una sola foto completa, para no cortar caras ni montarse al texto.
export function Importa() {
  return (
    <section aria-labelledby="titulo-importa" className="overflow-hidden bg-neutro pb-24 font-web text-tinta lg:pb-32">
      <div aria-hidden className="mx-auto grid max-w-[1320px] grid-cols-5 gap-2 px-4 md:grid-cols-7 md:gap-3.5 md:px-6 xl:grid-cols-10">
        {REJILLA.map(({ vacio, fotos }, i) => (
          <div key={i} className={`flex flex-col gap-2 md:gap-3.5 ${i >= 7 ? "hidden xl:flex" : i >= 5 ? "hidden md:flex" : ""}`}>
            <div
              className="h-[min(var(--vacio),4.5rem)] rounded-md bg-gradient-to-b from-white/0 to-white xl:h-(--vacio)"
              style={{ "--vacio": `${vacio}px` } as React.CSSProperties}
            />
            {fotos.map((f, j) => (
              <Image
                key={f}
                src={`/web/home/${f}.webp`}
                alt=""
                width={320}
                height={400}
                sizes="(min-width: 1280px) 10vw, 20vw"
                className={`aspect-[4/5] w-full rounded-md object-cover object-[center_20%] ${j > 0 ? "hidden xl:block" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-7 max-w-web px-4 text-center md:px-8">
        <span className="inline-flex rounded-full bg-raised px-3.5 py-1.5 text-sm font-medium">Lo que sabes importa</span>
        <h2 id="titulo-importa" className="mt-4 text-seccion font-medium tracking-[-0.035em] text-balance">
          Lo vivido vale más <span className="block text-tinta-suave">que un diploma.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-lg sm:text-xl">
          Kánna convierte tu historia en una huella de capacidades que las organizaciones entienden. La cuentas con tu voz o
          por escrito; nosotros la ordenamos contigo.
        </p>
        <Link
          href="#como-funciona"
          className="mt-8 inline-flex min-h-action items-center gap-2 rounded-full bg-primary px-7 text-lg font-semibold text-on-primary active:scale-[0.97]"
        >
          Así funciona
          <ArrowDown aria-hidden className="size-5" />
        </Link>
      </div>
    </section>
  );
}
