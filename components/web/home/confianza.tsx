"use client";

import { BadgeCheck, EyeOff, Landmark, LockKeyhole, PhoneCall, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";

import { GARANTIAS } from "@/lib/web/home";

const ICONOS = [Landmark, BadgeCheck, EyeOff, WalletCards, LockKeyhole, PhoneCall];

// Confianza: una pila de garantías que rota sola (o al tocarla) y explica cada una al lado.
// Con movimiento reducido no rota; se elige tocando.
export function Confianza() {
  const [actual, setActual] = useState(0);
  const n = GARANTIAS.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActual((a) => (a + 1) % n), 2800);
    return () => window.clearInterval(id);
  }, [n]);

  return (
    <section aria-labelledby="titulo-confianza" className="bg-neutro-2 py-20 font-web text-tinta lg:py-32">
      <div className="mx-auto grid max-w-web items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <span className="inline-flex rounded-full bg-raised px-3.5 py-1.5 text-sm font-medium">Confianza</span>
          <h2 id="titulo-confianza" className="mt-5 text-seccion font-medium tracking-[-0.035em]">
            Confianza para <span className="block text-tinta-suave">los dos lados.</span>
          </h2>
          <p aria-live="polite" className="mt-6 min-h-[4.8em] max-w-[40ch] text-lg sm:text-xl">
            {GARANTIAS[actual].texto}
          </p>
        </div>
        <ul className="relative h-[400px] lg:h-[470px]">
          {GARANTIAS.map((g, i) => {
            let k = i - actual;
            if (k > n / 2) k -= n;
            if (k < -n / 2) k += n;
            const Icono = ICONOS[i];
            const activa = k === 0;
            return (
              <li
                key={g.titulo}
                className="absolute left-1/2 w-[min(28rem,92%)] -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ top: `calc(50% + ${k * 74}px - 34px)`, opacity: Math.max(0, 1 - Math.abs(k) * 0.32), zIndex: 10 - Math.abs(k) }}
              >
                <button
                  type="button"
                  onClick={() => setActual(i)}
                  aria-current={activa}
                  className={`flex w-full items-center gap-4 rounded-md px-6 py-4 text-left font-medium transition-all duration-500 ${activa ? "bg-raised text-2xl shadow-panel" : "bg-raised/55 text-xl"}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-neutro">
                    <Icono aria-hidden className="size-5" />
                  </span>
                  {g.titulo}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
