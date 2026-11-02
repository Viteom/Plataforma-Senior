"use client";

import { Pause, Play } from "lucide-react";

import { useVoz } from "@/lib/voz";
import { AUDIO_COMO_FUNCIONA } from "@/lib/web/home";

// «Escucha cómo funciona»: lo lee la voz del propio celular o computador. Si el navegador no
// tiene voz, el botón no aparece.
export function Escuchar() {
  const { disponible, sonando, alternar } = useVoz();
  if (!disponible) return null;
  const activo = sonando === "como-funciona";

  return (
    <button
      type="button"
      onClick={() => alternar("como-funciona", AUDIO_COMO_FUNCIONA)}
      aria-pressed={activo}
      className="mt-6 inline-flex min-h-action items-center gap-3 rounded-full bg-white/12 py-2 pr-5 pl-2 text-base font-medium text-white backdrop-blur"
    >
      <span className="grid size-10 place-items-center rounded-full bg-white text-primary">
        {activo ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4 fill-current" />}
      </span>
      {activo ? "Detener" : "Escucha cómo funciona · 1 min"}
    </button>
  );
}
