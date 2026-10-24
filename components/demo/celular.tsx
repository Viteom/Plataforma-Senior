import { BadgeCheck, ChevronLeft, MessageSquareText } from "lucide-react";

import { cn } from "@/lib/utils";

export type Burbuja = { id: string; titulo: string; texto: string; botones?: string[]; en?: string };

const hora = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "America/Bogota" }) : "";

// Un celular dibujado con la conversación que recibe la persona. Es diseño: los colores salen de
// la marca, no imitan los de WhatsApp ni los del sistema.
export function Celular({ tipo, burbujas, vacio }: { tipo: "sms" | "whatsapp"; burbujas: Burbuja[]; vacio: string }) {
  const wa = tipo === "whatsapp";
  return (
    <figure className="mx-auto flex w-full max-w-[22rem] flex-col">
      <div className="overflow-hidden rounded-lg border-8 border-text bg-text">
        <div className={cn("flex items-center gap-3 px-4 pt-5 pb-3", wa ? "bg-deep text-on-deep" : "bg-surface text-text")}>
          <ChevronLeft aria-hidden className="size-5 shrink-0" />
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-base font-bold",
              wa ? "bg-accent text-on-accent" : "bg-surface-strong",
            )}
          >
            K
          </span>
          <span className="flex flex-col leading-tight">
            <span className="inline-flex items-center gap-1 font-bold">
              {wa ? "Kánna" : "Kanna"}
              {wa && <BadgeCheck aria-label="Cuenta verificada" className="size-4" />}
            </span>
            <span className="text-sm opacity-90">{wa ? "Cuenta de empresa" : "Mensaje de texto"}</span>
          </span>
        </div>
        {/* Alto fijo como una pantalla de verdad. column-reverse hace que abra abajo, en el
            mensaje más reciente; por eso la lista va del más nuevo al más viejo. */}
        <ol
          tabIndex={0}
          aria-label={`${wa ? "Mensajes por WhatsApp" : "Mensajes de texto"}, del más reciente al más antiguo`}
          className="flex h-[34rem] flex-col-reverse gap-3 overflow-y-auto bg-bg p-3"
        >
          {burbujas.length === 0 && (
            <li className="m-auto flex max-w-[16rem] flex-col items-center gap-2 text-center text-base text-text-muted">
              <MessageSquareText aria-hidden className="size-8" />
              {vacio}
            </li>
          )}
          {[...burbujas].reverse().map((b) => (
            <li key={b.id} className="flex flex-col gap-1">
              <span className="px-1 text-sm font-bold text-text-muted">{b.titulo}</span>
              <div className="max-w-[92%] rounded-md rounded-tl-sm bg-raised p-3 text-base whitespace-pre-line">
                {b.texto}
                {b.en && <span className="mt-1 block text-right text-sm text-text-muted">{hora(b.en)}</span>}
              </div>
              {b.botones && b.botones.length > 0 && (
                <div className="flex max-w-[92%] flex-col gap-1">
                  {b.botones.map((t) => (
                    <span key={t} className="rounded-md bg-raised px-3 py-2 text-center text-base font-bold text-primary">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="mt-3 text-center text-lg font-bold">{wa ? "WhatsApp" : "Mensaje de texto (SMS)"}</figcaption>
    </figure>
  );
}
