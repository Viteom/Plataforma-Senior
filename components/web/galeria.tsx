import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PERFILES_MUESTRA } from "@/lib/web/contenido";

import { MARCO, retraso } from "./marco";

// Cada retrato lleva pegada debajo su franja con el oficio, como una etiqueta colgada de una
// pieza. Los colores de la franja rotan para que dos vecinas nunca coincidan.
const FRANJAS = [
  "bg-primary text-on-primary",
  "bg-surface-strong text-text",
  "bg-deep text-on-deep",
  "bg-accent text-on-accent",
  "bg-surface-strong text-text",
];
const FONDOS = ["bg-accent", "bg-surface", "bg-accent", "bg-surface", "bg-accent"];

export function GaleriaOficios() {
  return (
    <section aria-labelledby="oficios" className="bg-bg pb-24 lg:pb-36">
      <div className={MARCO}>
        <div className="grid gap-4 lg:grid-cols-12">
          <h2 id="oficios" data-aparecer className="titular-marca text-afiche lg:col-span-7">
            Oficios y profesiones
          </h2>
          <p data-aparecer style={retraso(1)} className="max-w-[40ch] text-xl lg:col-span-4 lg:col-start-9 lg:self-end">
            Al mismo nivel: una tejedora, un ebanista o una contadora. Contamos lo que cada persona sabe
            hacer. Perfiles de ejemplo.
          </p>
        </div>
        <ul className="mt-14 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {PERFILES_MUESTRA.map((p, i) => (
            <li key={p.oficio} data-aparecer style={retraso(i % 3)} className="group flex flex-col">
              <div className={`aspect-[4/5] overflow-hidden ${FONDOS[i]}`}>
                <Image
                  src={p.retrato.src}
                  alt={p.retrato.alt}
                  width={p.retrato.ancho}
                  height={p.retrato.alto}
                  sizes="(min-width: 64rem) 30vw, 48vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <div className={`flex min-h-28 flex-col justify-between gap-2 p-3 sm:p-4 ${FRANJAS[i]}`}>
                <h3 className="text-lg font-bold sm:text-xl">{p.oficio}</h3>
                <p className="text-base">{p.capacidades.join(" · ")}</p>
                <p className="flex flex-wrap justify-between gap-x-4 text-base">
                  <span>{p.lugar}</span>
                  <span>{p.forma}</span>
                </p>
              </div>
            </li>
          ))}
          <li data-aparecer style={retraso(2)} className="flex flex-col">
            <Link
              href="/entrar"
              className="group flex h-full min-h-72 flex-col justify-end gap-6 bg-primary p-5 text-on-primary transition-colors duration-150 hover:bg-primary-hover sm:p-8"
            >
              <span className="font-display text-lg font-extrabold tracking-tight sm:text-titular">Tu oficio también cuenta</span>
              <span className="inline-flex items-center gap-2 text-lg font-bold underline underline-offset-4">
                Crear mi perfil
                <ArrowRight aria-hidden className="size-6 transition-transform duration-150 group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
