import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MESES, TEXTO_FORMATO } from "@/components/experiencias/textos";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { obtenerExperiencia } from "@/lib/datos/experiencias";
import { MODO_DEMO } from "@/lib/demo";
import { pesos } from "@/lib/formas";

import { pedirCotizacion } from "../../acciones";

export default async function FichaExperiencia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exp = await obtenerExperiencia(slug);
  if (!exp) notFound();

  const grupo =
    exp.grupo_min && exp.grupo_max ? `De ${exp.grupo_min} a ${exp.grupo_max} personas` : exp.grupo_max ? `Hasta ${exp.grupo_max} personas` : null;
  const datos = [
    ["Sabedora o sabedor", exp.sabedora_nombre ? [exp.sabedora_nombre, exp.sabedora_pueblo].filter(Boolean).join(", ") : null],
    ["Duración", exp.duracion],
    ["Grupo", grupo],
    ["Precio desde", exp.precio_desde ? pesos(exp.precio_desde) : null],
  ] as const;
  const mesActual = new Date().getMonth();

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
      <Pantalla
        titulo={exp.nombre}
        antesDelTitulo={
          <Link
            href="/empresa/experiencias"
            className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden className="size-5" />
            Volver a experiencias
          </Link>
        }
        intro={exp.proposito}
      >
        <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-surface-strong">
          <Sparkles aria-hidden className="size-16 text-text-muted" />
          <span className="sr-only">Fotos por cargar</span>
        </div>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {exp.para_quien && (
            <div>
              <dt className="text-base text-text-muted">Para quién</dt>
              <dd className="font-bold">{exp.para_quien}</dd>
            </div>
          )}
          {datos.map(([k, v]) => (
            <div key={k}>
              <dt className="text-base text-text-muted">{k}</dt>
              <dd className={v ? "font-bold" : "italic"}>{v ?? "Por definir"}</dd>
            </div>
          ))}
        </dl>

        {exp.beneficios.length > 0 && (
          <section aria-labelledby="beneficios" className="flex flex-col gap-2">
            <h2 id="beneficios" className="text-xl">
              Lo que se lleva su equipo
            </h2>
            <ul className="list-disc pl-6">
              {exp.beneficios.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>
        )}

        {exp.momentos.length > 0 && (
          <section aria-labelledby="momentos" className="flex flex-col gap-3">
            <h2 id="momentos" className="text-xl">
              Cómo transcurre
            </h2>
            <ol className="flex flex-col gap-3">
              {exp.momentos.map((m, i) => (
                <li key={m.titulo} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-strong font-bold">{i + 1}</span>
                  <div>
                    <p className="font-bold">{m.titulo}</p>
                    <p className="text-text-muted">{m.descripcion}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {exp.testimonio && <blockquote className="border-l-4 border-text pl-4 text-lg italic">{exp.testimonio}</blockquote>}
        {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
      </Pantalla>

      <aside aria-labelledby="cotizar" className="flex flex-col gap-5 self-start rounded-lg bg-surface p-5 lg:sticky lg:top-6">
        <h2 id="cotizar" className="text-xl">
          Pedir cotización
        </h2>
        <BotonAccion accion={pedirCotizacion} campos={{ experiencia: exp.id }} texto="Pedir cotización" ancho="completo">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-lg font-bold">¿Dónde?</legend>
            {exp.formatos.map((f, i) => (
              <label key={f} className="flex min-h-tap items-center gap-3 text-lg">
                <input type="radio" name="formato" value={f} defaultChecked={i === 0} className="size-6 accent-[var(--color-primary)]" />
                {TEXTO_FORMATO[f]}
              </label>
            ))}
          </fieldset>
          <Campo id="personas" etiqueta="¿Cuántas personas?">
            {(p) => <Input {...p} name="personas" type="number" inputMode="numeric" min={1} max={500} className={`${p.className} max-w-40`} />}
          </Campo>
          <Campo id="mes" etiqueta="Mes">
            {(p) => (
              <select {...p} name="mes" defaultValue={MESES[(mesActual + 1) % 12]} className={`${p.className} min-h-action`}>
                {MESES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            )}
          </Campo>
          <Campo id="nota" etiqueta="Nota (opcional)">
            {(p) => <Textarea {...p} name="nota" rows={3} className={`${p.className} min-h-28`} />}
          </Campo>
        </BotonAccion>
        <p className="text-base text-text-muted">Le respondemos con el valor. No se paga nada por la plataforma.</p>
      </aside>
    </div>
  );
}
