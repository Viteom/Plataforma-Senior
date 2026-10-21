import { ExternalLink, FileText, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input } from "@/components/ui/campo";
import { evidenciasYTarifas } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";
import { formasContratar, pesos, textoUnidad, unidadPorDefecto } from "@/lib/formas";

import { guardarGuia, revisarEvidencia } from "../acciones";

export const metadata: Metadata = { title: "Evidencias y tarifas" };

const UNIDADES = ["hora", "conversacion", "mes", "proyecto", "persona"];

export default async function Evidencias() {
  const { evidencias, guias } = await evidenciasYTarifas();

  return (
    <Pantalla titulo="Evidencias y tarifas" intro="Lo que respalda la experiencia de cada persona, y los rangos de referencia para cobrar.">
      <section aria-labelledby="pendientes" className="flex flex-col gap-4">
        <h2 id="pendientes" className="text-xl">
          Por revisar ({evidencias.length})
        </h2>
        <p className="text-text-muted">
          La nota que escriba la verá la empresa: una línea sobre lo que confirmó, sin edad, años ni fechas. El nombre y el
          teléfono de una referencia nunca salen del equipo.
        </p>
        {evidencias.length ? (
          <ul className="flex flex-col gap-4">
            {evidencias.map((e) => (
              <li key={e.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
                <p className="text-base text-text-muted">De {e.persona}</p>
                {e.tipo === "referencia" ? (
                  <p className="flex items-start gap-3">
                    <Phone aria-hidden className="mt-0.5 size-6 shrink-0" />
                    <span>
                      <span className="font-bold">{e.referencia_nombre}</span> · {e.referencia_telefono}
                      <br />
                      {e.descripcion}
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-3">
                    <FileText aria-hidden className="mt-0.5 size-6 shrink-0" />
                    <span>
                      <span className="font-bold">{e.descripcion}</span>
                      {e.enlace && (
                        <>
                          {" · "}
                          <a href={e.enlace} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline underline-offset-4">
                            Ver archivo <ExternalLink aria-hidden className="size-4" />
                            <span className="sr-only">(se abre en otra pestaña)</span>
                          </a>
                        </>
                      )}
                    </span>
                  </p>
                )}
                <BotonAccion accion={revisarEvidencia} campos={{ id: e.id, decision: "verificada" }} texto="Verificar" className="max-w-xl">
                  <Campo
                    id={`nota-${e.id}`}
                    etiqueta="Lo que confirmó (lo verá la empresa)"
                    ayuda={e.tipo === "referencia" ? "Ej.: Confirmó que lideró la certificación de la planta." : "Ej.: Certificado de buenas prácticas de manufactura."}
                  >
                    {(p) => <Input {...p} name="nota" maxLength={200} />}
                  </Campo>
                </BotonAccion>
                <BotonAccion accion={revisarEvidencia} campos={{ id: e.id, decision: "rechazada" }} texto="No se pudo verificar" variant="secundario" size="normal" className="self-start" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">No hay evidencias esperando.</p>
        )}
      </section>

      <section aria-labelledby="guia" className="flex flex-col gap-4">
        <h2 id="guia" className="text-xl">
          Guía de tarifas
        </h2>
        <p className="text-text-muted">El talento ve este rango al poner su tarifa. Mientras esté vacío, la pantalla le ofrece la orientación del equipo.</p>
        <ul className="flex flex-col gap-4">
          {formasContratar.map(({ valor, etiqueta }) => {
            const g = guias[valor];
            return (
              <li key={valor} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg">{etiqueta}</h3>
                  <span className="text-base">
                    {g ? `${pesos(g.minimo)} a ${pesos(g.maximo)} ${textoUnidad(g.unidad)}` : "Sin rango todavía"}
                  </span>
                </div>
                <details>
                  <summary className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
                    {g ? "Cambiar rango" : "Definir rango"}
                  </summary>
                  <BotonAccion accion={guardarGuia} campos={{ tipo: valor }} texto="Guardar rango" className="mt-3 max-w-xl">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo id={`min-${valor}`} etiqueta="Mínimo (pesos)">
                        {(p) => <Input {...p} name="minimo" inputMode="numeric" defaultValue={g?.minimo ?? ""} />}
                      </Campo>
                      <Campo id={`max-${valor}`} etiqueta="Máximo (pesos)">
                        {(p) => <Input {...p} name="maximo" inputMode="numeric" defaultValue={g?.maximo ?? ""} />}
                      </Campo>
                    </div>
                    <Campo id={`unidad-${valor}`} etiqueta="Unidad">
                      {(p) => (
                        <select {...p} name="unidad" defaultValue={g?.unidad ?? unidadPorDefecto[valor]} className={`${p.className} min-h-action`}>
                          {UNIDADES.map((u) => (
                            <option key={u} value={u}>
                              {textoUnidad(u)}
                            </option>
                          ))}
                        </select>
                      )}
                    </Campo>
                    <Campo id={`fuente-${valor}`} etiqueta="¿De dónde sale?" ayuda="Por ejemplo: encuesta a 10 empresas del piloto, octubre de 2026.">
                      {(p) => <Input {...p} name="fuente" defaultValue={g?.fuente ?? ""} />}
                    </Campo>
                  </BotonAccion>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
