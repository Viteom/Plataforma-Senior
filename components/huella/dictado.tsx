"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

// Dictado con la Web Speech API del navegador (brief: sin costo en v1). No todos los navegadores
// la tienen (en iPhone depende de la versión); si falta, se ofrecen las otras vías.

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

type Props = { onTexto: (texto: string) => void };

export function Dictado({ onTexto }: Props) {
  const [soportado, setSoportado] = useState<boolean | null>(null);
  const [escuchando, setEscuchando] = useState(false);
  const [aviso, setAviso] = useState("");
  const rec = useRef<Reconocimiento | null>(null);

  useEffect(() => {
    setSoportado(crearReconocimiento() !== null);
    return () => rec.current?.stop();
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
          ? "El navegador no tiene permiso para usar el micrófono. Puede darlo en la configuración o escribir su historia."
          : "No pudimos escucharle bien. Intente de nuevo o escriba su historia.",
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
      <p className="rounded-md bg-surface p-4">
        Este navegador no permite dictar. Puede escribir su historia o pedir que le llamemos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {escuchando ? (
        <Button type="button" variant="secundario" ancho="completo" onClick={detener}>
          <Square aria-hidden />
          Detener
        </Button>
      ) : (
        <Button type="button" variant="secundario" ancho="completo" onClick={empezar} disabled={soportado === null}>
          <Mic aria-hidden />
          Empezar a hablar
        </Button>
      )}
      <p aria-live="polite" className="text-base text-text-muted">
        {escuchando ? "Le estamos escuchando. Hable con calma; lo que diga aparece abajo." : aviso}
      </p>
    </div>
  );
}
