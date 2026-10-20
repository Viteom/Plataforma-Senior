import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { experienciaEjemplo as exp } from "@/lib/demo";

export const metadata: Metadata = { title: "Experiencias" };

export default function EquipoExperiencias() {
  return (
    <Pantalla titulo="Experiencias" intro="Se publican solo cuando la sabedora aprobó cómo aparece.">
      <Button className="self-start">
        <Plus aria-hidden />
        Crear experiencia
      </Button>

      <section aria-labelledby="catalogo" className="flex flex-col gap-3">
        <h2 id="catalogo" className="text-xl">
          Catálogo
        </h2>
        <div className="flex flex-col gap-2 rounded-md border-2 border-border-subtle p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg">{exp.nombre}</h3>
            <span className="rounded-sm border-2 border-dashed border-border px-2 text-sm font-bold">Borrador</span>
          </div>
          <p className="text-text-muted">
            Faltan: nombre y pueblo de la tejedora, duración, grupo, precio, momentos y testimonio.
          </p>
        </div>
      </section>

      <section aria-labelledby="solicitudes" className="flex flex-col gap-3">
        <h2 id="solicitudes" className="text-xl">
          Solicitudes de cotización
        </h2>
        <p className="text-text-muted">Ninguna por ahora.</p>
      </section>

      <Pendiente hito={5}>Crear, publicar, cotizar y registrar el impacto.</Pendiente>
    </Pantalla>
  );
}
