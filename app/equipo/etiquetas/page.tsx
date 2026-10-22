import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { nombreCapaEmpresa } from "@/lib/capas";
import { etiquetasPorRevisar } from "@/lib/datos/equipo";

import { revisarEtiqueta } from "../acciones";

export const metadata: Metadata = { title: "Etiquetas nuevas" };

export default async function EtiquetasNuevas() {
  const etiquetas = await etiquetasPorRevisar();

  return (
    <Pantalla
      titulo="Etiquetas nuevas"
      intro="Lo que las personas escribieron con sus palabras. Las empresas no lo ven hasta que usted lo aprueba."
    >
      <p className="text-text-muted">
        Quite las que tengan teléfonos, correos, edad, fechas o algo que no sea experiencia. «Sumar a la lista» la deja como
        opción para todas las personas y cuenta en el puntaje.
      </p>
      {etiquetas.length ? (
        <ul className="flex flex-col gap-4">
          {etiquetas.map((t) => (
            <li key={t.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
              <p className="text-base text-text-muted">
                {nombreCapaEmpresa[t.capa]}
                {t.oficio && ` · de alguien que trabaja en ${t.oficio}`}
              </p>
              <p className="text-lg font-bold">{t.etiqueta}</p>
              <div className="flex flex-wrap gap-3">
                <BotonAccion accion={revisarEtiqueta} campos={{ id: t.id, decision: "sumar" }} texto="Aprobar y sumar a la lista" size="normal" />
                <BotonAccion accion={revisarEtiqueta} campos={{ id: t.id, decision: "aprobar" }} texto="Aprobar solo aquí" variant="secundario" size="normal" />
                <BotonAccion accion={revisarEtiqueta} campos={{ id: t.id, decision: "quitar" }} texto="Quitar" variant="suave" size="normal" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">No hay etiquetas esperando.</p>
      )}
    </Pantalla>
  );
}
