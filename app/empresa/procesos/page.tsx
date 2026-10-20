import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";

export const metadata: Metadata = { title: "Mis procesos" };

// Estados escritos en palabras: nunca solo un color.
const filas = [
  { que: "Producción de alimentos", tipo: "Conexión", estado: "Esperando respuesta de la persona" },
  { que: "Contabilidad y finanzas", tipo: "Conexión", estado: "Conexión abierta" },
  { que: "Ceremonia del cuidado", tipo: "Experiencia", estado: "Cotización recibida" },
];

export default function Procesos() {
  return (
    <Pantalla titulo="Mis procesos" intro="Conexiones con talento y solicitudes de experiencias.">
      <div className="overflow-x-auto rounded-md border-2 border-border-subtle">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <caption className="sr-only">Procesos en curso (datos de ejemplo)</caption>
          <thead className="bg-surface">
            <tr>
              <th scope="col" className="p-4">Perfil o experiencia</th>
              <th scope="col" className="p-4">Tipo</th>
              <th scope="col" className="p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.que} className="border-t-2 border-border-subtle">
                <th scope="row" className="p-4 font-bold">{f.que}</th>
                <td className="p-4">{f.tipo}</td>
                <td className="p-4">{f.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-base text-text-muted">Datos de ejemplo.</p>
      <Pendiente hito={4}>Estados reales de conexiones y solicitudes.</Pendiente>
    </Pantalla>
  );
}
