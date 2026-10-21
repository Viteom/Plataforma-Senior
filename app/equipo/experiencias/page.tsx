import { CircleCheck, CircleDashed, PauseCircle, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TEXTO_FORMATO, TEXTO_SOLICITUD } from "@/components/experiencias/textos";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { listarExperiencias, listarSolicitudes } from "@/lib/datos/experiencias";
import type { SolicitudExperiencia } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";
import { pesos } from "@/lib/formas";

import { avanzarSolicitud, cambiarEstadoExperiencia, registrarImpacto } from "../acciones";

export const metadata: Metadata = { title: "Experiencias" };

const ESTADO = {
  borrador: { icono: CircleDashed, texto: "Borrador" },
  publicada: { icono: CircleCheck, texto: "Publicada" },
  pausada: { icono: PauseCircle, texto: "En pausa" },
};

export default async function EquipoExperiencias() {
  const [experiencias, solicitudes] = await Promise.all([listarExperiencias(), listarSolicitudes()]);

  return (
    <Pantalla titulo="Experiencias" intro="Se publican solo cuando la sabedora o el sabedor aprobó cómo aparece.">
      <Button asChild className="self-start">
        <Link href="/equipo/experiencias/nueva">
          <Plus aria-hidden />
          Crear experiencia
        </Link>
      </Button>

      <section aria-labelledby="catalogo" className="flex flex-col gap-3">
        <h2 id="catalogo" className="text-xl">
          Catálogo
        </h2>
        <ul className="flex flex-col gap-3">
          {experiencias.map((e) => {
            const { icono: Icono, texto } = ESTADO[e.estado];
            const faltan = [
              !e.sabedora_nombre && "sabedora",
              !e.duracion && "duración",
              !e.grupo_max && "grupo",
              !e.precio_desde && "precio",
              !e.momentos.length && "momentos",
              !e.testimonio && "testimonio",
              !e.aprobada_por_sabedora_en && "aprobación de la sabedora",
            ].filter(Boolean);
            return (
              <li key={e.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg">{e.nombre}</h3>
                  <span className="inline-flex items-center gap-2 font-bold">
                    <Icono aria-hidden className="size-5" />
                    {texto}
                  </span>
                </div>
                {faltan.length > 0 && <p className="text-text-muted">Falta: {faltan.join(", ")}.</p>}
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="secundario" size="normal">
                    <Link href={`/equipo/experiencias/${e.id}`}>
                      <Pencil aria-hidden />
                      Editar
                    </Link>
                  </Button>
                  {e.estado !== "publicada" ? (
                    <BotonAccion accion={cambiarEstadoExperiencia} campos={{ id: e.id, estado: "publicada" }} texto="Publicar" variant="secundario" size="normal" />
                  ) : (
                    <BotonAccion accion={cambiarEstadoExperiencia} campos={{ id: e.id, estado: "pausada" }} texto="Pausar" variant="secundario" size="normal" />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="solicitudes" className="flex flex-col gap-3">
        <h2 id="solicitudes" className="text-xl">
          Solicitudes de cotización
        </h2>
        <p className="text-text-muted">
          El correo automático está apagado: avise a la empresa por correo o teléfono cuando cotice o confirme.
        </p>
        {solicitudes.length ? (
          <ul className="flex flex-col gap-4">
            {solicitudes.map((s) => (
              <li key={s.id}>
                <Solicitud s={s} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">Ninguna por ahora.</p>
        )}
      </section>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}

function Solicitud({ s }: { s: SolicitudExperiencia }) {
  return (
    <article className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
      <div>
        <p className="text-lg font-bold">
          {s.empresa} · {s.experiencia}
        </p>
        <p>
          {TEXTO_FORMATO[s.formato]} · {s.personas} personas · {s.mes}
        </p>
        {s.nota && <p className="text-text-muted">«{s.nota}»</p>}
      </div>
      <p className="font-bold">
        {TEXTO_SOLICITUD[s.estado]}
        {s.valor_cotizado !== null && ` · ${pesos(s.valor_cotizado)}`}
      </p>

      {s.estado === "recibida" && (
        <BotonAccion accion={avanzarSolicitud} campos={{ id: s.id, actual: s.estado }} texto="Guardar cotización" size="normal" className="max-w-md">
          <Campo id={`valor-${s.id}`} etiqueta="Valor cotizado (pesos)">
            {(p) => <Input {...p} name="valor" inputMode="numeric" />}
          </Campo>
        </BotonAccion>
      )}
      {s.estado === "cotizada" && (
        <BotonAccion accion={avanzarSolicitud} campos={{ id: s.id, actual: s.estado }} texto="La empresa confirmó" variant="secundario" size="normal" className="self-start" />
      )}
      {s.estado === "confirmada" && (
        <BotonAccion accion={avanzarSolicitud} campos={{ id: s.id, actual: s.estado }} texto="Ya se realizó" variant="secundario" size="normal" className="self-start" />
      )}
      {s.estado === "realizada" && (
        <BotonAccion accion={registrarImpacto} campos={{ id: s.id }} texto="Registrar impacto y enviar reporte" size="normal" className="max-w-xl">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id={`personas-${s.id}`} etiqueta="Personas">
              {(p) => <Input {...p} name="personas" inputMode="numeric" defaultValue={s.personas} />}
            </Campo>
            <Campo id={`horas-${s.id}`} etiqueta="Horas">
              {(p) => <Input {...p} name="horas" inputMode="decimal" />}
            </Campo>
            <Campo id={`pago-${s.id}`} etiqueta="Pago a la sabedora">
              {(p) => <Input {...p} name="pago" inputMode="numeric" />}
            </Campo>
          </div>
          <Campo id={`notas-${s.id}`} etiqueta="Notas (opcional)">
            {(p) => <Input {...p} name="notas" />}
          </Campo>
        </BotonAccion>
      )}
      {s.impacto && (
        <p className="rounded-md bg-surface p-4">
          {s.impacto.personas_impactadas} personas · {s.impacto.horas} horas · {pesos(s.impacto.pago_persona)} para la sabedora
        </p>
      )}
    </article>
  );
}
