"use client";

import { Mic, PenLine, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Campo, Textarea } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";

type Modo = "escribir" | "dictar" | "llamada";

const modos = [
  { valor: "escribir" as const, titulo: "Escribirla", descripcion: "A su ritmo, con sus palabras.", icono: PenLine },
  { valor: "dictar" as const, titulo: "Contarla hablando", descripcion: "El celular escribe lo que usted dice.", icono: Mic },
  { valor: "llamada" as const, titulo: "Que me llamen", descripcion: "Una persona del equipo le ayuda por teléfono.", icono: Phone },
];

export default function Huella() {
  const [modo, setModo] = useState<Modo>("escribir");

  return (
    <Pantalla
      titulo="Cuéntenos un problema difícil que resolvió"
      intro="¿Qué pasó, qué hizo usted y cómo terminó? Con eso armamos su huella de experiencia: lo que las empresas ven de usted."
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿Cómo prefiere contarla?</legend>
        {modos.map(({ valor, titulo, descripcion, icono: Icono }) => (
          <Opcion
            key={valor}
            name="modo"
            value={valor}
            checked={modo === valor}
            onChange={() => setModo(valor)}
            icono={<Icono aria-hidden className="mt-0.5 size-6 shrink-0" />}
            titulo={titulo}
            descripcion={descripcion}
          />
        ))}
      </fieldset>

      {modo === "escribir" && (
        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          <Campo
            id="historia"
            etiqueta="Su historia"
            ayuda="No importa la ortografía. Cuente detalles: dónde era, cuántas personas, qué normas."
          >
            {(p) => <Textarea {...p} rows={8} />}
          </Campo>
          <Pendiente hito={3}>
            Al guardar, la plataforma le propone etiquetas y usted quita las que no son suyas.
          </Pendiente>
          <Button type="submit" ancho="completo">
            Guardar mi historia
          </Button>
        </form>
      )}

      {modo === "dictar" && (
        <div className="flex flex-col gap-6">
          <Pendiente hito={3}>
            Toca el botón, habla, y el texto aparece para que lo revise antes de guardar.
          </Pendiente>
          <Button ancho="completo" disabled>
            <Mic aria-hidden />
            Empezar a hablar
          </Button>
        </div>
      )}

      {modo === "llamada" && (
        <div className="flex flex-col gap-6">
          <p className="text-lg">
            Déjenos su número y la hora en que le queda bien. Nunca le vamos a pedir códigos,
            contraseñas ni dinero.
          </p>
          <Button asChild ancho="completo">
            <Link href="/ayuda#llameme">Pedir que me llamen</Link>
          </Button>
        </div>
      )}

      <Link href="/inicio" className="inline-flex min-h-tap items-center self-start text-base font-bold underline underline-offset-4">
        Hacerlo más tarde
      </Link>
    </Pantalla>
  );
}
