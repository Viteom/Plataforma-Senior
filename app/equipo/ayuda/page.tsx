import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";

export const metadata: Metadata = { title: "Solicitudes de ayuda" };

const solicitudes = [
  { canal: "Llámeme", motivo: "No le llega el código", cuando: "Mañana (8 a 12)", estado: "Sin atender" },
  { canal: "Chat", motivo: "Pidió hablar con una persona", cuando: "Hace 20 minutos", estado: "Sin atender" },
  { canal: "Botón de ayuda", motivo: "Duda sobre visibilidad", cuando: "Ayer", estado: "Atendida" },
];

export default function EquipoAyuda() {
  return (
    <Pantalla titulo="Solicitudes de ayuda" intro="Lo que el chat, la llamada o el botón pasaron a una persona.">
      <ul className="flex flex-col gap-3">
        {solicitudes.map((s) => (
          <li key={s.motivo} className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base text-text-muted">
                {s.canal} · {s.cuando}
              </p>
              <p className="text-lg font-bold">{s.motivo}</p>
            </div>
            <span className={s.estado === "Atendida" ? "font-bold" : "rounded-sm bg-primary px-3 py-1 font-bold text-on-primary"}>
              {s.estado}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-base text-text-muted">Datos de ejemplo.</p>
      <Pendiente hito={5}>Atender, asignar y cerrar solicitudes; llamadas escaladas en el hito 6.</Pendiente>
    </Pantalla>
  );
}
