import { ExternalLink, MessageCircle, Pencil, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { EscucharPantalla } from "@/components/talento/voz";
import { buttonVariants } from "@/components/ui/button";
import { miEmprendimiento, type MiEmprendimiento } from "@/lib/datos/emprende";
import { etiquetaCategoria, etiquetaEtapa, rutaPara } from "@/lib/emprende/ruta";

import { Diagnostico, PasoRuta } from "./formulario";

export const metadata: Metadata = { title: "Emprende" };

const PASOS_A_LA_VEZ = 3;
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_EQUIPO ?? "").replace(/\D/g, "");

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
      <Diagnostico inicial={mio ? {
              etapa: mio.etapa,
              necesidades: mio.necesidades,
              idea: mio.idea,
              asesoria: mio.asesoria,
              categoria: mio.categoria,
              oportunidades: mio.oportunidades,
            } : null} />
    </Pantalla>
  );
}

function RutaGuardada({ mio }: { mio: MiEmprendimiento }) {
  const ruta = rutaPara(mio.etapa, mio.necesidades);
  const hechos = ruta.filter((p) => mio.pasosHechos.includes(p.clave));
  // De a tres: los próximos pasos sin hacer. Al marcar uno, aparece el siguiente.
  const pendientes = ruta.filter((p) => !mio.pasosHechos.includes(p.clave));
  const proximos = pendientes.slice(0, PASOS_A_LA_VEZ);
  const despues = pendientes.length - proximos.length;
  const numero = (clave: string) => ruta.findIndex((p) => p.clave === clave) + 1;
  const paso = (p: (typeof ruta)[number]) => (
    <PasoRuta
      key={p.clave}
      paso={p}
      numero={numero(p.clave)}
      hechoInicial={mio.pasosHechos.includes(p.clave)}
      respuestaInicial={mio.respuestas[p.clave] ?? ""}
    />
  );
  const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long", timeZone: "America/Bogota" });

  return (
    <>
      <section aria-labelledby="mi-idea" className="flex flex-col gap-2 rounded-lg bg-surface p-5">
        <h2 id="mi-idea" className="text-xl">
          Mi emprendimiento
        </h2>
        <p className="text-lg">{mio.idea ?? "Todavía no escribiste tu idea con tus palabras."}</p>
        <p className="text-text-muted">
          {mio.categoria && `${etiquetaCategoria(mio.categoria)} · `}
          {etiquetaEtapa(mio.etapa)}
        </p>
        <p className="text-base">
          {mio.oportunidades
            ? "Estás en el grupo de emprendedores: te escribimos cuando haya ferias o lugares para vender."
            : "Si quieres recibir ferias y lugares para vender, actívalo en «Cambiar mis respuestas»."}
        </p>
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
          Llevas {hechos.length} de {ruta.length} pasos.
        </p>
        {proximos.length > 0 ? (
          <>
            <h3 className="text-lg">Tus próximos pasos</h3>
            <ol className="flex flex-col gap-5">{proximos.map(paso)}</ol>
            {despues > 0 && (
              <p className="text-text-muted">
                Cuando los termines, te mostramos {despues === 1 ? "el siguiente paso" : `los ${despues} pasos que siguen`}.
              </p>
            )}
          </>
        ) : (
          <p role="status" className="rounded-md bg-exito-fondo p-4 text-lg font-bold text-exito-texto">
            ¡Terminaste tu ruta! El siguiente paso es conversar con un asesor de Kánna.
          </p>
        )}
        {hechos.length > 0 && (
          <details className="rounded-lg bg-raised p-4 shadow-tarjeta">
            <summary className="min-h-tap cursor-pointer content-center text-lg font-bold">
              Lo que ya hiciste ({hechos.length})
            </summary>
            <ol className="mt-4 flex flex-col gap-5">{hechos.map(paso)}</ol>
          </details>
        )}
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
        <div className="flex flex-wrap gap-3">
          {WHATSAPP && (
            // Texto fijo, sin datos personales en el enlace.
            <a
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola, quiero hablar con un asesor sobre mi ruta de Emprende en Kánna.")}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: pendientes.length ? "secundario" : "primario", size: "normal" })}
            >
              <MessageCircle aria-hidden />
              Escribir por WhatsApp
            </a>
          )}
          <Link href="/ayuda#llameme" className={buttonVariants({ variant: "secundario", size: "normal" })}>
            <Phone aria-hidden />
            Pedir que me llamen
          </Link>
        </div>
      </section>
    </>
  );
}
