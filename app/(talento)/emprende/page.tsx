import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Emprende" };

const etapas = ["Tengo una idea", "Ya vendo algo", "Mi negocio ya funciona y quiero crecer"];

export default function Emprende() {
  return (
    <Pantalla
      titulo="Emprende"
      intro="Cuéntenos en qué va su negocio y le mostramos los pasos y cursos que le sirven."
    >
      <ol className="flex flex-col gap-3">
        {etapas.map((e, i) => (
          <li key={e} className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-strong font-bold">
              {i + 1}
            </span>
            {e}
          </li>
        ))}
      </ol>
      <Pendiente hito={5}>Diagnóstico corto y ruta sugerida; puede pedir asesoría.</Pendiente>
      <Button ancho="completo" disabled>
        Empezar el diagnóstico
      </Button>
    </Pantalla>
  );
}
