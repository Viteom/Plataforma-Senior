"use client";

import { Check, MessageSquareText } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

// Piezas de la entrada sin contraseña, adaptadas de un componente de 21st.dev (magic-link-otp-login)
// a la marca: tokens de app/globals.css, letra de 18 px o más, casillas de 56 px, español de tú y
// movimiento solo si la persona no pidió reducirlo. El envío y la verificación los hace el servidor
// (app/(publico)/entrar/acciones.ts); aquí solo vive la interfaz.

export type MedioCodigo = "celular" | "correo";

const soloDigitos = (texto: string, largo: number) => texto.replace(/\D/g, "").slice(0, largo);

export function useMovimientoReducido() {
  const [reducido, setReducido] = React.useState(true);
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actualizar = () => setReducido(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);
  return reducido;
}

const SUAVE = "cubic-bezier(.22,1,.36,1)";

// Un sobre (correo) o un celular (SMS) del que sale el mensaje. Decorativo.
export function LlegadaCodigo({ medio }: { medio: MedioCodigo }) {
  const raiz = React.useRef<HTMLDivElement>(null);
  const reducido = useMovimientoReducido();

  React.useLayoutEffect(() => {
    if (reducido) return;
    const mensaje = raiz.current?.querySelector("[data-mensaje]");
    const animacion = mensaje?.animate(
      [
        { opacity: 0, transform: "translateY(16px) scale(.92)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 640, easing: SUAVE, delay: 120, fill: "backwards" },
    );
    return () => animacion?.cancel();
  }, [medio, reducido]);

  return (
    <div ref={raiz} aria-hidden className="relative mx-auto h-24 w-32">
      {medio === "correo" ? (
        <>
          <div className="absolute inset-x-3 bottom-0 h-14 rounded-sm bg-surface-strong" />
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div data-mensaje className="flex size-14 items-start justify-center rounded-sm bg-raised pt-2 shadow-tarjeta">
              <span className="grid size-7 place-items-center rounded-full bg-primary text-on-primary">
                <Check className="size-4" strokeWidth={3} />
              </span>
            </div>
          </div>
          <svg viewBox="0 0 104 56" className="absolute inset-x-3 bottom-0 h-14 text-surface" fill="currentColor">
            <path d="M0 8 52 34 104 8v40a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8Z" />
          </svg>
        </>
      ) : (
        <>
          <div className="absolute bottom-0 left-4 h-24 w-14 rounded-md border-4 border-primary bg-raised" />
          <div className="absolute top-3 right-0 flex">
            <div data-mensaje className="flex items-center gap-1.5 rounded-md rounded-bl-none bg-primary px-3 py-2 text-on-primary">
              <MessageSquareText className="size-5" />
              <span className="flex gap-1">
                <i className="size-1.5 rounded-full bg-on-primary" />
                <i className="size-1.5 rounded-full bg-on-primary" />
                <i className="size-1.5 rounded-full bg-on-primary" />
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type CasillasProps = {
  valor: string;
  onCambio: (codigo: string) => void;
  /** Se llama una vez cuando las casillas quedan completas con un código nuevo. */
  onCompleto?: (codigo: string) => void;
  largo?: number;
  name?: string;
  deshabilitado?: boolean;
  invalido?: boolean;
  etiquetaId: string;
  describedBy?: string;
};

// Seis casillas de 56 px. Pegar o el autocompletado del celular llenan todas desde cualquiera;
// el código también viaja en un campo oculto para que el formulario funcione como siempre.
export const CasillasCodigo = React.forwardRef<HTMLInputElement, CasillasProps>(function CasillasCodigo(
  { valor, onCambio, onCompleto, largo = 6, name = "codigo", deshabilitado, invalido, etiquetaId, describedBy },
  primeraRef,
) {
  const casillas = React.useRef<(HTMLInputElement | null)[]>([]);
  const grupo = React.useRef<HTMLDivElement>(null);
  const reducido = useMovimientoReducido();
  const codigo = soloDigitos(valor, largo);

  // Un error sacude las casillas, salvo con movimiento reducido. El mensaje lo dice con palabras.
  React.useLayoutEffect(() => {
    if (!invalido || reducido) return;
    const animacion = grupo.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 380, easing: "ease-in-out" },
    );
    return () => animacion?.cancel();
  }, [invalido, reducido]);

  const cambiar = (siguiente: string) => {
    const limpio = soloDigitos(siguiente, largo);
    onCambio(limpio);
    if (limpio.length === largo && limpio !== codigo) onCompleto?.(limpio);
  };

  const poner = (texto: string, indice: number) => {
    const limpio = soloDigitos(texto, largo);
    if (!limpio) return;
    const inicio = limpio.length === largo ? 0 : Math.min(indice, codigo.length);
    const siguiente = (codigo.slice(0, inicio) + limpio + codigo.slice(inicio + limpio.length)).slice(0, largo);
    cambiar(siguiente);
    casillas.current[Math.min(inicio + limpio.length, largo - 1)]?.focus();
  };

  const tecla = (evento: React.KeyboardEvent<HTMLInputElement>, indice: number) => {
    if (evento.key === "Backspace") {
      evento.preventDefault();
      const objetivo = codigo[indice] ? indice : Math.max(0, indice - 1);
      cambiar(codigo.slice(0, objetivo) + codigo.slice(objetivo + 1));
      casillas.current[Math.max(0, indice - 1)]?.focus();
    } else if (evento.key === "ArrowLeft" || evento.key === "ArrowRight") {
      evento.preventDefault();
      const paso = evento.key === "ArrowLeft" ? -1 : 1;
      casillas.current[Math.max(0, Math.min(largo - 1, indice + paso))]?.focus();
    }
  };

  return (
    <>
      <input type="hidden" name={name} value={codigo} />
      <div
        ref={grupo}
        role="group"
        aria-labelledby={etiquetaId}
        aria-describedby={describedBy}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${largo}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: largo }, (_, i) => (
          <input
            key={i}
            ref={(nodo) => {
              casillas.current[i] = nodo;
              if (i === 0) {
                if (typeof primeraRef === "function") primeraRef(nodo);
                else if (primeraRef) primeraRef.current = nodo;
              }
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Número ${i + 1} de ${largo}`}
            aria-invalid={invalido || undefined}
            value={codigo[i] ?? ""}
            disabled={deshabilitado}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => tecla(e, i)}
            onChange={(e) => {
              if (!e.target.value) cambiar(codigo.slice(0, i) + codigo.slice(i + 1));
              else poner(e.target.value, i);
            }}
            onPaste={(e) => {
              e.preventDefault();
              poner(e.clipboardData.getData("text"), i);
            }}
            className={cn(
              "h-action min-w-0 rounded-sm border-2 bg-bg text-center text-2xl font-bold text-text tabular-nums transition-colors duration-150 focus-visible:border-text disabled:opacity-60",
              invalido ? "border-danger" : codigo[i] ? "border-text" : "border-border",
            )}
          />
        ))}
      </div>
    </>
  );
});

// Dónde va la persona: dos pasos, con número y palabra (no solo color).
export function PasosEntrada({ paso, medio }: { paso: 1 | 2; medio: MedioCodigo }) {
  const pasos = [medio === "celular" ? "Tu celular" : "Tu correo", "El código"];
  return (
    <ol aria-label="Pasos para entrar" className="flex items-center gap-5 text-base">
      {pasos.map((nombre, i) => {
        const numero = i + 1;
        const hecho = numero < paso;
        const actual = numero === paso;
        return (
          <li
            key={nombre}
            aria-current={actual ? "step" : undefined}
            className={cn("flex items-center gap-2", actual ? "font-bold text-text" : "text-text-muted")}
          >
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full text-sm font-bold",
                actual ? "bg-primary text-on-primary" : hecho ? "bg-surface-strong text-text" : "bg-surface text-text-muted",
              )}
            >
              {hecho ? <Check aria-hidden className="size-4" strokeWidth={3} /> : numero}
            </span>
            {nombre}
            {hecho && <span className="sr-only">(listo)</span>}
          </li>
        );
      })}
    </ol>
  );
}
