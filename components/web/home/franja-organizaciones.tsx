import Image from "next/image";

import { MODO_DEMO } from "@/lib/demo";
import { ORGANIZACIONES, ORGANIZACIONES_EJEMPLO } from "@/lib/web/home";

// Barra de organizaciones al pie del banner: una tira clara con sus nombres o logos que se desliza
// despacio (se detiene al pasar el mouse o al enfocarla). Sale solo cuando hay organizaciones
// reales con permiso; en la demostración usa nombres de ejemplo, y lo dice.
export function FranjaOrganizaciones() {
  const ejemplo = ORGANIZACIONES.length === 0 && MODO_DEMO;
  const lista = ejemplo ? ORGANIZACIONES_EJEMPLO : ORGANIZACIONES;
  if (!lista.length) return null;

  // Cada nombre alterna de letra para que la tira se lea como una fila de marcas distintas.
  const letras = ["font-display font-extrabold tracking-tight", "font-editorial text-[1.3em]", "font-web font-semibold tracking-tight"];
  // Dos vueltas para que el giro no tenga salto; la copia no se anuncia.
  const pista = [...lista, ...lista];

  return (
    <div className="mx-3 rounded-t-lg bg-bg pt-5 pb-6 font-web text-tinta sm:mx-6 lg:mx-10">
      <p className="px-5 text-center text-base text-text-muted">
        {ejemplo ? "Así se verían las organizaciones (nombres de ejemplo)" : "Organizaciones que ya trabajan con talento de Kánna"}
      </p>
      <div
        className="banda mt-4 overflow-x-auto motion-safe:overflow-x-hidden"
        role="region"
        aria-label="Organizaciones"
        tabIndex={0}
      >
        <ul className="banda-pista flex w-max items-center gap-14 pr-14 motion-reduce:pl-5 lg:gap-20 lg:pr-20">
          {pista.map((o, i) => (
            <li key={`${o.nombre}-${i}`} aria-hidden={i >= lista.length || undefined} className="shrink-0 text-xl whitespace-nowrap lg:text-2xl">
              {o.logo ? (
                <Image src={`/web/organizaciones/${o.logo}`} alt={o.nombre} width={160} height={40} unoptimized className="h-10 w-auto" />
              ) : (
                <span className={letras[(i % lista.length) % letras.length]}>{o.nombre}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
