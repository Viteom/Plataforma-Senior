import { ExternalLink, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { EscucharPantalla } from "@/components/talento/voz";
import { buttonVariants } from "@/components/ui/button";
import { miEmprendimiento, type MiEmprendimiento } from "@/lib/datos/emprende";
import { etiquetaEtapa, rutaPara } from "@/lib/emprende/ruta";

import { Diagnostico, PasoRuta } from "./formulario";

export const metadata: Metadata = { title: "Emprende" };

export default async function Emprende({ searchParams }: { searchParams: Promise<{ cambiar?: string }> }) {
  const { cambiar } = await searchParams;
  const mio = await miEmprendimiento();

  if (mio && cambiar !== "1") {
    return (
      <Pantalla titulo="Emprende" intro="Tu ruta queda guardada. Puedes ir a un curso y volver cuando quieras: aquí la encuentras.">
        <EscucharPantalla className="-mt-4" />
        <RutaGuardada mio={mio} />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Emprende" intro="Cuéntanos en qué va tu negocio y te mostramos los pasos y cursos que te sirven. Queda guardado.">
      <Diagnostico inicial={mio ? { etapa: mio.etapa, necesidades: mio.necesidades, idea: mio.idea, asesoria: mio.asesoria } : null} />
    </Pantalla>
  );
}

function RutaGuardada({ mio }: { mio: MiEmprendimiento }) {
  const ruta = rutaPara(mio.etapa, mio.necesidades);
  const hechos = ruta.filter((p) => mio.pasosHechos.includes(p.clave)).length;
  const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: "America/Bogota" });

  return (
    <>
      <section aria-labelledby="mi-idea" className="flex flex-col gap-2 rounded-lg bg-surface p-5">
        <h2 id="mi-idea" className="text-xl">
          Mi emprendimiento
        </h2>
        <p className="text-lg">{mio.idea ?? "Todavía no escribiste tu idea con tus palabras."}</p>
        <p className="text-text-muted">En qué va: {etiquetaEtapa(mio.etapa)}</p>
        <Link href="/emprende?cambiar=1" className={buttonVariants({ variant: "secundario", size: "normal", className: "mt-2 self-start" })}>
          <Pencil aria-hidden />
          Cambiar mis respuestas
        </Link>
      </section>

      <section aria-labelledby="ruta" className="flex flex-col gap-4">
        <h2 id="ruta" className="text-xl">
          Mi ruta
        </h2>
        <p className="font-bold">
          Llevas {hechos} de {ruta.length} pasos.
        </p>
        <ol className="flex flex-col gap-5">
          {ruta.map((p, i) => (
            <PasoRuta
              key={p.clave}
              paso={p}
              numero={i + 1}
              hechoInicial={mio.pasosHechos.includes(p.clave)}
              respuestaInicial={mio.respuestas[p.clave] ?? ""}
            />
          ))}
        </ol>
      </section>

      <section aria-labelledby="cursos-vistos" className="flex flex-col gap-3">
        <h2 id="cursos-vistos" className="text-xl">
          Cursos que abriste
        </h2>
        {mio.cursos.length ? (
          <ul className="flex flex-col gap-3">
            {mio.cursos.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-lg bg-raised p-4 shadow-tarjeta">
                <p className="font-bold">{c.titulo}</p>
                <p className="text-base text-text-muted">
                  {c.entidad} · lo abriste el {fecha(c.ultimo)}
                </p>
                <a href={`/aprende/ir/${c.id}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secundario", size: "normal", className: "self-start" })}>
                  Abrir de nuevo
                  <ExternalLink aria-hidden />
                  <span className="sr-only">(se abre en otra pestaña)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">Cuando abras un curso desde tu ruta, aparece aquí para que no lo pierdas.</p>
        )}
      </section>

      <section aria-labelledby="asesor" className="flex flex-col gap-3 rounded-lg bg-surface p-5">
        <h2 id="asesor" className="text-xl">
          ¿Quieres hablar con alguien?
        </h2>
        {mio.asesoria ? (
          <p>Pediste asesoría: alguien del equipo te contacta. Si es urgente, escríbenos desde Ayuda.</p>
        ) : (
          <p>Una persona del equipo te puede acompañar con tu ruta, por WhatsApp o por llamada.</p>
        )}
        <Link href="/ayuda" className={buttonVariants({ variant: "secundario", size: "normal", className: "self-start" })}>
          Hablar con un asesor
        </Link>
      </section>
    </>
  );
}
