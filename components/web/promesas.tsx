import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PROMESAS } from "@/lib/web/contenido";

import { MARCO, retraso } from "./marco";

// Capítulo oscuro de confianza: lo que preocupa, dicho en grande y sin letra pequeña.
export function Promesas({ enlace = true }: { enlace?: boolean }) {
  return (
    <section aria-labelledby="confianza" className="bg-deep py-24 text-on-deep lg:py-36">
      <div className={MARCO}>
        <h2 id="confianza" data-aparecer className="titular-marca max-w-[16ch] text-afiche">
          Hecho para que confíes
        </h2>
        <ul className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:mt-24">
          {PROMESAS.map((p, i) => (
            <li key={p.titulo} data-aparecer style={retraso(i % 2)} className="flex flex-col gap-4">
              <h3 className="titular-marca text-titular text-accent">{p.titulo}</h3>
              <p className="max-w-[36ch] text-xl">{p.texto}</p>
            </li>
          ))}
        </ul>
        {enlace && (
          <Link
            href="/confianza"
            className="group mt-16 inline-flex min-h-action items-center gap-2 text-xl font-bold underline underline-offset-4 lg:mt-24"
          >
            Cómo te protegemos
            <ArrowRight aria-hidden className="size-6 transition-transform duration-150 group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </section>
  );
}
