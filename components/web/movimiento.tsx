"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Entrada de las partes de cada sección al aparecer en pantalla. Lo que ya está a la vista al
// cargar no se esconde, y sin script (o con movimiento reducido) todo se ve desde el principio.
// Al hacer scroll se muestra todo lo que ya llegó a la pantalla o quedó atrás, aunque la página
// haya saltado de golpe (un enlace a una sección, «Volver arriba») y no se haya cruzado nunca.
export function MovimientoWeb() {
  const ruta = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let pendientes = Array.from(document.querySelectorAll<HTMLElement>("[data-aparecer]:not([data-visto])"));

    const revisar = () => {
      const limite = window.innerHeight * 0.92;
      pendientes = pendientes.filter((el) => {
        if (el.getBoundingClientRect().top >= limite) return true;
        el.dataset.visto = "";
        return false;
      });
      if (pendientes.length === 0) window.removeEventListener("scroll", alMover);
    };

    let cuadro = 0;
    const alMover = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(revisar);
    };

    revisar();
    document.documentElement.classList.add("movimiento");
    window.addEventListener("scroll", alMover, { passive: true });
    window.addEventListener("resize", alMover);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", alMover);
      window.removeEventListener("resize", alMover);
    };
  }, [ruta]);

  return null;
}
