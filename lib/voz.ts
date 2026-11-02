"use client";

import { useCallback, useEffect, useState } from "react";

// Lectura en voz alta con la voz del propio celular o computador (sin servicios externos ni costo).
// Cada botón tiene un id: tocar el que suena lo detiene; tocar otro cambia de audio.
export function useVoz() {
  const [disponible, setDisponible] = useState(false);
  const [sonando, setSonando] = useState<string | null>(null);

  useEffect(() => {
    setDisponible(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const alternar = useCallback(
    (id: string, texto: string) => {
      const voz = window.speechSynthesis;
      voz.cancel();
      if (sonando === id) {
        setSonando(null);
        return;
      }
      const frase = new SpeechSynthesisUtterance(texto);
      frase.lang = "es-CO";
      frase.rate = 0.92;
      const espanol = voz.getVoices().find((v) => v.lang.startsWith("es"));
      if (espanol) frase.voice = espanol;
      // Al cancelar también llega onerror: solo se limpia si este audio sigue siendo el actual.
      const terminar = () => setSonando((s) => (s === id ? null : s));
      frase.onend = terminar;
      frase.onerror = terminar;
      voz.speak(frase);
      setSonando(id);
    },
    [sonando],
  );

  return { disponible, sonando, alternar };
}

// Texto visible de una zona de la pantalla, sin lo marcado con data-no-leer (botones de voz, ayuda).
export function textoDe(zona: HTMLElement | null) {
  if (!zona) return "";
  const copia = zona.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("[data-no-leer], [aria-hidden='true'], .sr-only, script, style").forEach((e) => e.remove());
  copia.querySelectorAll("p, h1, h2, h3, li, a, button, label, summary").forEach((e) => e.append(". "));
  return (copia.textContent ?? "").replace(/\s+/g, " ").replace(/(\.\s*){2,}/g, ". ").trim();
}
