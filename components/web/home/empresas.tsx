import { ArrowRight, UserRound } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/marca/logo";
import { MANERAS, PERFILES_RETO } from "@/lib/web/home";

// Para empresas: el momento oscuro de la página. El panel muestra cómo llega la propuesta: cada
// perfil con una capacidad y el porqué encaja con el reto, sin nombre ni foto ni cargo anterior.
export function Empresas() {
  return (
    <section id="empresas" aria-labelledby="titulo-empresas" className="scroll-mt-20 overflow-hidden bg-deep py-20 font-web text-white lg:py-32">
      <div className="mx-auto grid max-w-web items-center gap-14 px-4 md:px-8 xl:grid-cols-[1fr_1.05fr]">
        <div>
          <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium">Para empresas</span>
          <h2 id="titulo-empresas" className="mt-5 text-seccion font-medium tracking-[-0.035em] text-balance">
            Experiencia que <span className="block text-noche-suave">abre posibilidades.</span>
          </h2>
          <p className="mt-7 max-w-[44ch] text-lg text-azul-claro sm:text-xl">
            Cada trayectoria reúne saberes y formas de hacer que pueden aportar de distintas maneras:
          </p>
          <ul className="mt-4 flex max-w-[32rem] flex-wrap gap-2">
            {MANERAS.map((m, i) => (
              <li
                key={m}
                className={`rounded-full px-4 py-2 text-base font-medium ${i === 0 ? "bg-accent text-on-accent" : "ring-1 ring-white/25 ring-inset"}`}
              >
                {m}
              </li>
            ))}
          </ul>
          <p className="mt-7 max-w-[44ch] text-lg text-azul-claro sm:text-xl">
            Cuéntanos qué necesitas impulsar. En Kánna te ayudamos a explorar qué experiencia y capacidades podrían aportar.
          </p>
          <Link
            href="/entrar?para=empresa"
            className="mt-9 inline-flex min-h-action items-center gap-2 rounded-full bg-accent px-7 text-lg font-semibold text-on-accent transition-colors hover:bg-accent-hover active:scale-[0.97]"
          >
            Conversemos sobre lo que necesitas
            <ArrowRight aria-hidden className="size-5" />
          </Link>
        </div>

        <div aria-hidden className="max-w-[40rem] -rotate-[1.5deg] rounded-lg bg-neutro p-5 text-tinta shadow-panel">
          <div className="flex items-center justify-between pb-3.5">
            <Logo alto={22} />
            <span className="rounded-full bg-primary px-2.5 py-1 text-sm font-semibold text-on-primary">Alimentos del Oriente</span>
          </div>
          <div className="grid gap-2.5">
            {[
              { reto: "Ordenar el inventario de la bodega", nota: "3 personas interesadas", estado: "✓ Recibiendo interés", verde: true },
              { reto: "Mentoría en costos para compras", nota: "Kánna está eligiendo perfiles", estado: "En revisión", verde: false },
            ].map((r) => (
              <div key={r.reto} className="flex items-center justify-between gap-3 rounded-md bg-raised px-4 py-3.5">
                <span>
                  <b className="block text-base font-semibold">{r.reto}</b>
                  <span className="text-sm text-text-muted">{r.nota}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap ${r.verde ? "bg-exito-fondo text-exito-texto" : "bg-accent text-on-accent"}`}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3.5 px-0.5 text-sm font-semibold text-text-muted">Por qué cada perfil puede aportar a tu reto</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {PERFILES_RETO.map((p, i) => (
              <div key={p.capacidad} className={`rounded-md bg-raised p-3.5 ${i === 2 ? "max-sm:hidden" : ""}`}>
                <span className="mb-2.5 grid size-10 place-items-center rounded-full bg-neutro text-tinta-suave">
                  <UserRound className="size-5" />
                </span>
                <b className="block text-base leading-tight font-semibold">{p.capacidad}</b>
                <span className="mt-1.5 block border-l-2 border-accent pl-2 text-sm leading-snug text-text-muted">{p.porque}</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.etiquetas.map((e) => (
                    <span key={e} className="rounded-full bg-neutro px-2 py-0.5 text-sm">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
