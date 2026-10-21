import { Campo, Input } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { etiquetaForma, pesos, textoUnidad, unidadPorDefecto, type FormaContratar, type GuiaTarifa } from "@/lib/formas";

type PropsTarifas = {
  formas: FormaContratar[];
  guias: GuiaTarifa[];
  tarifas: Record<string, string>;
  onTarifa: (forma: FormaContratar, valor: string) => void;
  orientacion: boolean;
  onOrientacion: (v: boolean) => void;
  error?: string;
};

// Guía de tarifas (A5). Sin rangos definidos, lo dice y ofrece la orientación del equipo.
export function Tarifas({ formas, guias, tarifas, onTarifa, orientacion, onOrientacion, error }: PropsTarifas) {
  return (
    <fieldset className="flex flex-col gap-5 rounded-lg bg-surface p-5">
      <legend className="sr-only">Cuánto cobrar</legend>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg">¿Cuánto quiere cobrar? (opcional)</h3>
        <p className="text-base text-text-muted">Las empresas ven un rango, no el número exacto.</p>
      </div>
      {formas.map((forma) => {
        const guia = guias.find((g) => g.tipo === forma);
        const unidad = textoUnidad(guia?.unidad ?? unidadPorDefecto[forma]);
        const etiqueta = etiquetaForma(forma);
        return (
          <Campo
            key={forma}
            id={`tarifa-${forma}`}
            etiqueta={`${etiqueta}: pesos ${unidad}`}
            ayuda={
              guia
                ? `Referencia: entre ${pesos(guia.minimo)} y ${pesos(guia.maximo)} ${unidad}.`
                : "Todavía estamos definiendo rangos de referencia."
            }
          >
            {(p) => (
              <>
                <Input
                  {...p}
                  value={tarifas[forma] ?? ""}
                  onChange={(e) => onTarifa(forma, e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="Solo números"
                  className={`${p.className} max-w-64`}
                />
                {/* La cifra con puntos de mil, para leerla sin contar ceros. */}
                {Number(tarifas[forma]) > 0 && (
                  <p className="text-base font-bold">
                    {pesos(Number(tarifas[forma]))} {unidad}
                  </p>
                )}
              </>
            )}
          </Campo>
        );
      })}
      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
      <Opcion
        tipo="checkbox"
        name="orientacion"
        value="si"
        checked={orientacion}
        onChange={() => onOrientacion(!orientacion)}
        titulo="Prefiero que el equipo me oriente sobre cuánto cobrar"
        descripcion="Alguien del equipo le llama o le escribe."
        className="bg-bg"
      />
    </fieldset>
  );
}
