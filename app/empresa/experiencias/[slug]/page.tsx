import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { experienciaEjemplo as exp } from "@/lib/demo";

const meses = ["Noviembre", "Diciembre", "Enero", "Febrero", "Marzo"];

export default async function FichaExperiencia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== exp.slug) notFound();

  const datos = [
    ["Sabedora", exp.sabedora],
    ["Duración", exp.duracion],
    ["Grupo", exp.grupo],
    ["Precio desde", exp.precioDesde],
  ] as const;

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
          <div>
            <dt className="text-base text-text-muted">Para quién</dt>
            <dd className="font-bold">{exp.paraQuien}</dd>
          </div>
          {datos.map(([k, v]) => (
            <div key={k}>
              <dt className="text-base text-text-muted">{k}</dt>
              <dd className={v ? "font-bold" : "italic"}>{v ?? "Por definir"}</dd>
            </div>
          ))}
        </dl>
      </Pantalla>

      <aside aria-labelledby="cotizar" className="flex flex-col gap-5 self-start rounded-lg bg-surface p-5 lg:sticky lg:top-6">
        <h2 id="cotizar" className="text-xl">
          Pedir cotización
        </h2>
        <form method="post" className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-lg font-bold">¿Dónde?</legend>
            {exp.formatos.map((f, i) => (
              <label key={f} className="flex min-h-tap items-center gap-3 text-lg">
                <input type="radio" name="formato" defaultChecked={i === 0} className="size-6 accent-[var(--color-primary)]" />
                {f}
              </label>
            ))}
          </fieldset>
          <Campo id="personas" etiqueta="¿Cuántas personas?">
            {(p) => <Input {...p} type="number" inputMode="numeric" min={1} className={`${p.className} max-w-40`} />}
          </Campo>
          <Campo id="mes" etiqueta="Mes">
            {(p) => (
              <select {...p} className={`${p.className} min-h-action`}>
                {meses.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            )}
          </Campo>
          <Campo id="nota" etiqueta="Nota (opcional)">
            {(p) => <Textarea {...p} rows={3} className={`${p.className} min-h-28`} />}
          </Campo>
          <Button type="button" ancho="completo">
            Pedir cotización
          </Button>
        </form>
        <Pendiente hito={5}>El equipo recibe la solicitud y le responde con el valor.</Pendiente>
      </aside>
    </div>
  );
}
