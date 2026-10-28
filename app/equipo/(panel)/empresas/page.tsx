import { BadgeCheck, ExternalLink, PauseCircle } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input } from "@/components/ui/campo";
import { empresasYReportes } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";

import { resolverReporte, verificarEmpresa } from "../acciones";

export const metadata: Metadata = { title: "Organizaciones y reportes" };

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

export default async function Empresas() {
  const { empresas, reportes } = await empresasYReportes();
  const porVerificar = empresas.filter((e) => !e.verificada);
  const verificadas = empresas.filter((e) => e.verificada);
  const abiertos = reportes.filter((r) => r.estado === "abierto");

  return (
    <Pantalla
      titulo="Organizaciones y reportes"
      intro="Ninguna organización llega al talento sin verificar su NIT. Revísalo en el RUES antes de marcarla."
    >
      <section aria-labelledby="verificar" className="flex flex-col gap-4">
        <h2 id="verificar" className="text-xl">
          Por verificar ({porVerificar.length})
        </h2>
        <a
          href="https://www.rues.org.co/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4"
        >
          Abrir el RUES
          <ExternalLink aria-hidden className="size-5" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
        {porVerificar.length ? (
          <ul className="flex flex-col gap-4">
            {porVerificar.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
                <div>
                  <p className="text-lg font-bold">{e.nombre}</p>
                  <p className="text-text-muted">
                    NIT {e.nit ?? "sin dato"} · {e.ciudad ?? "sin ciudad"} · Contacto: {e.contacto ?? "sin dato"}
                  </p>
                </div>
                <BotonAccion accion={verificarEmpresa} campos={{ id: e.id }} texto="Marcar como verificada" className="max-w-xl">
                  <Campo id={`fuente-${e.id}`} etiqueta="¿Dónde lo verificaste?" ayuda="Por ejemplo: RUES, matrícula activa, mismo NIT y nombre.">
                    {(p) => <Input {...p} name="fuente" defaultValue="RUES: " />}
                  </Campo>
                </BotonAccion>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No hay organizaciones esperando verificación.</p>
        )}
      </section>

      <section aria-labelledby="reportes" className="flex flex-col gap-4">
        <h2 id="reportes" className="text-xl">
          Reportes abiertos ({abiertos.length})
        </h2>
        <p className="text-text-muted">Revisa en máximo 2 días hábiles. Con dos reportes confirmados, la organización queda en pausa para todo el talento.</p>
        {abiertos.length ? (
          <ul className="flex flex-col gap-4">
            {abiertos.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
                <p className="text-lg font-bold">{r.empresa}</p>
                <p>«{r.motivo}»</p>
                <p className="text-base text-text-muted">Reportado el {fecha(r.creado_en)}</p>
                <div className="flex flex-wrap gap-3">
                  <BotonAccion accion={resolverReporte} campos={{ id: r.id, decision: "confirmado" }} texto="Confirmar reporte" size="normal" />
                  <BotonAccion accion={resolverReporte} campos={{ id: r.id, decision: "descartado" }} texto="Descartar" variant="secundario" size="normal" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No hay reportes abiertos.</p>
        )}
      </section>

      {verificadas.length > 0 && (
        <section aria-labelledby="verificadas" className="flex flex-col gap-3">
          <h2 id="verificadas" className="text-xl">
            Verificadas
          </h2>
          <ul className="flex flex-col gap-2">
            {verificadas.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-4 py-3">
                <span className="font-bold">{e.nombre}</span>
                <span className="inline-flex items-center gap-2">
                  {e.estado === "pausada" ? <PauseCircle aria-hidden className="size-5" /> : <BadgeCheck aria-hidden className="size-5" />}
                  {e.estado === "pausada" ? "En pausa" : "Verificada"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
