import type { Metadata } from "next";
import Link from "next/link";

import { EstadoConexion } from "@/components/empresa/estado";
import { TEXTO_SOLICITUD, TEXTO_TIPO } from "@/components/experiencias/textos";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { listarConexiones } from "@/lib/datos/consultas";
import { listarSolicitudes } from "@/lib/datos/experiencias";
import { MODO_DEMO } from "@/lib/demo";
import { pesos } from "@/lib/formas";

import { cerrarConexion } from "../acciones";

export const metadata: Metadata = { title: "Mis procesos" };

const ESTADO_NECESIDAD = {
  en_curaduria: "Nuestro equipo está eligiendo perfiles",
  enviada: "Enviada a las personas elegidas",
  cerrada: "Cerrada",
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

export default async function Procesos() {
  const [{ conexiones, perfiles, necesidades }, solicitudes] = await Promise.all([listarConexiones(), listarSolicitudes()]);
  const directas = conexiones.filter((c) => c.origen === "exploracion");

  return (
    <Pantalla titulo="Mis procesos" intro="Tus búsquedas, los perfiles que pediste conocer y tus pedidos del campo.">
      <section aria-labelledby="busquedas" className="flex flex-col gap-3">
        <h2 id="busquedas" className="text-xl">
          Búsquedas por problema
        </h2>
        {necesidades.length ? (
          <ul className="flex flex-col gap-3">
            {necesidades.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/empresa/problema/${n.id}`}
                  className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4 transition-colors duration-150 hover:border-text"
                >
                  <span className="line-clamp-2 text-lg font-bold">{n.problema}</span>
                  <span className="text-base text-text-muted">
                    {ESTADO_NECESIDAD[n.estado]} · {fecha(n.creado_en)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">
            Todavía no has buscado por un problema.{" "}
            <Link href="/empresa/problema/nuevo" className="font-bold text-text underline underline-offset-4">
              Buscar por un problema
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="directas" className="flex flex-col gap-3">
        <h2 id="directas" className="text-xl">
          Perfiles que pediste conocer
        </h2>
        {directas.length ? (
          <ul className="flex flex-col gap-3">
            {directas.map((c) => {
              const perfil = perfiles.get(c.talent_id);
              const nombre = perfil?.identidad_visible && perfil.nombre ? perfil.nombre : (perfil?.oficio ?? "Perfil");
              return (
                <li key={c.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/empresa/perfil/${c.talent_id}`} className="inline-flex min-h-tap items-center text-lg font-bold underline underline-offset-4">
                      {nombre}
                    </Link>
                    <span className="text-base text-text-muted">{fecha(c.actualizado_en)}</span>
                  </div>
                  <EstadoConexion estado={c.estado} />
                  {c.estado === "abierta" && (
                    <details>
                      <summary className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
                        Terminar y calificar
                      </summary>
                      <BotonAccion accion={cerrarConexion} campos={{ conexion: c.id }} texto="Cerrar conexión" variant="secundario" className="mt-3">
                        <fieldset>
                          <legend className="mb-2 font-bold">¿Cómo te fue con esta persona?</legend>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <label key={n} className="flex min-h-tap min-w-tap items-center justify-center gap-2 rounded-md border-2 border-border px-3 has-[:checked]:border-text has-[:checked]:bg-surface-strong has-[:checked]:font-bold">
                                <input type="radio" name="evaluacion" value={n} className="size-5 accent-[var(--color-primary)]" />
                                {n}
                              </label>
                            ))}
                          </div>
                          <p className="mt-2 text-base text-text-muted">1 es muy mal, 5 es excelente.</p>
                        </fieldset>
                      </BotonAccion>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-text-muted">
            Todavía no has pedido conocer a nadie.{" "}
            <Link href="/empresa/explorar" className="font-bold text-text underline underline-offset-4">
              Explorar perfiles
            </Link>
          </p>
        )}
      </section>
      <section aria-labelledby="experiencias" className="flex flex-col gap-3">
        <h2 id="experiencias" className="text-xl">
          Talento del campo
        </h2>
        {solicitudes.length ? (
          <ul className="flex flex-col gap-3">
            {solicitudes.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 rounded-md border-2 border-border-subtle p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-lg font-bold">{s.experiencia}</span>
                  <span className="text-base text-text-muted">{fecha(s.creado_en)}</span>
                </div>
                <p className="text-base">
                  {TEXTO_TIPO[s.tipo].formato[s.formato]} · {s.personas} {TEXTO_TIPO[s.tipo].unidad} · {s.mes}
                </p>
                <p className="font-bold">{TEXTO_SOLICITUD[s.estado]}</p>
                {s.valor_cotizado !== null && <p>Valor cotizado: {pesos(s.valor_cotizado)}</p>}
                {s.impacto && (
                  <div className="rounded-md bg-surface p-4">
                    <p className="font-bold">Reporte de impacto</p>
                    <p>
                      {s.tipo === "oficio"
                        ? `${s.impacto.personas_impactadas} personas del territorio trabajaron ${s.impacto.horas} horas en tu pedido y recibieron ${pesos(s.impacto.pago_persona)}.`
                        : `${s.impacto.personas_impactadas} personas de tu equipo participaron durante ${s.impacto.horas} horas. La sabedora o el sabedor recibió ${pesos(s.impacto.pago_persona)}.`}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">
            Todavía no has pedido un taller ni un oficio por encargo.{" "}
            <Link href="/empresa/campo" className="font-bold text-text underline underline-offset-4">
              Ver Talento del campo
            </Link>
          </p>
        )}
      </section>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
