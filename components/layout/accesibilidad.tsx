"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Ajustes de lectura, en todas las pantallas: agrandar la letra (lupa), alto contraste y
// subrayar los enlaces. El botón muestra «Aa», lo que hace, y no una figura de persona: los
// pictogramas de discapacidad o de bastón reducen a la gente a un estereotipo. Lo que la persona elige queda guardado en su celular o computador.
// Los cambios viven en atributos de <html>; los estilos están en app/globals.css.

type Ajustes = { letra: "normal" | "grande" | "muy-grande"; contraste: boolean; enlaces: boolean };
const POR_DEFECTO: Ajustes = { letra: "normal", contraste: false, enlaces: false };
export const CLAVE_ACCESIBILIDAD = "kanna-accesibilidad";

const LETRAS: { valor: Ajustes["letra"]; etiqueta: string; muestra: string }[] = [
  { valor: "normal", etiqueta: "Normal", muestra: "text-base" },
  { valor: "grande", etiqueta: "Grande", muestra: "text-lg" },
  { valor: "muy-grande", etiqueta: "Muy grande", muestra: "text-xl" },
];

function aplicar(a: Ajustes) {
  const raiz = document.documentElement;
  if (a.letra === "normal") delete raiz.dataset.letra;
  else raiz.dataset.letra = a.letra;
  if (a.contraste) raiz.dataset.contraste = "alto";
  else delete raiz.dataset.contraste;
  if (a.enlaces) raiz.dataset.enlaces = "subrayados";
  else delete raiz.dataset.enlaces;
}

function leer(): Ajustes {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_ACCESIBILIDAD) ?? "{}") as Partial<Ajustes>;
    return {
      letra: LETRAS.some((l) => l.valor === crudo.letra) ? crudo.letra! : "normal",
      contraste: crudo.contraste === true,
      enlaces: crudo.enlaces === true,
    };
  } catch {
    return POR_DEFECTO;
  }
}

export function Accesibilidad() {
  const [abierto, setAbierto] = useState(false);
  const [ajustes, setAjustes] = useState<Ajustes>(POR_DEFECTO);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const guardados = leer();
    setAjustes(guardados);
    aplicar(guardados);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  function cambiar(nuevo: Ajustes) {
    setAjustes(nuevo);
    aplicar(nuevo);
    try {
      localStorage.setItem(CLAVE_ACCESIBILIDAD, JSON.stringify(nuevo));
    } catch {
      // Sin almacenamiento (ventana privada): el cambio vale mientras dure la visita.
    }
  }

  const cambiado = ajustes.letra !== "normal" || ajustes.contraste || ajustes.enlaces;

  return (
    <div data-no-leer className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-3 z-40 print:hidden">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls="panel-accesibilidad"
        onClick={() => setAbierto((v) => !v)}
        className="grid size-tap place-items-center rounded-full border-2 border-on-primary bg-primary text-on-primary shadow-float transition-transform duration-100 active:scale-[0.97]"
      >
        <span aria-hidden className="font-sans text-lg leading-none font-bold">
          Aa
        </span>
        <span className="sr-only">Ajustar la letra y el contraste</span>
      </button>

      {abierto && (
        <div
          id="panel-accesibilidad"
          role="dialog"
          aria-labelledby="titulo-accesibilidad"
          className="absolute bottom-14 left-0 flex max-h-[calc(100dvh-11rem)] w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-4 overflow-y-auto rounded-lg border-2 border-text bg-raised p-4 font-sans text-text shadow-float"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="titulo-accesibilidad" className="text-lg font-bold">
              Letra y contraste
            </h2>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar los ajustes de letra"
              className="grid size-tap shrink-0 place-items-center rounded-full hover:bg-surface"
            >
              <X aria-hidden className="size-6" />
            </button>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-base font-bold">Tamaño de la letra</legend>
            {LETRAS.map((l) => {
              const activa = ajustes.letra === l.valor;
              return (
                <label
                  key={l.valor}
                  className={cn(
                    "flex min-h-tap cursor-pointer items-center gap-3 rounded-md border-2 px-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus",
                    activa ? "border-text bg-surface-strong font-bold" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name="letra"
                    className="sr-only"
                    checked={activa}
                    onChange={() => cambiar({ ...ajustes, letra: l.valor })}
                  />
                  <span aria-hidden className={cn("w-8 text-center font-bold", l.muestra)}>
                    A
                  </span>
                  <span className="flex-1 text-base">{l.etiqueta}</span>
                  {activa && <Check aria-hidden className="size-5 shrink-0" />}
                </label>
              );
            })}
          </fieldset>

          <Interruptor
            texto="Alto contraste"
            activo={ajustes.contraste}
            onCambiar={() => cambiar({ ...ajustes, contraste: !ajustes.contraste })}
          />
          <Interruptor
            texto="Subrayar los enlaces"
            activo={ajustes.enlaces}
            onCambiar={() => cambiar({ ...ajustes, enlaces: !ajustes.enlaces })}
          />

          {cambiado && (
            <button
              type="button"
              onClick={() => cambiar(POR_DEFECTO)}
              className="min-h-tap self-start text-base font-bold underline underline-offset-4"
            >
              Volver a como estaba
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Interruptor({ texto, activo, onCambiar }: { texto: string; activo: boolean; onCambiar: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={onCambiar}
      className={cn(
        "flex min-h-tap items-center justify-between gap-3 rounded-md border-2 px-3 text-left text-base",
        activo ? "border-text bg-surface-strong font-bold" : "border-border",
      )}
    >
      {texto}
      <span className="shrink-0 text-base">{activo ? "Activado" : "Apagado"}</span>
    </button>
  );
}
