"use client";

import { Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

// Graba audio con el micrófono (MediaRecorder). Funciona sin señal: el audio queda en el celular.
type Props = { audio: Blob | null; onAudio: (a: Blob | null) => void; texto: string };

export function Grabadora({ audio, onAudio, texto }: Props) {
  const [grabando, setGrabando] = useState(false);
  const [aviso, setAviso] = useState("");
  const grabador = useRef<MediaRecorder | null>(null);
  const url = useMemo(() => (audio ? URL.createObjectURL(audio) : null), [audio]);

  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);

  async function empezar() {
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const partes: Blob[] = [];
      const r = new MediaRecorder(flujo);
      r.ondataavailable = (e) => partes.push(e.data);
      r.onstop = () => {
        flujo.getTracks().forEach((t) => t.stop());
        onAudio(new Blob(partes, { type: r.mimeType || "audio/webm" }));
        setGrabando(false);
      };
      grabador.current = r;
      r.start();
      setAviso("");
      setGrabando(true);
    } catch {
      setAviso("No pudimos usar el micrófono. Revisa el permiso del navegador o escribe la historia.");
    }
  }

  if (audio && url) {
    return (
      <div className="flex flex-col gap-3">
        <audio controls src={url} className="w-full" />
        <Button type="button" variant="secundario" size="normal" className="self-start" onClick={() => onAudio(null)}>
          <RotateCcw aria-hidden />
          Grabar de nuevo
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {grabando ? (
        <Button type="button" variant="secundario" ancho="completo" onClick={() => grabador.current?.stop()}>
          <Square aria-hidden />
          Detener
        </Button>
      ) : (
        <Button type="button" variant="secundario" ancho="completo" onClick={empezar}>
          <Mic aria-hidden />
          {texto}
        </Button>
      )}
      <p aria-live="polite" className="text-base text-text-muted">
        {grabando ? "Grabando…" : aviso}
      </p>
    </div>
  );
}
