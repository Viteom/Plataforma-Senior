"use client";

import { ArrowLeft, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  FLUJOS,
  MENU,
  motivoParaEquipo,
  resultado,
  resumen,
  textoRespuesta,
  validar,
  type FlujoId,
  type Respuestas,
} from "@/lib/ayuda/flujos";
import { MAX_CARACTERES, responder, type Enlace } from "@/lib/ayuda/respuestas";
import { cn } from "@/lib/utils";

import { escalarChat, pedirLlamada } from "./acciones";

type Turno = { de: "persona" | "asistente"; texto: string; etiqueta?: string; enlace?: Enlace; lista?: string[] };

type Modo =
  | { tipo: "menu" }
  | { tipo: "flujo"; flujo: FlujoId; paso: number; respuestas: Respuestas }
  | { tipo: "confirmar"; flujo: FlujoId; respuestas: Respuestas }
  | { tipo: "libre" }
  | { tipo: "enviando" };

const MAX_TURNOS = 30;

// Chat sin IA. Por defecto guía con botones, una pregunta a la vez, y confirma cada respuesta
// antes de seguir. Quien prefiera escribir, puede. Un tema de riesgo pasa siempre a una persona.
export function ChatAyuda() {
  const [turnos, setTurnos] = useState<Turno[]>([
    { de: "asistente", texto: "Hola. ¿En qué te ayudamos? Toca una opción o escribe tu pregunta." },
  ]);
  const [modo, setModo] = useState<Modo>({ tipo: "menu" });
  const [ofrecer, setOfrecer] = useState<FlujoId | null>(null);
  const [entrada, setEntrada] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fallas, setFallas] = useState(0);
  const final = useRef<HTMLLIElement>(null);
  const controles = useRef<HTMLDivElement>(null);

  const decir = (...nuevos: Turno[]) => setTurnos((t) => [...t, ...nuevos].slice(-MAX_TURNOS));

  useEffect(() => {
    final.current?.scrollIntoView({ block: "nearest" });
  }, [turnos]);

  // Lleva el foco al primer control de la pregunta nueva: quien usa teclado o lector de pantalla
  // no tiene que buscarlo.
  useEffect(() => {
    if (modo.tipo === "menu" && turnos.length === 1) return;
    controles.current?.querySelector<HTMLElement>("button, input")?.focus();
  }, [modo, turnos.length]);

  function preguntar(flujo: FlujoId, paso: number) {
    const f = FLUJOS[flujo];
    return { de: "asistente" as const, etiqueta: `Paso ${paso + 1} de ${f.pasos.length}`, texto: f.pasos[paso].pregunta };
  }

  function empezar(flujo: FlujoId) {
    const f = FLUJOS[flujo];
    setOfrecer(null);
    setError(null);
    setEntrada("");
    decir({ de: "persona", texto: f.titulo }, { de: "asistente", texto: f.intro }, preguntar(flujo, 0));
    setModo({ tipo: "flujo", flujo, paso: 0, respuestas: {} });
  }

  function volverAlMenu(texto = "¿Te ayudamos con algo más?") {
    decir({ de: "asistente", texto });
    setModo({ tipo: "menu" });
    setEntrada("");
    setError(null);
  }

  function responderPaso(valor: string) {
    if (modo.tipo !== "flujo") return;
    const f = FLUJOS[modo.flujo];
    const paso = f.pasos[modo.paso];
    const problema = validar(paso, valor);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setEntrada("");
    const respuestas = { ...modo.respuestas, [paso.id]: valor.trim() };
    const recibido: Turno[] = [{ de: "persona", texto: textoRespuesta(paso, valor) }];
    if (modo.paso + 1 < f.pasos.length) {
      decir(...recibido, { ...preguntar(modo.flujo, modo.paso + 1), texto: `Recibido. ${f.pasos[modo.paso + 1].pregunta}` });
      setModo({ ...modo, paso: modo.paso + 1, respuestas });
      return;
    }
    if (f.accion === "ninguna") {
      decir(...recibido);
      cerrar(modo.flujo, respuestas);
      return;
    }
    decir(...recibido, { de: "asistente", texto: "Recibido. Revisa que todo esté bien antes de enviarlo:", lista: resumen(f, respuestas) });
    setModo({ tipo: "confirmar", flujo: modo.flujo, respuestas });
  }

  function cerrar(flujo: FlujoId, respuestas: Respuestas, extra?: string) {
    const r = resultado(FLUJOS[flujo], respuestas);
    decir({ de: "asistente", texto: extra ? `${r.texto} ${extra}` : r.texto, enlace: r.enlace });
    setOfrecer(r.ofrecer ?? null);
    setModo({ tipo: "menu" });
  }

  async function enviar() {
    if (modo.tipo !== "confirmar") return;
    const { flujo, respuestas } = modo;
    const f = FLUJOS[flujo];
    setModo({ tipo: "enviando" });
    if (f.accion === "llamada") {
      const datos = new FormData();
      datos.set("celular", respuestas.celular ?? "");
      datos.set("franja", respuestas.franja ?? "manana");
      datos.set("motivo", motivoParaEquipo(f, respuestas));
      const r = await pedirLlamada({}, datos);
      if (r.error) {
        decir({ de: "asistente", texto: r.error });
        setModo({ tipo: "confirmar", flujo, respuestas });
        return;
      }
      cerrar(flujo, respuestas);
      return;
    }
    const { creada } = await escalarChat("fraude", motivoParaEquipo(f, respuestas));
    if (creada) {
      cerrar(flujo, respuestas, "Te contactamos pronto.");
    } else {
      cerrar(flujo, respuestas, "Para que alguien te contacte, déjanos tu celular:");
      setOfrecer("llamada");
    }
  }

  async function preguntaLibre(e: React.FormEvent) {
    e.preventDefault();
    const texto = entrada.trim().slice(0, MAX_CARACTERES);
    if (!texto) return;
    setEntrada("");
    const r = responder(texto);
    if (r.tipo === "riesgo") {
      const { creada } = await escalarChat(r.categoria, texto);
      decir({ de: "persona", texto }, { de: "asistente", texto: creada ? `${r.texto} Ya le avisamos al equipo.` : r.texto });
      if (!creada) setOfrecer("llamada");
      return;
    }
    if (r.tipo === "no_entendi") {
      setFallas((n) => n + 1);
      decir({ de: "persona", texto }, { de: "asistente", texto: r.texto });
      if (fallas >= 1) setOfrecer("llamada");
      return;
    }
    setFallas(0);
    decir({ de: "persona", texto }, { de: "asistente", texto: r.texto, enlace: r.enlace });
  }

  const pasoActual = modo.tipo === "flujo" ? FLUJOS[modo.flujo].pasos[modo.paso] : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-text-muted">
        Te responde un asistente con respuestas preparadas por el equipo. No escribas datos personales.
      </p>
      <ol aria-live="polite" className="flex max-h-[30rem] flex-col gap-3 overflow-y-auto rounded-md border-2 border-border-subtle bg-raised p-3">
        {turnos.map((t, i) => (
          <li
            key={i}
            ref={i === turnos.length - 1 ? final : undefined}
            className={cn(
              "flex max-w-[90%] flex-col gap-2 rounded-md p-3",
              t.de === "persona" ? "self-end bg-primary text-on-primary" : "self-start bg-surface",
            )}
          >
            <span className="sr-only">{t.de === "persona" ? "Tú:" : "Asistente:"}</span>
            {t.etiqueta && <span className="text-sm font-bold tracking-wide text-primary uppercase">{t.etiqueta}</span>}
            <p>{t.texto}</p>
            {t.lista && (
              <ul className="list-disc pl-5">
                {t.lista.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
            {t.enlace && (
              <Link href={t.enlace.href} className="inline-flex min-h-tap items-center self-start font-bold underline underline-offset-4">
                {t.enlace.texto}
              </Link>
            )}
          </li>
        ))}
      </ol>

      {/* Solo los controles de la pregunta actual: una cosa a la vez. */}
      <div ref={controles} className="flex flex-col gap-3">
        {modo.tipo === "menu" && (
          <>
            {ofrecer && (
              <Button variant="primario" ancho="completo" onClick={() => empezar(ofrecer)}>
                <UserRound aria-hidden />
                {FLUJOS[ofrecer].titulo}
              </Button>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {MENU.filter((id) => id !== ofrecer).map((id) => (
                <Button key={id} variant="secundario" ancho="completo" onClick={() => empezar(id)}>
                  {FLUJOS[id].titulo}
                </Button>
              ))}
            </div>
            <Button variant="enlace" size="normal" className="self-start" onClick={() => setModo({ tipo: "libre" })}>
              Prefiero escribir mi pregunta
            </Button>
          </>
        )}

        {modo.tipo === "flujo" && pasoActual && (
          <>
            {pasoActual.tipo === "opciones" ? (
              <div className="grid gap-2">
                {pasoActual.opciones.map((o) => (
                  <Button key={o.valor} variant="secundario" ancho="completo" onClick={() => responderPaso(o.valor)}>
                    {o.texto}
                  </Button>
                ))}
              </div>
            ) : (
              <form
                method="post"
                onSubmit={(e) => {
                  e.preventDefault();
                  responderPaso(entrada);
                }}
                className="flex flex-col gap-3"
              >
                <label htmlFor="respuesta-chat" className="sr-only">
                  {pasoActual.pregunta}
                </label>
                <input
                  id="respuesta-chat"
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  type={pasoActual.tipo === "celular" ? "tel" : "text"}
                  inputMode={pasoActual.tipo === "celular" ? "numeric" : undefined}
                  autoComplete={pasoActual.tipo === "celular" ? "tel-national" : "off"}
                  maxLength={pasoActual.tipo === "texto" ? pasoActual.max : 20}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={pasoActual.tipo === "texto" ? "ayuda-chat" : undefined}
                  className="min-h-action rounded-sm border-2 border-border bg-bg px-4 text-base focus-visible:border-text"
                />
                {pasoActual.tipo === "texto" && (
                  <p id="ayuda-chat" className="text-base text-text-muted">
                    {pasoActual.ayuda}
                  </p>
                )}
                <Button type="submit" ancho="completo">
                  Seguir
                </Button>
                {pasoActual.tipo === "texto" && pasoActual.opcional && (
                  <Button type="button" variant="enlace" size="normal" className="self-start" onClick={() => responderPaso("")}>
                    Seguir sin escribir
                  </Button>
                )}
              </form>
            )}
            {error && (
              <p role="alert" className="font-bold text-danger">
                {error}
              </p>
            )}
            <Button variant="enlace" size="normal" className="self-start" onClick={() => volverAlMenu("Listo, dejamos eso. ¿En qué te ayudamos?")}>
              <ArrowLeft aria-hidden />
              Volver a las opciones
            </Button>
          </>
        )}

        {modo.tipo === "confirmar" && (
          <>
            <Button ancho="completo" onClick={enviar}>
              {FLUJOS[modo.flujo].accion === "llamada" ? "Sí, que me llamen" : "Sí, enviar al equipo"}
            </Button>
            <Button variant="secundario" ancho="completo" onClick={() => empezar(modo.flujo)}>
              Corregir
            </Button>
          </>
        )}

        {modo.tipo === "enviando" && <p role="status">Enviando…</p>}

        {modo.tipo === "libre" && (
          <>
            <form onSubmit={preguntaLibre} method="post" className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="mensaje-chat" className="sr-only">
                Tu pregunta
              </label>
              <input
                id="mensaje-chat"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                maxLength={MAX_CARACTERES}
                placeholder="Escribe tu pregunta"
                autoComplete="off"
                className="min-h-action flex-1 rounded-sm border-2 border-border bg-bg px-4 text-base placeholder:text-text-muted focus-visible:border-text"
              />
              <Button type="submit" variant="secundario">
                <Send aria-hidden />
                Enviar
              </Button>
            </form>
            {ofrecer && (
              <Button variant="primario" ancho="completo" onClick={() => empezar(ofrecer)}>
                <UserRound aria-hidden />
                {FLUJOS[ofrecer].titulo}
              </Button>
            )}
            <Button variant="enlace" size="normal" className="self-start" onClick={() => setModo({ tipo: "menu" })}>
              <ArrowLeft aria-hidden />
              Volver a las opciones
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
