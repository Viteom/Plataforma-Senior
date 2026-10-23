import { BookOpenText, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotonVolver } from "@/components/layout/boton-volver";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input } from "@/components/ui/campo";

import { pedirLlamada } from "./acciones";
import { ChatAyuda } from "./chat";

export const metadata: Metadata = { title: "Ayuda" };

// Número público del equipo (no es un dato privado). Sin configurar, se dice que está por definir.
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_EQUIPO ?? "").replace(/\D/g, "");

// Accesible para todos los roles y sin sesión. Sin botón "Ayuda" en el encabezado: ya estamos aquí.
export default function Ayuda() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b-2 border-border-subtle bg-bg">
        <div className="mx-auto flex min-h-16 max-w-xl items-center px-4">
          <BotonVolver />
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-8">
        <Pantalla
          titulo="¿En qué te ayudamos?"
          intro="Siempre puedes hablar con una persona del equipo. Nunca te vamos a pedir códigos, contraseñas ni dinero."
        >
          <section id="llameme" aria-labelledby="titulo-llameme" className="flex scroll-mt-20 flex-col gap-5 rounded-lg bg-surface p-5">
            <div className="flex items-center gap-3">
              <Phone aria-hidden className="size-7" />
              <h2 id="titulo-llameme" className="text-xl">
                Llámeme
              </h2>
            </div>
            <p>Déjanos tu número y una persona del equipo te llama. No necesitas cuenta.</p>
            <BotonAccion accion={pedirLlamada} campos={{}} texto="Pedir que me llamen" ancho="completo">
              <Campo id="tel-ayuda" etiqueta="Número de celular">
                {(p) => <Input {...p} name="celular" type="tel" inputMode="numeric" autoComplete="tel-national" />}
              </Campo>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-lg font-bold">¿A qué hora te queda bien?</legend>
                {[
                  ["manana", "Mañana (8 a 12)"],
                  ["tarde", "Tarde (2 a 6)"],
                ].map(([valor, texto], i) => (
                  <label key={valor} className="flex min-h-tap items-center gap-3 text-lg">
                    <input type="radio" name="franja" value={valor} defaultChecked={i === 0} className="size-6 accent-[var(--color-primary)]" />
                    {texto}
                  </label>
                ))}
              </fieldset>
              <Campo id="motivo-ayuda" etiqueta="¿Sobre qué? (opcional)">
                {(p) => <Input {...p} name="motivo" maxLength={300} />}
              </Campo>
            </BotonAccion>
          </section>

          <section aria-labelledby="titulo-chat" className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <MessagesSquare aria-hidden className="size-7" />
              <h2 id="titulo-chat" className="text-xl">
                Escribir en el chat
              </h2>
            </div>
            <ChatAyuda />
          </section>

          <section aria-labelledby="otras" className="flex flex-col gap-3">
            <h2 id="otras" className="text-xl">
              Otras formas
            </h2>
            <div className="flex items-start gap-4 rounded-md border-2 border-border-subtle p-5">
              <MessageCircle aria-hidden className="size-7 shrink-0" />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg">WhatsApp del equipo</h3>
                {WHATSAPP ? (
                  <a href={`https://wa.me/${WHATSAPP}`} className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
                    Escribir por WhatsApp
                  </a>
                ) : (
                  <p className="text-text-muted">Número por definir.</p>
                )}
              </div>
            </div>
            <Link href="/ayuda/guia" className="flex items-start gap-4 rounded-md border-2 border-border-subtle p-5 transition-colors duration-150 hover:border-text">
              <BookOpenText aria-hidden className="size-7 shrink-0" />
              <span className="flex flex-col gap-1">
                <span className="text-lg font-bold">Guía paso a paso</span>
                <span className="text-text-muted">Cómo entrar, crear tu perfil, contar tu historia y cuidarte de estafas.</span>
              </span>
            </Link>
          </section>
        </Pantalla>
      </main>
    </>
  );
}
