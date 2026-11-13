"use client";

import { CircleHelp, MessageCircle, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_EQUIPO ?? "").replace(/\D/g, "");

// El chat se carga solo cuando alguien abre la ayuda: no pesa en las páginas que no lo usan.
const ChatAyuda = dynamic(() => import("@/app/ayuda/chat").then((m) => m.ChatAyuda), {
  loading: () => <p role="status">Abriendo la ayuda…</p>,
});

// La salida humana de la web (regla 6): un botón con texto visible, siempre a la mano, que abre el
// chat de ayuda. El chat guía con botones, deja escribir o hablar, y pasa a una persona cuando hace
// falta. En celular el panel sale desde abajo y el pie deja espacio para no taparlo.
export function AyudaFlotante() {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierta(false);
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierta]);

  return (
    <div className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col items-end gap-3 font-web sm:right-5 sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
      {abierta && (
        <div
          id="panel-ayuda"
          role="dialog"
          aria-labelledby="titulo-ayuda"
          className="flex max-h-[calc(100dvh-7.5rem)] w-[min(26rem,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-lg bg-raised p-5 font-sans text-tinta shadow-float max-sm:fixed max-sm:inset-x-3 max-sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] max-sm:w-auto"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id="titulo-ayuda" className="font-web text-xl font-semibold tracking-tight">
              ¿En qué te ayudamos?
            </h2>
            <button
              type="button"
              onClick={() => setAbierta(false)}
              aria-label="Cerrar la ayuda"
              className="-mt-2 -mr-2 grid size-tap shrink-0 place-items-center rounded-full hover:bg-neutro"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>

          <ChatAyuda />

          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border-subtle pt-3 text-base">
            {WHATSAPP && (
              <a
                href={`https://wa.me/${WHATSAPP}`}
                className="inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4"
              >
                <MessageCircle aria-hidden className="size-5" />
                Escribir por WhatsApp
              </a>
            )}
            <Link
              href="/ayuda"
              onClick={() => setAbierta(false)}
              className="inline-flex min-h-tap items-center font-bold underline underline-offset-4"
            >
              Abrir la página de ayuda
            </Link>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        aria-controls="panel-ayuda"
        className="inline-flex min-h-action items-center gap-2.5 rounded-full bg-primary py-2 pr-4 pl-2.5 sm:pr-5 text-base font-semibold text-on-primary shadow-float transition-transform active:scale-[0.97] sm:text-lg"
      >
        <span className="grid size-8 place-items-center rounded-full bg-accent text-on-accent">
          <CircleHelp aria-hidden className="size-5" />
        </span>
        {/* En celular, corto (como el botón de la app) para tapar menos lo que se está leyendo. */}
        <span className="sm:hidden">Ayuda</span>
        <span className="max-sm:hidden">¿Necesitas ayuda?</span>
      </button>
    </div>
  );
}
