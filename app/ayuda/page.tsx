import { BookOpenText, MessageCircle, MessagesSquare, Phone } from "lucide-react";
import type { Metadata } from "next";

import { BotonVolver } from "@/components/layout/boton-volver";
import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";

export const metadata: Metadata = { title: "Ayuda" };

const franjas = ["Mañana (8 a 12)", "Tarde (2 a 6)"];

// Accesible para todos los roles. Sin botón "Ayuda" en el encabezado: ya estamos aquí.
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
          titulo="¿En qué le ayudamos?"
          intro="Siempre puede hablar con una persona del equipo. Nunca le vamos a pedir códigos, contraseñas ni dinero."
        >
          <section id="llameme" aria-labelledby="titulo-llameme" className="flex scroll-mt-20 flex-col gap-5 rounded-lg bg-surface p-5">
            <div className="flex items-center gap-3">
              <Phone aria-hidden className="size-7" />
              <h2 id="titulo-llameme" className="text-xl">
                Llámeme
              </h2>
            </div>
            <p>Déjenos su número y una persona del equipo le llama.</p>
            <form method="post" className="flex flex-col gap-5">
              <Campo id="tel-ayuda" etiqueta="Número de celular">
                {(p) => <Input {...p} type="tel" inputMode="numeric" autoComplete="tel-national" />}
              </Campo>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-lg font-bold">¿A qué hora le queda bien?</legend>
                {franjas.map((f, i) => (
                  <label key={f} className="flex min-h-tap items-center gap-3 text-lg">
                    <input type="radio" name="franja" defaultChecked={i === 0} className="size-6 accent-[var(--color-primary)]" />
                    {f}
                  </label>
                ))}
              </fieldset>
              <Button type="button" ancho="completo">
                Pedir que me llamen
              </Button>
            </form>
          </section>

          <section aria-labelledby="otras" className="flex flex-col gap-3">
            <h2 id="otras" className="text-xl">
              Otras formas
            </h2>
            <Canal icono={<MessagesSquare aria-hidden className="size-7" />} titulo="Escribir en el chat">
              Le respondemos paso a paso. Si no le entendemos, le pasamos con una persona.
            </Canal>
            <Canal icono={<MessageCircle aria-hidden className="size-7" />} titulo="WhatsApp del equipo">
              Número por definir.
            </Canal>
            <Canal icono={<BookOpenText aria-hidden className="size-7" />} titulo="Guía paso a paso">
              Cómo entrar, crear su perfil y contar su historia.
            </Canal>
          </section>

          <Pendiente hito={5}>Chat con asistente, solicitudes de llamada y guía.</Pendiente>
        </Pantalla>
      </main>
    </>
  );
}

function Canal({ icono, titulo, children }: { icono: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <Tarjeta className="flex-row items-start gap-4">
      {icono}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg">{titulo}</h3>
        <p className="text-text-muted">{children}</p>
      </div>
    </Tarjeta>
  );
}
