import { ArrowLeft, EyeOff, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { etiquetaForma } from "@/components/empresa/tarjeta-perfil";
import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Etiqueta } from "@/components/ui/etiqueta";
import { perfilesEjemplo } from "@/lib/demo";

export default async function FichaPerfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = perfilesEjemplo.find((p) => p.id === id);
  if (!perfil) notFound();

  const reservado = perfil.visibilidad === "reservado";
  const capas = [
    { titulo: "Situaciones que ha resuelto", etiquetas: perfil.situaciones },
    { titulo: "Contexto y escala", etiquetas: perfil.contexto },
    { titulo: "Normas que conoce", etiquetas: perfil.normas },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <Pantalla
        titulo={reservado ? perfil.oficio : (perfil.nombre ?? perfil.oficio)}
        antesDelTitulo={
          <Link
            href="/empresa/explorar"
            className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden className="size-5" />
            Volver a perfiles
          </Link>
        }
        intro={
          <span className="flex items-center gap-2">
            <MapPin aria-hidden className="size-5" />
            {perfil.ubicacion}
            {!reservado && ` · ${perfil.oficio}`}
          </span>
        }
      >
        {reservado && (
          <div className="flex items-start gap-3 rounded-md bg-surface p-4">
            <EyeOff aria-hidden className="mt-0.5 size-6 shrink-0" />
            <p>
              <span className="font-bold">Perfil reservado.</span> Verá el nombre y la foto cuando
              esta persona acepte conocerle.
            </p>
          </div>
        )}

        <section aria-labelledby="huella" className="flex flex-col gap-6">
          <h2 id="huella" className="text-xl">
            Huella de experiencia
          </h2>
          {capas.map(({ titulo, etiquetas }) => (
            <div key={titulo} className="flex flex-col gap-2">
              <h3 className="text-lg">{titulo}</h3>
              <div className="flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <Etiqueta key={e} texto={e} confirmada />
                ))}
              </div>
            </div>
          ))}
        </section>
        <p className="text-base text-text-muted">Datos de ejemplo.</p>
      </Pantalla>

      <aside aria-labelledby="contratar" className="flex flex-col gap-5 self-start rounded-lg border-2 border-border-subtle p-5 lg:sticky lg:top-6">
        <h2 id="contratar" className="text-xl">
          Cómo contratar
        </h2>
        <ul className="flex flex-col gap-2">
          {perfil.formas.map((f) => (
            <li key={f} className="font-bold">
              {etiquetaForma(f)}
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-2 gap-2 text-base">
          <dt className="text-text-muted">Disponibilidad</dt>
          <dd>{perfil.horasSemana} h/semana</dd>
          <dt className="text-text-muted">Modalidad</dt>
          <dd>{perfil.modalidad}</dd>
        </dl>
        <Button ancho="completo">Quiero conocer este perfil</Button>
        <p className="text-base text-text-muted">
          Le avisamos a la persona. Si le interesa, abrimos la conversación.
        </p>
        <Pendiente hito={4}>Solicitud de conexión.</Pendiente>
      </aside>
    </div>
  );
}
