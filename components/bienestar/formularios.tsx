"use client";
import { useActionState } from "react";
import { guardarMetas, registrarSeguimiento } from "@/app/(talento)/bienestar/acciones";
import { Campo, Input } from "@/components/ui/campo";
import { Button } from "@/components/ui/button";
export function FormularioMetas({ horas, ingreso }: { horas?: number; ingreso?: number | null }) {
  const [r, action, pending] = useActionState(guardarMetas, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Campo
        id="horas-meta"
        etiqueta="Tu límite personal de horas a la semana"
        ayuda="Cuenta todos tus trabajos. Cero significa que quieres hacer una pausa."
      >
        {(p) => <Input {...p} name="horas" type="number" min={0} max={48} defaultValue={horas} required />}
      </Campo>
      <Campo id="ingreso-meta" etiqueta="Meta de ingreso semanal en pesos (opcional)">
        {(p) => (
          <Input {...p} name="ingreso" type="number" min={0} max={1000000000} defaultValue={ingreso ?? undefined} />
        )}
      </Campo>
      <label className="flex min-h-tap items-center gap-3">
        <input name="consentimiento" value="si" type="checkbox" required className="size-6" />
        Autorizo guardar mis metas y seguimientos para revisión privada del equipo. Solo podrán contactarme por un
        seguimiento si marco el permiso correspondiente. Las organizaciones no reciben mis respuestas.
      </label>
      {r.error && <p role="alert">{r.error}</p>}
      {r.aviso && <p role="status">{r.aviso}</p>}
      <Button disabled={pending}>Guardar mis metas</Button>
    </form>
  );
}
export function FormularioSeguimiento({ procesos }: { procesos: { id: string; empresa: string }[] }) {
  const [r, action, pending] = useActionState(registrarSeguimiento, {});
  const clase = "min-h-action rounded-sm border-2 border-border bg-bg px-3";
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        ¿Qué proceso quieres revisar?
        <select name="conexion" className={clase}>
          <option value="">Mi bienestar en general</option>
          {procesos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.empresa}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        ¿Cómo te sientes con tu ritmo?
        <select name="energia" required defaultValue="" className={clase}>
          <option value="" disabled>
            Elige una respuesta
          </option>
          <option value="bien">Me siento bien</option>
          <option value="ajustar">Quiero ajustar mi carga</option>
          <option value="pausa">Necesito una pausa</option>
        </select>
      </label>
      <label className="flex flex-col gap-2">
        ¿Te han tratado con respeto?
        <select name="trato" required defaultValue="" className={clase}>
          <option value="" disabled>
            Elige una respuesta
          </option>
          <option value="si">Sí</option>
          <option value="no">No</option>
        </select>
      </label>
      <label className="flex flex-col gap-2">
        ¿Recibiste el pago acordado a tiempo?
        <select name="pago" required defaultValue="" className={clase}>
          <option value="" disabled>
            Elige una respuesta
          </option>
          <option value="si">Sí</option>
          <option value="no">No</option>
          <option value="pendiente">Todavía no corresponde</option>
        </select>
      </label>
      <label className="flex min-h-tap items-center gap-3">
        <input type="checkbox" name="contacto" value="si" className="size-6" />
        Quiero que el equipo me contacte.
      </label>
      {r.error && <p role="alert">{r.error}</p>}
      {r.aviso && <p role="status">{r.aviso}</p>}
      <p>
        Si necesitas una pausa o reportas problemas de trato o pago, el equipo revisará tu respuesta de forma privada.
        Marcar la casilla autoriza que te contacte por este seguimiento.
      </p>
      <Button disabled={pending}>Guardar seguimiento</Button>
    </form>
  );
}
