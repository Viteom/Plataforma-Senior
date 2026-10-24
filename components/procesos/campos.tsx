import { Campo, Input, Textarea } from "@/components/ui/campo";
import { formasContratar } from "@/lib/formas";
import { MOTIVOS_NO_SEGUIR, type DatosProceso, type Lado } from "@/lib/procesos";
import { hoyColombia, MODOS_CONVERSACION, UNIDADES_ACUERDO } from "@/lib/procesos-formularios";

// Campos de los formularios del proceso. Sin estado propio: funcionan dentro de BotonAccion.

const opcion =
  "flex min-h-tap items-center gap-3 rounded-md border-2 border-border px-4 py-2 has-[:checked]:border-text has-[:checked]:bg-surface-strong has-[:checked]:font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus";
const radio = "size-5 shrink-0 accent-[var(--color-primary)] focus-visible:outline-none";
const select = "min-h-action";

export function Calificacion({ pregunta }: { pregunta: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-lg font-bold">{pregunta}</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`${opcion} min-w-tap justify-center`}>
            <input type="radio" name="evaluacion" value={n} required className={radio} />
            {n}
          </label>
        ))}
      </div>
      <p className="mt-2 text-base text-text-muted">1 es muy mal, 5 es excelente.</p>
    </fieldset>
  );
}

export function Motivos({ lado }: { lado: Lado }) {
  return (
    <fieldset>
      <legend className="mb-2 text-lg font-bold">¿Por qué?</legend>
      <div className="flex flex-col gap-2">
        {MOTIVOS_NO_SEGUIR[lado].map((m) => (
          <label key={m} className={opcion}>
            <input type="radio" name="motivo" value={m} required className={radio} />
            {m}
          </label>
        ))}
      </div>
      <p className="mt-2 text-base text-text-muted">
        {lado === "empresa" ? "Se lo contamos a la persona con cuidado." : "La organización no ve tu motivo."}
      </p>
    </fieldset>
  );
}

export function CamposAgenda({ id }: { id: string }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id={`dia-${id}`} etiqueta="Día">
          {(p) => <Input {...p} type="date" name="dia" min={hoyColombia()} required />}
        </Campo>
        <Campo id={`hora-${id}`} etiqueta="Hora">
          {(p) => <Input {...p} type="time" name="hora" min="07:00" max="19:00" step={900} required />}
        </Campo>
      </div>
      <fieldset>
        <legend className="mb-2 text-lg font-bold">¿Cómo van a conversar?</legend>
        <div className="flex flex-wrap gap-2">
          {MODOS_CONVERSACION.map((m) => (
            <label key={m.valor} className={opcion}>
              <input type="radio" name="modo" value={m.valor} required className={radio} />
              {m.etiqueta}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

export function CamposAcuerdo({ id, previo }: { id: string; previo?: DatosProceso }) {
  return (
    <>
      <Campo id={`forma-${id}`} etiqueta="Cómo van a trabajar">
        {(p) => (
          <select {...p} name="forma" required defaultValue={previo?.acuerdo_forma ?? ""} className={`${p.className} ${select}`}>
            <option value="" disabled>
              Elige una forma
            </option>
            {formasContratar.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.etiqueta}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <Campo id={`horas-${id}`} etiqueta="Horas a la semana" ayuda="Si aplica.">
        {(p) => (
          <Input {...p} type="number" name="horas" min={1} max={60} inputMode="numeric" defaultValue={previo?.acuerdo_horas_semana ?? undefined} />
        )}
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id={`valor-${id}`} etiqueta="Valor en pesos" ayuda="En Kánna el trabajo siempre se paga.">
          {(p) => (
            <Input {...p} name="valor" inputMode="numeric" required placeholder="3.000.000" defaultValue={previo?.acuerdo_valor ? String(previo.acuerdo_valor) : undefined} />
          )}
        </Campo>
        <Campo id={`unidad-${id}`} etiqueta="El valor es">
          {(p) => (
            <select {...p} name="unidad" required defaultValue={previo?.acuerdo_unidad ?? ""} className={`${p.className} ${select}`}>
              <option value="" disabled>
                Elige
              </option>
              {UNIDADES_ACUERDO.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.etiqueta}
                </option>
              ))}
            </select>
          )}
        </Campo>
      </div>
      <Campo id={`inicio-${id}`} etiqueta="Fecha de inicio" ayuda="Si ya la saben.">
        {(p) => <Input {...p} type="date" name="inicio" min={hoyColombia()} defaultValue={previo?.acuerdo_inicio ?? undefined} />}
      </Campo>
      <Campo id={`nota-${id}`} etiqueta="Qué van a lograr" ayuda="En pocas palabras. Sin teléfonos ni correos.">
        {(p) => <Textarea {...p} name="nota" rows={3} maxLength={300} className={`${p.className} min-h-28`} defaultValue={previo?.acuerdo_nota ?? undefined} />}
      </Campo>
    </>
  );
}
