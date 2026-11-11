import Image from "next/image";

import { MODO_DEMO } from "@/lib/demo";
import { ORGANIZACIONES, ORGANIZACIONES_EJEMPLO } from "@/lib/web/home";

// Franja de organizaciones: una tira clara con sus nombres o logos. Sale solo cuando hay
// organizaciones reales con permiso; en la demostración usa nombres de ejemplo.
//   «banner»: pegada al pie del banner (tablet y computador).
//   «debajo»: en celular va después del banner, para no tapar los botones.
export function FranjaOrganizaciones({ variante }: { variante: "banner" | "debajo" }) {
  const ejemplo = ORGANIZACIONES.length === 0 && MODO_DEMO;
  const lista = ejemplo ? ORGANIZACIONES_EJEMPLO : ORGANIZACIONES;
  if (!lista.length) return null;

  // Cada nombre alterna de letra para que la tira se lea como una fila de marcas distintas.
  const letras = ["font-display font-extrabold tracking-tight", "font-editorial text-[1.35em]", "font-web font-semibold tracking-tight"];

  return (
    <div
      className={
        variante === "banner"
          ? "absolute inset-x-6 bottom-0 z-10 rounded-t-lg bg-bg px-6 pt-4 pb-5 font-web text-tinta max-md:hidden lg:inset-x-10"
          : "bg-bg px-5 py-6 font-web text-tinta md:hidden"
      }
    >
      <p className="text-center text-base text-text-muted">
        {ejemplo ? "Así se verían las organizaciones (nombres de ejemplo)" : "Organizaciones que ya trabajan con talento de Kánna"}
      </p>
      <ul className="mt-3 flex items-center justify-between gap-x-8 gap-y-3 max-md:flex-wrap max-md:justify-center md:overflow-hidden">
        {lista.map((o, i) => (
          <li key={o.nombre} className={`shrink-0 text-lg whitespace-nowrap ${i >= 4 ? "md:max-xl:hidden" : ""}`}>
            {o.logo ? (
              <Image src={`/web/organizaciones/${o.logo}`} alt={o.nombre} width={140} height={36} unoptimized className="h-9 w-auto" />
            ) : (
              <span className={letras[i % letras.length]}>{o.nombre}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
