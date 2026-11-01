"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import { AUDIO_COMO_FUNCIONA } from "@/lib/web/home";

// «Escucha cómo funciona»: lo lee la voz del propio celular o computador (sin servicios externos
// ni costo). Si el navegador no tiene voz, el botón no aparece.
export function Escuchar() {
  const [disponible, setDisponible] = useState(false);
  const [sonando, setSonando] = useState(false);

  useEffect(() => {
    setDisponible(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!disponible) return null;

  function alternar() {
    const voz = window.speechSynthesis;
    if (sonando) {
      voz.cancel();
      setSonando(false);
      return;
    }
    const frase = new SpeechSynthesisUtterance(AUDIO_COMO_FUNCIONA);
    frase.lang = "es-CO";
    frase.rate = 0.92;
    const espanol = voz.getVoices().find((v) => v.lang.startsWith("es"));
    if (espanol) frase.voice = espanol;
    frase.onend = () => setSonando(false);
    frase.onerror = () => setSonando(false);
    voz.cancel();
    voz.speak(frase);
    setSonando(true);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={sonando}
      className="mt-6 inline-flex min-h-action items-center gap-3 rounded-full bg-white/12 py-2 pr-5 pl-2 text-base font-medium text-white backdrop-blur"
    >
      <span className="grid size-10 place-items-center rounded-full bg-white text-primary">
        {sonando ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4 fill-current" />}
      </span>
      {sonando ? "Detener" : "Escucha cómo funciona · 1 min"}
    </button>
  );
}
