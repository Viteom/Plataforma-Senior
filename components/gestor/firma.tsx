"use client";

import { Eraser } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

// Firma con el dedo en la pantalla. Devuelve una imagen PNG.
export function Firma({ onFirma }: { onFirma: (png: Blob | null) => void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [vacia, setVacia] = useState(true);

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    // Resolución real del dispositivo para que el trazo no se vea borroso.
    const escala = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * escala;
    c.height = c.offsetHeight * escala;
    const ctx = c.getContext("2d")!;
    ctx.scale(escala, escala);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#141414";
  }, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dibujando.current = true;
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(...punto(e));
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    ctx.lineTo(...punto(e));
    ctx.stroke();
    setVacia(false);
  }

  function terminar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    dibujando.current = false;
    e.currentTarget.toBlob((b) => onFirma(b), "image/png");
  }

  function limpiar() {
    const c = lienzo.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setVacia(true);
    onFirma(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={lienzo}
        role="img"
        aria-label={vacia ? "Espacio para firmar con el dedo" : "Firma hecha"}
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        className="h-44 w-full touch-none rounded-md border-2 border-border bg-bg"
      />
      <Button type="button" variant="enlace" size="normal" className="self-start" onClick={limpiar} disabled={vacia}>
        <Eraser aria-hidden />
        Borrar firma
      </Button>
    </div>
  );
}
