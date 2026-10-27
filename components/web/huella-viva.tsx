import { Eye, EyeOff, MapPin } from "lucide-react";
import Image from "next/image";

import { RETRATOS } from "@/lib/web/contenido";

import { retraso } from "./marco";

// Lo único que se toca en la portada: cambiar entre «Reservado» y «Visible» y ver cómo te ve una
// organización. Funciona sin script (radios + :has) y la edad no aparece en ninguno de los dos.
const CAPACIDADES = ["Ebanistería", "Producción por lotes", "Organización de taller", "Restauración"];
const INTERESES = ["Proyectos de fabricación", "Formación de aprendices"];

const pildora = "inline-flex min-h-tap items-center rounded-full bg-surface px-4 text-base";

export function HuellaViva() {
  return (
    <section aria-labelledby="tu-decides" className="group/vista bg-surface py-24 text-text lg:py-36">
      <div className="mx-auto grid w-full max-w-web gap-14 px-4 md:px-8 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-8 lg:col-span-5">
          <h2 id="tu-decides" data-aparecer className="titular-marca text-afiche">
            Tú decides quién te ve
          </h2>
          <p data-aparecer style={retraso(1)} className="max-w-[40ch] text-lg sm:text-xl">
            Una organización conoce primero lo que sabes hacer. Tu nombre y tu foto aparecen cuando tú
            aceptas conversar. Cambia la vista y compruébalo.
          </p>
          <fieldset data-aparecer style={retraso(2)}>
            <legend className="mb-3 text-lg font-bold">Cómo te ve una organización</legend>
            <div className="inline-flex flex-wrap gap-2 rounded-full bg-surface-strong p-1.5">
              <label className="inline-flex min-h-action items-center gap-2 rounded-full px-6 text-lg font-bold transition-colors duration-150 hover:bg-bg has-[:checked]:bg-accent has-[:checked]:text-on-accent has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
                <input type="radio" name="vista" value="reservado" defaultChecked className="sr-only" />
                <EyeOff aria-hidden className="size-6" />
                Reservado
              </label>
              <label className="inline-flex min-h-action items-center gap-2 rounded-full px-6 text-lg font-bold transition-colors duration-150 hover:bg-bg has-[:checked]:bg-accent has-[:checked]:text-on-accent has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus">
                <input id="vista-visible" type="radio" name="vista" value="visible" className="sr-only" />
                <Eye aria-hidden className="size-6" />
                Visible
              </label>
            </div>
          </fieldset>
        </div>

        {/* Fragmento de la app: la tarjeta de huella tal como la ve una organización. */}
        <div data-ui data-aparecer style={retraso(2)} className="lg:col-span-6 lg:col-start-7">
          <article
            aria-label="Perfil de ejemplo visto por una organización"
            className="flex flex-col gap-6 rounded-lg bg-raised p-6 text-text sm:p-8"
          >
            <div className="flex items-center gap-5">
              <div className="group-has-[#vista-visible:checked]/vista:hidden flex size-24 shrink-0 items-center justify-center rounded-md bg-surface sm:size-28">
                <Image src="/marca/kanna-simbolo.svg" alt="" width={56} height={56} unoptimized />
              </div>
              <div className="retrato hidden size-24 shrink-0 overflow-hidden bg-accent group-has-[#vista-visible:checked]/vista:block sm:size-28">
                <Image
                  src={RETRATOS.sombrero.src}
                  alt="Foto de perfil de un hombre con sombrero"
                  width={300}
                  height={300}
                  className="h-full w-full object-cover object-[30%_center]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="inline-flex items-center gap-2 text-base font-bold text-deep">
                  <EyeOff aria-hidden className="size-5 group-has-[#vista-visible:checked]/vista:hidden" />
                  <Eye aria-hidden className="hidden size-5 group-has-[#vista-visible:checked]/vista:block" />
                  <span className="group-has-[#vista-visible:checked]/vista:hidden">Perfil reservado</span>
                  <span className="hidden group-has-[#vista-visible:checked]/vista:inline">Perfil visible</span>
                </p>
                <p className="text-2xl font-bold group-has-[#vista-visible:checked]/vista:hidden">Nombre y foto ocultos</p>
                <p className="hidden text-2xl font-bold group-has-[#vista-visible:checked]/vista:block">Hernando Ruiz</p>
                <p className="inline-flex items-center gap-1 text-base text-text-muted">
                  <MapPin aria-hidden className="size-5" />
                  Nariño
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xl font-bold">Perfil con experiencia en ebanistería y coordinación de taller</p>
              <p>Trayectoria en fabricación de muebles, organización de procesos de taller y trabajo con equipos pequeños.</p>
            </div>

            <blockquote className="hidden border-l-4 border-primary pl-4 text-lg group-has-[#vista-visible:checked]/vista:block">
              «Cuando cerró la fábrica, armé un taller en el barrio con dos aprendices. Hoy ellos hacen sus
              propios encargos.»
            </blockquote>

            <div className="flex flex-col gap-3">
              <h4 className="text-base font-bold">Conocimientos y capacidades</h4>
              <ul className="flex flex-wrap gap-2">
                {CAPACIDADES.map((c) => (
                  <li key={c} className={pildora}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="text-base font-bold">Le interesa</h4>
              <ul className="flex flex-wrap gap-2">
                {INTERESES.map((c) => (
                  <li key={c} className={pildora}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-md bg-surface px-4 py-3 text-base font-bold">
              La edad no aparece. Ni en reservado ni en visible.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
