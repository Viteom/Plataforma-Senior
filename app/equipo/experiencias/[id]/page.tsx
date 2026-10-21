import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TEXTO_FORMATO } from "@/components/experiencias/textos";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { obtenerExperiencia } from "@/lib/datos/experiencias";

import { guardarExperiencia } from "../../acciones";

export const metadata: Metadata = { title: "Editar experiencia" };

export default async function EditarExperiencia({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nueva = id === "nueva";
  const e = nueva ? null : await obtenerExperiencia(id);
  if (!nueva && !e) notFound();

  return (
    <div className="max-w-3xl">
      <Pantalla
        titulo={e ? e.nombre : "Nueva experiencia"}
        antesDelTitulo={
          <Link href="/equipo/experiencias" className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline-offset-4 hover:underline">
            <ArrowLeft aria-hidden className="size-5" />
            Experiencias
          </Link>
        }
        intro="Lo que escriba aquí lo ven las empresas cuando la experiencia esté publicada. Revíselo con la sabedora o el sabedor."
      >
        <BotonAccion accion={guardarExperiencia} campos={{ id: e?.id ?? "" }} texto="Guardar" repetible>
          <div className="flex flex-col gap-6">
            <Campo id="nombre" etiqueta="Nombre">
              {(p) => <Input {...p} name="nombre" defaultValue={e?.nombre} />}
            </Campo>
            <Campo id="proposito" etiqueta="Propósito">
              {(p) => <Textarea {...p} name="proposito" rows={4} defaultValue={e?.proposito} />}
            </Campo>
            <div className="grid gap-6 sm:grid-cols-2">
              <Campo id="sabedora_nombre" etiqueta="Nombre de la sabedora o el sabedor">
                {(p) => <Input {...p} name="sabedora_nombre" defaultValue={e?.sabedora_nombre ?? ""} />}
              </Campo>
              <Campo id="sabedora_pueblo" etiqueta="Pueblo o comunidad">
                {(p) => <Input {...p} name="sabedora_pueblo" defaultValue={e?.sabedora_pueblo ?? ""} />}
              </Campo>
            </div>
            <Campo id="para_quien" etiqueta="Para quién">
              {(p) => <Input {...p} name="para_quien" defaultValue={e?.para_quien ?? ""} />}
            </Campo>
            <Campo id="temas" etiqueta="Temas" ayuda="Separados por coma.">
              {(p) => <Input {...p} name="temas" defaultValue={e?.temas.join(", ")} />}
            </Campo>
            <Campo id="beneficios" etiqueta="Lo que se lleva el equipo" ayuda="Uno por línea.">
              {(p) => <Textarea {...p} name="beneficios" rows={3} className={`${p.className} min-h-28`} defaultValue={e?.beneficios.join("\n")} />}
            </Campo>
            <Campo id="momentos" etiqueta="Momentos" ayuda="Uno por línea, así: «Apertura: tejemos juntos el primer punto».">
              {(p) => (
                <Textarea
                  {...p}
                  name="momentos"
                  rows={4}
                  defaultValue={e?.momentos.map((m) => `${m.titulo}: ${m.descripcion}`).join("\n")}
                />
              )}
            </Campo>
            <fieldset>
              <legend className="mb-3 text-lg font-bold">Formatos</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {(["territorio", "sede"] as const).map((f) => (
                  <label key={f} className="flex min-h-tap items-center gap-3 text-lg">
                    <input type="checkbox" name="formatos" value={f} defaultChecked={e ? e.formatos.includes(f) : true} className="size-6 accent-[var(--color-primary)]" />
                    {TEXTO_FORMATO[f]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-6 sm:grid-cols-2">
              <Campo id="lugar" etiqueta="Lugar (si es en el territorio)">
                {(p) => <Input {...p} name="lugar" defaultValue={e?.lugar ?? ""} />}
              </Campo>
              <Campo id="duracion" etiqueta="Duración" ayuda="Por ejemplo: 3 horas.">
                {(p) => <Input {...p} name="duracion" defaultValue={e?.duracion ?? ""} />}
              </Campo>
              <Campo id="grupo_min" etiqueta="Grupo mínimo">
                {(p) => <Input {...p} name="grupo_min" inputMode="numeric" defaultValue={e?.grupo_min ?? ""} />}
              </Campo>
              <Campo id="grupo_max" etiqueta="Grupo máximo">
                {(p) => <Input {...p} name="grupo_max" inputMode="numeric" defaultValue={e?.grupo_max ?? ""} />}
              </Campo>
              <Campo id="precio_desde" etiqueta="Precio desde (pesos)">
                {(p) => <Input {...p} name="precio_desde" inputMode="numeric" defaultValue={e?.precio_desde ?? ""} />}
              </Campo>
              <Campo id="porcentaje_sabedora" etiqueta="% para la sabedora">
                {(p) => <Input {...p} name="porcentaje_sabedora" inputMode="numeric" defaultValue={e?.porcentaje_sabedora ?? ""} />}
              </Campo>
            </div>
            <Campo id="testimonio" etiqueta="Testimonio (opcional)">
              {(p) => <Textarea {...p} name="testimonio" rows={3} className={`${p.className} min-h-28`} defaultValue={e?.testimonio ?? ""} />}
            </Campo>
            <AprobacionCasilla aprobada={Boolean(e?.aprobada_por_sabedora_en)} />
          </div>
        </BotonAccion>
      </Pantalla>
    </div>
  );
}

// Casilla sin JavaScript: el valor viaja en el formulario al guardar.
function AprobacionCasilla({ aprobada }: { aprobada: boolean }) {
  return (
    <label className="flex min-h-action items-start gap-3 rounded-md border-2 border-border p-4 has-[:checked]:border-text has-[:checked]:bg-surface-strong">
      <input type="checkbox" name="aprobada" value="si" defaultChecked={aprobada} className="mt-1 size-6 shrink-0 accent-[var(--color-primary)]" />
      <span className="flex flex-col gap-1">
        <span className="text-lg font-bold">La sabedora o el sabedor aprobó cómo aparece</span>
        <span className="text-base text-text-muted">Sin esta aprobación no se puede publicar.</span>
      </span>
    </label>
  );
}
