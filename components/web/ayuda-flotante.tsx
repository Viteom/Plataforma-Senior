"use client";

import { CircleHelp, MessageCircle, Phone, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_EQUIPO ?? "").replace(/\D/g, "");

// La salida humana de la web (regla 6): un botón con texto visible, siempre a la mano, que abre
// opciones claras. En celular el panel sale desde abajo y el pie deja espacio para no taparlo.
export function AyudaFlotante() {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierta]);

  const opciones = [
    { href: "/ayuda#llameme", Icono: Phone, titulo: "Te llamamos", texto: "Deja tu celular y una persona te llama" },
    ...(WHATSAPP
      ? [{ href: `https://wa.me/${WHATSAPP}`, Icono: MessageCircle, titulo: "Escríbenos por WhatsApp", texto: "Te respondemos en horario de oficina" }]
      : []),
    { href: "/ayuda", Icono: CircleHelp, titulo: "Ver respuestas", texto: "Las preguntas más frecuentes" },
  ];

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col items-end gap-3 font-web sm:right-5 sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
      {abierta && (
        <div
          id="panel-ayuda"
          role="dialog"
          aria-labelledby="titulo-ayuda"
          className="w-[min(22.5rem,calc(100vw-2rem))] rounded-lg bg-raised p-5 text-tinta shadow-float max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] max-sm:w-auto"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="titulo-ayuda" className="text-xl font-semibold tracking-tight">
                ¿En qué te ayudamos?
              </h2>
              <p className="text-base text-text-muted">Una persona del equipo te responde.</p>
            </div>
            <button
              type="button"
              onClick={() => setAbierta(false)}
              aria-label="Cerrar la ayuda"
              className="-mt-2 -mr-2 grid size-tap shrink-0 place-items-center rounded-full hover:bg-neutro"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>
          <ul className="mt-4 grid gap-2">
            {opciones.map(({ href, Icono, titulo, texto }) => (
              <li key={titulo}>
                <Link
                  href={href}
                  onClick={() => setAbierta(false)}
                  className="flex min-h-16 items-center gap-3 rounded-md bg-neutro px-3 py-2 transition-colors hover:bg-neutro-2"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-raised">
                    <Icono aria-hidden className="size-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-base font-semibold">{titulo}</span>
                    <span className="text-sm text-text-muted">{texto}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        aria-controls="panel-ayuda"
        className="inline-flex min-h-action items-center gap-2.5 rounded-full bg-primary py-2 pr-5 pl-2.5 text-base font-semibold text-on-primary shadow-float transition-transform active:scale-[0.97] sm:text-lg"
      >
        <span className="grid size-8 place-items-center rounded-full bg-accent text-on-accent">
          <CircleHelp aria-hidden className="size-5" />
        </span>
        ¿Necesitas ayuda?
      </button>
    </div>
  );
}
