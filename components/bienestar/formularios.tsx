"use client";
import { useActionState, useState } from "react";
import { guardarMetas, pedirOrientacionMetas, registrarSeguimiento } from "@/app/(talento)/bienestar/acciones";
import { Campo, Input } from "@/components/ui/campo";
import { Button } from "@/components/ui/button";
import { pesos } from "@/lib/formas";

// Metas y ritmo: para qué sirven, atajos de horas y una cuenta sencilla para la meta de ingreso.
// La tarifa por hora del perfil (si la puso) llena la cuenta; lo que escriba aquí no cambia su perfil.
const ATAJOS_HORAS = [
  { horas: 0, texto: "Pausa" },
  { horas: 10, texto: "Pocas horas" },
  { horas: 20, texto: "Medio tiempo" },
  { horas: 30, texto: "Casi completo" },
];

export function FormularioMetas({
  horas,
  ingreso,
  tarifaHora,
}: {
  horas?: number;
  ingreso?: number | null;
  tarifaHora?: number | null;
}) {
  const [r, action, pending] = useActionState(guardarMetas, {});
  const [orientacion, pedir, pidiendo] = useActionState(pedirOrientacionMetas, {});
  const [horasMeta, setHorasMeta] = useState(horas != null ? String(horas) : "");
  const [ingresoMeta, setIngresoMeta] = useState(ingreso != null ? String(ingreso) : "");
  const [porHora, setPorHora] = useState(tarifaHora ? String(tarifaHora) : "");
  const estimado = Number(horasMeta) * Number(porHora);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
        <p className="font-bold">¿Para qué sirve esto?</p>
        <ul className="flex list-disc flex-col gap-1 pl-6">
          <li>
            <b>Tu límite de horas</b> es lo máximo que quieres trabajar a la semana, sumando todo. Si un acuerdo nuevo te
            pasa de ese límite, Kánna te avisa antes de que lo aceptes.
          </li>
          <li>
            <b>Tu meta de ingreso</b> es solo para ti: te mostramos cuánto suman tus acuerdos frente a ella.
          </li>
          <li>Ninguna organización ve estos números. Puedes cambiarlos cuando quieras.</li>
        </ul>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <Campo
          id="horas-meta"
          etiqueta="Tu límite personal de horas a la semana"
          ayuda="Cuenta todos tus trabajos, también los de fuera de Kánna. Cero significa que quieres hacer una pausa."
        >
          {(p) => (
            <div className="flex flex-col gap-3">
              <div role="group" aria-label="Atajos de horas" className="flex flex-wrap gap-2">
                {ATAJOS_HORAS.map((a) => (
                  <button
                    key={a.horas}
                    type="button"
                    aria-pressed={horasMeta === String(a.horas)}
                    onClick={() => setHorasMeta(String(a.horas))}
                    className="min-h-tap rounded-full border-2 border-border px-4 text-base aria-pressed:border-text aria-pressed:bg-surface-strong aria-pressed:font-bold"
                  >
                    {a.texto} · {a.horas} h
                  </button>
                ))}
              </div>
              <Input
                {...p}
                name="horas"
                type="number"
                inputMode="numeric"
                min={0}
                max={48}
                value={horasMeta}
                onChange={(e) => setHorasMeta(e.target.value)}
                required
                className={`${p.className} max-w-40`}
              />
            </div>
          )}
        </Campo>

        <Campo id="ingreso-meta" etiqueta="Meta de ingreso semanal en pesos (opcional)">
          {(p) => (
            <div className="flex flex-col gap-3">
              <Input
                {...p}
                name="ingreso"
                type="number"
                inputMode="numeric"
                min={0}
                max={1000000000}
                value={ingresoMeta}
                onChange={(e) => setIngresoMeta(e.target.value)}
                className={`${p.className} max-w-64`}
              />
              {Number(ingresoMeta) > 0 && <p className="text-base font-bold">{pesos(Number(ingresoMeta))} a la semana</p>}
            </div>
          )}
        </Campo>

        <div className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
          <p className="font-bold">¿No sabes qué meta poner? Haz la cuenta</p>
          <label htmlFor="por-hora" className="text-base">
            ¿Cuánto cobras por una hora de trabajo?
          </label>
          <Input
            id="por-hora"
            type="number"
            inputMode="numeric"
            min={0}
            value={porHora}
            onChange={(e) => setPorHora(e.target.value)}
            className="max-w-64 rounded-sm border-2 border-border bg-bg px-4 text-base"
          />
          {estimado > 0 ? (
            <>
              <p>
                {horasMeta} horas × {pesos(Number(porHora))} = <b>{pesos(estimado)} a la semana</b>
              </p>
              <Button
                type="button"
                variant="secundario"
                size="normal"
                className="self-start"
                onClick={() => setIngresoMeta(String(estimado))}
              >
                Usar {pesos(estimado)} como meta
              </Button>
            </>
          ) : (
            <p className="text-base text-text-muted">Escribe tus horas y lo que cobras por hora, y te mostramos el total.</p>
          )}
        </div>

        <label className="flex min-h-tap items-start gap-3">
          <input name="consentimiento" value="si" type="checkbox" required className="mt-1 size-6 shrink-0" />
          Autorizo guardar mis metas y seguimientos para revisión privada del equipo. Solo podrán contactarme por un
          seguimiento si marco el permiso correspondiente. Las organizaciones no reciben mis respuestas.
        </label>
        {r.error && (
          <p role="alert" className="font-bold text-danger">
            {r.error}
          </p>
        )}
        {r.aviso && (
          <p role="status" className="font-bold">
            {r.aviso}
          </p>
        )}
        <Button disabled={pending}>Guardar mis metas</Button>
      </form>

      <form action={pedir} className="flex flex-col gap-2">
        <p className="text-base text-text-muted">
          ¿Prefieres que alguien te ayude a definir cuánto cobrar, cuántas horas o qué meta poner?
        </p>
        {orientacion.aviso ? (
          <p role="status" className="font-bold">
            {orientacion.aviso}
          </p>
        ) : (
          <Button variant="suave" size="normal" className="self-start" disabled={pidiendo}>
            {pidiendo ? "Enviando…" : "Quiero que el equipo me oriente"}
          </Button>
        )}
        {orientacion.error && (
          <p role="alert" className="font-bold text-danger">
            {orientacion.error}
          </p>
        )}
      </form>
    </div>
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
