"use client";

import { Opcion } from "@/components/ui/opcion";
import {
  AYUDA_HOGAR,
  AYUDA_INGRESOS,
  HOGARES,
  PREGUNTA_HOGAR,
  PREGUNTA_INGRESOS,
  SITUACIONES,
  type Hogar,
  type SituacionIngresos,
} from "@/lib/ingresos";

// Pensión o subsidio: opcional y solo para avisarle a la persona. Si elige Colombia Mayor, se
// pregunta con quién vive, porque cambia el tope de ingresos del subsidio.
export function PreguntaIngresos({
  situacion,
  hogar,
  onSituacion,
  onHogar,
  prefijo = "ingresos",
}: {
  situacion: SituacionIngresos | "";
  hogar: Hogar | "";
  onSituacion: (v: SituacionIngresos) => void;
  onHogar: (v: Hogar) => void;
  prefijo?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-bold">{PREGUNTA_INGRESOS}</legend>
        <p className="mb-2 text-text-muted">{AYUDA_INGRESOS}</p>
        {SITUACIONES.map((s) => (
          <Opcion
            key={s.valor}
            name={`${prefijo}-situacion`}
            value={s.valor}
            checked={situacion === s.valor}
            onChange={() => onSituacion(s.valor)}
            titulo={s.titulo}
          />
        ))}
      </fieldset>
      {situacion === "colombia_mayor" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-lg font-bold">{PREGUNTA_HOGAR}</legend>
          <p className="mb-2 text-text-muted">{AYUDA_HOGAR}</p>
          {HOGARES.map((h) => (
            <Opcion
              key={h.valor}
              name={`${prefijo}-hogar`}
              value={h.valor}
              checked={hogar === h.valor}
              onChange={() => onHogar(h.valor)}
              titulo={h.titulo}
            />
          ))}
        </fieldset>
      )}
    </div>
  );
}
