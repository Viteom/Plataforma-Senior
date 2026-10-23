import { BadgeCheck, Clock, PauseCircle } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { obtenerMiEmpresa } from "@/lib/datos/consultas";

import { FormularioEmpresa } from "./formulario";

export const metadata: Metadata = { title: "Mi empresa" };

export default async function MiEmpresa() {
  const empresa = await obtenerMiEmpresa();

  if (!empresa) {
    return (
      <div className="max-w-2xl">
        <Pantalla
          titulo="Registra tu empresa"
          intro="Lo necesitamos para que las personas sepan quién las busca. Verificamos el NIT en el RUES antes de que puedas pedir conexiones."
        >
          <FormularioEmpresa />
        </Pantalla>
      </div>
    );
  }

  const estado = empresa.estado === "pausada"
    ? { icono: PauseCircle, texto: "En pausa mientras revisamos un reporte. Escríbenos desde Ayuda." }
    : empresa.verificada
      ? { icono: BadgeCheck, texto: "Verificada. Puedes pedir conocer perfiles." }
      : { icono: Clock, texto: "En verificación. Revisamos el NIT en el RUES; te escribimos cuando quede lista." };
  const Icono = estado.icono;

  return (
    <div className="max-w-2xl">
      <Pantalla titulo={empresa.nombre} intro={empresa.nit ? `NIT ${empresa.nit}` : undefined}>
        <p className="flex items-start gap-3 rounded-md bg-surface p-4 text-lg">
          <Icono aria-hidden className="mt-0.5 size-6 shrink-0" />
          {estado.texto}
        </p>
      </Pantalla>
    </div>
  );
}
