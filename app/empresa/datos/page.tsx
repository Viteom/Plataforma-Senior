import { BadgeCheck, Clock, PauseCircle } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";
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

  const detalle = MODO_DEMO
    ? null
    : (
        await (await crearClienteServidor())
          .from("companies")
          .select(
            "sector, ciudad, contacto, cargo_contacto, correo_contacto, telefono_contacto, descripcion, sitio_web, brandbook_url",
          )
          .eq("id", empresa.id)
          .single()
      ).data;
  const estado =
    empresa.estado === "pausada"
      ? {
          icono: PauseCircle,
          texto: "En pausa mientras revisamos un reporte. Escríbenos desde Ayuda.",
        }
      : empresa.verificada
        ? {
            icono: BadgeCheck,
            texto: "Verificada. Puedes pedir conocer perfiles.",
          }
        : {
            icono: Clock,
            texto: "En verificación. Revisamos el NIT en el RUES; te escribimos cuando quede lista.",
          };
  const Icono = estado.icono;

  return (
    <div className="max-w-2xl">
      <Pantalla titulo={empresa.nombre} intro={empresa.nit ? `NIT ${empresa.nit}` : undefined}>
        <p className="flex items-start gap-3 rounded-md bg-surface p-4 text-lg">
          <Icono aria-hidden className="mt-0.5 size-6 shrink-0" />
          {estado.texto}
        </p>
        {detalle && (
          <dl className="grid gap-4">
            {Object.entries(detalle)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="font-bold">
                    {
                      (
                        {
                          sector: "Sector",
                          ciudad: "Ciudad",
                          contacto: "Contacto",
                          cargo_contacto: "Cargo",
                          correo_contacto: "Correo",
                          telefono_contacto: "Teléfono",
                          descripcion: "Actividad",
                          sitio_web: "Sitio web",
                          brandbook_url: "Manual de marca",
                        } as Record<string, string>
                      )[k]
                    }
                  </dt>
                  <dd className="break-words">{String(v)}</dd>
                </div>
              ))}
          </dl>
        )}
        <p>Para corregir datos de una organización verificada, contacta al equipo desde Ayuda.</p>
      </Pantalla>
    </div>
  );
}
