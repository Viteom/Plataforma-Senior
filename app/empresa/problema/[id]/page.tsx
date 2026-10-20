import { Check } from "lucide-react";
import type { Metadata } from "next";

import { TarjetaPerfil } from "@/components/empresa/tarjeta-perfil";
import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { perfilesEjemplo } from "@/lib/demo";

export const metadata: Metadata = { title: "Talento sugerido" };

// Desglose de ejemplo de "Coincide con su problema" (componentes del matching v1).
const coincidencias = ["Situaciones vividas", "Normas: INVIMA", "Formato y disponibilidad"];

export default function TalentoSugerido() {
  return (
    <Pantalla
      titulo="Talento sugerido"
      intro="“Abrir una segunda planta y cumplir con INVIMA en 6 meses.” Estas personas ya vieron su propuesta y les interesa."
    >
      <ul className="flex flex-col gap-6">
        {perfilesEjemplo.slice(0, 2).map((p) => (
          <li key={p.id} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <TarjetaPerfil perfil={p} />
            <div className="flex flex-col gap-3 rounded-md bg-surface p-5">
              <h3 className="text-lg">Coincide con su problema</h3>
              <ul className="flex flex-col gap-2">
                {coincidencias.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-1 size-5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="text-base text-text-muted">
                <span className="font-bold text-text">Nota del equipo:</span> lideró una
                certificación parecida en una planta de tamaño similar.
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-base text-text-muted">Datos de ejemplo.</p>
      <Pendiente hito={4}>Puntaje real, desglose y nota del curador.</Pendiente>
    </Pantalla>
  );
}
