"use client";

import { Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MAX_CARACTERES, MAX_TURNOS, responder, type Enlace } from "@/lib/ayuda/respuestas";
import { cn } from "@/lib/utils";

import { escalarChat } from "./acciones";

type Turno = { de: "persona" | "asistente"; texto: string; enlace?: Enlace; aPersona?: boolean };

// Chat sin IA: respuestas preparadas por el equipo. Un tema de riesgo no recibe respuesta
// automática: pasa a una persona. Siempre hay un botón para hablar con alguien.
export function ChatAyuda() {
  const [turnos, setTurnos] = useState<Turno[]>([
    { de: "asistente", texto: "Hola. ¿En qué le ayudamos? Escriba su pregunta con sus palabras." },
  ]);
  const [mensaje, setMensaje] = useState("");
  const [fallas, setFallas] = useState(0);
  const final = useRef<HTMLLIElement>(null);

  useEffect(() => {
    final.current?.scrollIntoView({ block: "nearest" });
  }, [turnos]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = mensaje.trim().slice(0, MAX_CARACTERES);
    if (!texto) return;
    setMensaje("");
    const r = responder(texto);
    let respuesta: Turno;
    if (r.tipo === "riesgo") {
      const { creada } = await escalarChat(r.categoria, texto);
      respuesta = {
        de: "asistente",
        texto: creada ? `${r.texto} Ya le avisamos al equipo.` : `${r.texto} Déjenos su celular en «Llámeme» y le llamamos.`,
        aPersona: true,
      };
    } else if (r.tipo === "no_entendi") {
      setFallas((n) => n + 1);
      respuesta = { de: "asistente", texto: r.texto, aPersona: fallas >= 1 };
    } else {
      setFallas(0);
      respuesta = { de: "asistente", texto: r.texto, enlace: r.enlace };
    }
    setTurnos((t) => [...t, { de: "persona" as const, texto }, respuesta].slice(-MAX_TURNOS));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-text-muted">
        Le responde un asistente automático con respuestas preparadas por el equipo. No escriba datos personales.
      </p>
      <ol aria-live="polite" className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto rounded-md border-2 border-border-subtle p-3">
        {turnos.map((t, i) => (
          <li
            key={i}
            ref={i === turnos.length - 1 ? final : undefined}
            className={cn("flex max-w-[90%] flex-col gap-2 rounded-md p-3", t.de === "persona" ? "self-end bg-surface-strong" : "self-start bg-surface")}
          >
            <span className="sr-only">{t.de === "persona" ? "Usted:" : "Asistente:"}</span>
            <p>{t.texto}</p>
            {t.enlace && (
              <Link href={t.enlace.href} className="inline-flex min-h-tap items-center self-start font-bold underline underline-offset-4">
                {t.enlace.texto}
              </Link>
            )}
            {t.aPersona && (
              <a href="#llameme" className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4">
                <UserRound aria-hidden className="size-5" />
                Pedir que me llamen
              </a>
            )}
          </li>
        ))}
      </ol>
      <form onSubmit={enviar} method="post" className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="mensaje-chat" className="sr-only">
          Su pregunta
        </label>
        <input
          id="mensaje-chat"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          maxLength={MAX_CARACTERES}
          placeholder="Escriba su pregunta"
          autoComplete="off"
          className="min-h-action flex-1 rounded-sm border-2 border-border bg-bg px-4 text-base placeholder:text-text-muted focus-visible:border-text"
        />
        <Button type="submit" variant="secundario">
          <Send aria-hidden />
          Enviar
        </Button>
      </form>
    </div>
  );
}
