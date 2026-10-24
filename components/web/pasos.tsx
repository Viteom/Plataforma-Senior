import type { LucideIcon } from "lucide-react";

import type { Paso } from "@/lib/web/contenido";

import { MARCO, retraso } from "./marco";

// El orden lo lleva el color, de oscuro a claro: casi negro, bosque, cobalto, lima.
const COLORES = [
  "bg-text text-bg",
  "bg-deep text-on-deep",
  "bg-primary text-on-primary",
  "bg-accent text-on-accent",
];

// Cómo funciona: un acordeón que en pantalla grande se abre de lado (el paso abierto toma el
// ancho y los demás quedan como franjas con su nombre) y en celular se apila. Es <details> con un
// mismo «name»: se abre uno a la vez y funciona sin script.
export function Pasos({
  id,
  titulo,
  texto,
  pasos,
  iconos,
}: {
  id: string;
  titulo: string;
  texto: string;
  pasos: Paso[];
  iconos: LucideIcon[];
}) {
  return (
    <section aria-labelledby={id} className="bg-bg py-24 lg:py-36">
      <div className={MARCO}>
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id={id} data-aparecer className="titular-marca text-afiche lg:col-span-6">
            {titulo}
          </h2>
          <p data-aparecer style={retraso(1)} className="max-w-[44ch] text-xl lg:col-span-5 lg:col-start-8 lg:self-end">
            {texto}
          </p>
        </div>
        <ol data-aparecer style={retraso(2)} className="acordeon mt-16 flex flex-col overflow-hidden rounded-lg lg:flex-row">
          {pasos.map((paso, i) => {
            const Icono = iconos[i];
            return (
              <li key={paso.titulo} className="contents">
                <details name={id} open={i === 0} className={`group ${COLORES[i % COLORES.length]}`}>
                  <summary className="flex min-h-action list-none items-center justify-between gap-4 px-5 py-4 transition-opacity duration-150 hover:opacity-90 lg:px-8 lg:pt-8">
                    <h3 className="text-xl font-bold lg:group-open:font-display lg:group-open:text-titular lg:group-open:font-extrabold lg:group-open:tracking-tight">{paso.titulo}</h3>
                    <span aria-hidden className="text-2xl font-bold group-open:hidden lg:hidden">
                      +
                    </span>
                  </summary>
                  <div className="hidden flex-col gap-6 px-5 pb-6 group-open:flex lg:absolute lg:inset-x-0 lg:bottom-0 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:pb-8">
                    <p className="max-w-[36ch] text-lg lg:text-xl">{paso.texto}</p>
                    {Icono && <Icono aria-hidden strokeWidth={1.5} className="hidden size-28 shrink-0 lg:block" />}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
