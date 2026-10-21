import type { Metadata } from "next";
import Link from "next/link";

import { EstadoConexion } from "@/components/empresa/estado";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { listarConexiones } from "@/lib/datos/consultas";
import { MODO_DEMO } from "@/lib/demo";

import { cerrarConexion } from "../acciones";

export const metadata: Metadata = { title: "Mis procesos" };

const ESTADO_NECESIDAD = {
  en_curaduria: "Nuestro equipo está eligiendo perfiles",
  enviada: "Enviada a las personas elegidas",
  cerrada: "Cerrada",
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

export default async function Procesos() {
  const { conexiones, perfiles, necesidades } = await listarConexiones();
  const directas = conexiones.filter((c) => c.origen === "exploracion");

  return (
    <Pantalla titulo="Mis procesos" intro="Sus búsquedas por problema y los perfiles que pidió conocer.">
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
            Todavía no ha buscado por un problema.{" "}
            <Link href="/empresa/problema/nuevo" className="font-bold text-text underline underline-offset-4">
              Buscar por un problema
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="directas" className="flex flex-col gap-3">
        <h2 id="directas" className="text-xl">
          Perfiles que pidió conocer
        </h2>
        {directas.length ? (
          <ul className="flex flex-col gap-3">
            {directas.map((c) => {
              const perfil = perfiles.get(c.talent_id);
              const nombre = perfil?.identidad_visible && perfil.nombre ? perfil.nombre : (perfil?.oficio ?? "Perfil");
              return (
                <li key={c.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link href={`/empresa/perfil/${c.talent_id}`} className="text-lg font-bold underline-offset-4 hover:underline">
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
                          <legend className="mb-2 font-bold">¿Cómo le fue con esta persona?</legend>
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
            Todavía no ha pedido conocer a nadie.{" "}
            <Link href="/empresa/explorar" className="font-bold text-text underline underline-offset-4">
              Explorar perfiles
            </Link>
          </p>
        )}
      </section>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
