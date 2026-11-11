import Image from "next/image";

import { RETRATOS } from "@/lib/web/home";
import { cn } from "@/lib/utils";

// Fila de retratos altos que se desliza despacio. La usan el banner del home y las portadas de
// «Soy talento» y «Soy empresa», para que las tres páginas se lean como una sola.
// Se detiene al pasar el mouse o al enfocarla; con movimiento reducido queda quieta y se recorre
// de lado con el dedo. «desde» cambia por cuál retrato empieza, para que cada página abra distinto.
export function FilaRetratos({ desde = 0, className }: { desde?: number; className?: string }) {
  const orden = [...RETRATOS.slice(desde % RETRATOS.length), ...RETRATOS.slice(0, desde % RETRATOS.length)];
  // La pista va dos veces para que el giro no tenga salto; la copia no se anuncia.
  const pista = [...orden, ...orden];

  return (
    <div
      className={cn("banda overflow-x-auto motion-safe:overflow-x-hidden motion-reduce:snap-x motion-reduce:snap-mandatory", className)}
      role="region"
      aria-label="Retratos de oficios y profesiones"
      tabIndex={0}
    >
      <ul className="banda-pista flex w-max gap-4 pr-4 motion-reduce:pl-4 md:gap-6 md:pr-6">
        {pista.map(({ foto }, i) => (
          <li
            key={`${foto}-${i}`}
            aria-hidden={i >= orden.length || undefined}
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
  );
}
