import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Tarjeta } from "@/components/ui/tarjeta";

export const metadata: Metadata = { title: "Aprende" };

const temas = ["Herramientas digitales", "Cobrar por su trabajo", "Mentoría", "Su propio negocio"];

export default function Aprende() {
  return (
    <Pantalla titulo="Aprende" intro="Cursos gratuitos de otras entidades, elegidos para usted.">
      <ul aria-label="Temas" className="flex flex-wrap gap-2">
        {temas.map((t) => (
          <li
            key={t}
            className="inline-flex min-h-tap items-center rounded-sm border-2 border-border px-3"
          >
            {t}
          </li>
        ))}
      </ul>
      <Pendiente hito={5}>Catálogo enlazado con filtros por tema.</Pendiente>

      <Tarjeta className="bg-surface">
        <Lightbulb aria-hidden className="size-8" />
        <h2 className="text-xl">¿Quiere emprender?</h2>
        <p>Responda unas preguntas y le sugerimos una ruta según la etapa de su idea.</p>
        <Link
          href="/emprende"
          className="inline-flex min-h-tap items-center self-start font-bold underline underline-offset-4"
        >
          Ir a Emprende
        </Link>
      </Tarjeta>
    </Pantalla>
  );
}
