"use client";

import { useCallback, useEffect, useState } from "react";

// Lectura en voz alta con la voz del propio celular o computador (sin servicios externos ni costo).
// Cada botón tiene un id: tocar el que suena lo detiene; tocar otro cambia de audio.
export function useVoz() {
  const [disponible, setDisponible] = useState(false);
  const [sonando, setSonando] = useState<string | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const voz = window.speechSynthesis;
    const actualizar = () => setDisponible(voz.getVoices().some((v) => v.localService && v.lang.startsWith("es")));
    const detener = () => { voz.cancel(); setSonando(null); };
    const visibilidad = () => { if (document.hidden) detener(); };
    actualizar();
    voz.addEventListener("voiceschanged", actualizar);
    document.addEventListener("visibilitychange", visibilidad);
    window.addEventListener("pagehide", detener);
    return () => {
      voz.cancel();
      voz.removeEventListener("voiceschanged", actualizar);
      document.removeEventListener("visibilitychange", visibilidad);
      window.removeEventListener("pagehide", detener);
    };
  }, []);

  const alternar = useCallback(
    (id: string, texto: string) => {
      const voz = window.speechSynthesis;
      voz.cancel();
      if (sonando === id) {
        setSonando(null);
        return;
      }
      // No usar una voz remota ni permitir que el navegador escoja su voz predeterminada:
      // el texto puede contener datos personales. Sin voz local, queda disponible por escrito.
      const espanol = voz.getVoices().find((v) => v.localService && v.lang.startsWith("es"));
      if (!espanol) { setDisponible(false); setSonando(null); return; }
      const frase = new SpeechSynthesisUtterance(texto);
      frase.lang = "es-CO";
      frase.rate = 0.92;
      frase.voice = espanol;
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
  const excluir = "[data-no-leer], [hidden], [inert], [aria-hidden='true'], .sr-only, script, style, template, noscript, input, textarea, select, option, [contenteditable], iframe, audio, video";
  const oculta = (e: Element) => {
    const estilo = window.getComputedStyle(e);
    return e.matches(excluir) || estilo.display === "none" || ["hidden", "collapse"].includes(estilo.visibility)
      || estilo.contentVisibility === "hidden" || estilo.opacity === "0";
  };
  // Se consulta el DOM real: al clonar se pierden los estilos efectivos y se termina leyendo
  // contenido que la persona no ve, incluidos paneles cerrados y valores de formularios.
  for (let e: Element | null = zona; e; e = e.parentElement) if (oculta(e)) return "";
  const leer = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? "";
    if (!(n instanceof Element) || oculta(n)) return "";
    if (n.tagName === "DETAILS" && !n.hasAttribute("open")) {
      const resumen = n.querySelector(":scope > summary");
      return resumen ? leer(resumen) : "";
    }
    const texto = Array.from(n.childNodes, leer).join("");
    return texto + (n.matches("p,h1,h2,h3,h4,li,a,button,label,summary,br") ? ". " : "");
  };
  return leer(zona).replace(/\s+/g, " ").replace(/(\.\s*){2,}/g, ". ").trim();
}
