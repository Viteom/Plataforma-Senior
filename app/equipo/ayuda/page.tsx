import { MessageSquareWarning } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { ayudaYAvisos } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";

import { atenderSolicitud, avisadoPorLlamada } from "../acciones";

export const metadata: Metadata = { title: "Solicitudes de ayuda" };

const CANAL: Record<string, string> = {
  chat: "Chat",
  llamada: "Llámame",
  boton: "Botón de ayuda",
  seguimiento_aviso: "Sin respuesta a un aviso",
  orientacion_tarifa: "Orientación de tarifa",
  borrar_cuenta: "Borrar cuenta",
  conexion_abierta: "Conexión abierta",
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

export default async function EquipoAyuda() {
  const { solicitudes, avisos } = await ayudaYAvisos();

  return (
    <Pantalla titulo="Solicitudes de ayuda" intro="Lo que la plataforma pasó a una persona del equipo.">
      <section aria-labelledby="solicitudes" className="flex flex-col gap-4">
        <h2 id="solicitudes" className="text-xl">
          Abiertas ({solicitudes.length})
        </h2>
        {solicitudes.length ? (
          <ul className="flex flex-col gap-3">
            {solicitudes.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base text-text-muted">
                    {CANAL[s.canal] ?? s.canal} · {fecha(s.creado_en)}
                  </p>
                  <p className="text-lg font-bold">{s.motivo}</p>
                </div>
                <BotonAccion accion={atenderSolicitud} campos={{ id: s.id }} texto="Marcar atendida" variant="secundario" size="normal" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No hay solicitudes abiertas.</p>
        )}
      </section>

      <section id="avisos" aria-labelledby="titulo-avisos" className="flex scroll-mt-6 flex-col gap-4">
        <h2 id="titulo-avisos" className="text-xl">
          Avisos por dar ({avisos.length})
        </h2>
        <p className="flex items-start gap-3 rounded-md bg-surface p-4">
          <MessageSquareWarning aria-hidden className="mt-0.5 size-6 shrink-0" />
          El envío automático de SMS está apagado (es de pago). Llama a estas personas para contarles que tienen una
          oportunidad nueva, sin decir el nombre de la empresa, y anótalo.
        </p>
        {avisos.length ? (
          <ul className="flex flex-col gap-3">
            {avisos.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-bold">{a.persona}</p>
                  <p className="text-base text-text-muted">
                    {a.motivo_omitido ?? "Oportunidad nueva"} · {fecha(a.creado_en)}
                  </p>
                </div>
                <BotonAccion accion={avisadoPorLlamada} campos={{ id: a.id }} texto="Ya le avisé por llamada" variant="secundario" size="normal" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No hay avisos pendientes.</p>
        )}
      </section>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
