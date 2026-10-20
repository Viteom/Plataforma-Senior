import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";

export const metadata: Metadata = { title: "Curar problema" };

// 10 propuestos por el sistema; el curador elige máximo 5 con una línea de por qué.
const propuestos = Array.from({ length: 10 }, (_, i) => ({
  id: `p${i + 1}`,
  oficio: ["Producción de alimentos", "Calidad e inocuidad", "Mantenimiento industrial", "Gestión de plantas"][i % 4],
  puntaje: 92 - i * 4,
}));

export default function CurarProblema() {
  return (
    <Pantalla
      titulo="Elegir talento para este problema"
      intro="“Abrir una segunda planta y cumplir con INVIMA en 6 meses.” Elija máximo 5 y escriba por qué."
    >
      <form className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-lg font-bold">10 propuestos por el sistema</legend>
          {propuestos.map((p, i) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
              <label className="flex min-h-tap items-center gap-3">
                <input type="checkbox" name="elegidos" value={p.id} defaultChecked={i < 2} className="size-6 accent-[var(--color-primary)]" />
                <span className="flex-1 text-lg font-bold">{p.oficio}</span>
                <span className="text-base">Puntaje {p.puntaje} de 100</span>
              </label>
              {i < 2 && (
                <Campo id={`razon-${p.id}`} etiqueta="Por qué (lo verá la empresa)">
                  {(props) => <Input {...props} />}
                </Campo>
              )}
            </div>
          ))}
        </fieldset>
        <Button type="button" className="self-start">
          Enviar a los elegidos
        </Button>
      </form>
      <Pendiente hito={4}>Puntaje con desglose y envío al talento para su “Me interesa”.</Pendiente>
    </Pantalla>
  );
}
