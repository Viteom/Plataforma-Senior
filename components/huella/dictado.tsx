"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Dictado con la Web Speech API del navegador (brief: sin costo en v1). No todos los navegadores
// la tienen (en iPhone depende de la versión); si falta, se avisa y se ofrecen las otras vías.
// Se presenta como un micrófono grande: es la forma principal de contar la historia.

type Reconocimiento = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function crearReconocimiento(): Reconocimiento | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, (new () => Reconocimiento) | undefined>;
  const Clase = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Clase ? new Clase() : null;
}

type Props = { onTexto: (texto: string) => void; onNoSoportado?: () => void };

export function Dictado({ onTexto, onNoSoportado }: Props) {
  const [soportado, setSoportado] = useState<boolean | null>(null);
  const [escuchando, setEscuchando] = useState(false);
  const [aviso, setAviso] = useState("");
  const rec = useRef<Reconocimiento | null>(null);

  useEffect(() => {
    const hay = crearReconocimiento() !== null;
    setSoportado(hay);
    if (!hay) onNoSoportado?.();
    return () => rec.current?.stop();
    // Solo al montar: el aviso de que no hay dictado se da una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function empezar() {
    const r = crearReconocimiento();
    if (!r) return;
    r.lang = "es-CO";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let nuevo = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) nuevo += e.results[i][0].transcript;
      }
      if (nuevo.trim()) onTexto(nuevo.trim());
    };
    r.onerror = (e) => {
      setAviso(
        e.error === "not-allowed"
          ? "El navegador no tiene permiso para usar el micrófono. Puedes darlo en la configuración o escribir tu historia."
          : "No pudimos escucharte bien. Intenta de nuevo o escribe tu historia.",
      );
    };
    r.onend = () => setEscuchando(false);
    rec.current = r;
    setAviso("");
    r.start();
    setEscuchando(true);
  }

  function detener() {
    rec.current?.stop();
    setEscuchando(false);
  }

  if (soportado === false) {
    return (
      <p className="rounded-md bg-raised p-4">
        Este navegador no permite dictar. Puedes escribir tu historia o pedir que te llamemos.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <button
        type="button"
        onClick={escuchando ? detener : empezar}
        disabled={soportado === null}
        aria-pressed={escuchando}
        data-escuchando={escuchando || undefined}
        className="anillos-mic grid size-36 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-100 active:scale-95 disabled:opacity-60"
      >
        {escuchando ? <Square aria-hidden className="size-12 fill-current" /> : <Mic aria-hidden className="size-14" strokeWidth={1.8} />}
        <span className="sr-only">{escuchando ? "Parar" : "Empezar a hablar"}</span>
      </button>
      <p aria-hidden className="mt-3 font-web text-2xl font-semibold tracking-tight">
        {escuchando ? "Te escuchamos… toca para parar" : "Toca y habla"}
      </p>
      <p aria-live="polite" className="max-w-[30ch] text-center text-base text-text-muted">
        {escuchando
          ? "Habla con calma. Lo que digas aparece abajo."
          : aviso || "Como si se lo contaras a un amigo. No importa equivocarte."}
      </p>
    </div>
  );
}
