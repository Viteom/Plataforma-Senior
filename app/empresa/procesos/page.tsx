import type { Metadata } from "next";
import Link from "next/link";

import { TEXTO_SOLICITUD, TEXTO_TIPO } from "@/components/experiencias/textos";
import { AvisoDemo } from "@/components/demo/aviso-demo";
import { Pantalla } from "@/components/layout/pantalla";
import { PasosEmpresa, situacionEmpresa } from "@/components/procesos/pasos-empresa";
import { listarConexiones } from "@/lib/datos/consultas";
import { listarSolicitudes } from "@/lib/datos/experiencias";
import type { ConexionEmpresa, NecesidadVista, PerfilVista } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";
import { pesos } from "@/lib/formas";

export const metadata: Metadata = { title: "Mis procesos" };

const ESTADO_NECESIDAD = {
  en_curaduria: "Nuestro equipo está eligiendo perfiles",
  enviada: "Enviada a las personas elegidas",
  cerrada: "Cerrada",
};

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

// Cada conexión es un proceso: primero lo que te toca a ti, después lo que espera a la persona y
// al final lo cerrado. Es una lista agrupada (no un tablero de arrastrar), que se lee igual en
// celular y con lector de pantalla.
export default async function Procesos() {
  const [{ conexiones, perfiles, necesidades }, solicitudes] = await Promise.all([listarConexiones(), listarSolicitudes()]);
  const conSituacion = conexiones.map((c) => ({ c, s: situacionEmpresa(c) }));
  const grupo = (g: string) => conSituacion.filter(({ s }) => s.grupo === g).map(({ c }) => c);
  const turno = grupo("turno");
  const proceso = grupo("proceso");
  const cerrados = grupo("cerrado");
  const retos = new Map(necesidades.map((n) => [n.id, n]));

  return (
    <Pantalla titulo="Mis procesos" intro="Cómo va cada persona que quieres conocer, tus retos y tus pedidos del campo.">
      <AvisoDemo lado="empresa" />
      {conexiones.length === 0 && (
        <p className="rounded-md bg-surface p-5 text-lg">
          Todavía no tienes procesos.{" "}
          <Link href="/empresa/explorar" className="font-bold underline underline-offset-4">
            Explora perfiles
          </Link>{" "}
          o{" "}
          <Link href="/empresa/problema/nuevo" className="font-bold underline underline-offset-4">
            cuéntanos un reto
          </Link>
          .
        </p>
      )}

      {turno.length > 0 && <Grupo id="te-toca" titulo="Te toca a ti" conexiones={turno} perfiles={perfiles} retos={retos} />}
      {proceso.length > 0 && <Grupo id="en-proceso" titulo="En proceso" conexiones={proceso} perfiles={perfiles} retos={retos} />}

      <section aria-labelledby="busquedas" className="flex flex-col gap-3">
        <h2 id="busquedas" className="text-xl">
          Tus retos
        </h2>
        {necesidades.length ? (
          <ul className="flex flex-col gap-3">
            {necesidades.map((n) => {
              const suyas = conSituacion.filter(({ c }) => c.need_id === n.id);
              const teToca = suyas.filter(({ s }) => s.grupo === "turno").length;
              return (
                <li key={n.id}>
                  <Link
                    href={`/empresa/problema/${n.id}`}
                    className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4 transition-colors duration-150 hover:border-text"
                  >
                    <span className="line-clamp-2 text-lg font-bold">{n.problema}</span>
                    <span className="text-base text-text-muted">
                      {ESTADO_NECESIDAD[n.estado]} · {fecha(n.creado_en)}
                    </span>
                    {suyas.length > 0 && (
                      <span className="text-base font-bold">
                        {suyas.length} {suyas.length === 1 ? "persona" : "personas"}
                        {teToca > 0 && ` · ${teToca} ${teToca === 1 ? "espera" : "esperan"} tu respuesta`}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-text-muted">
            Todavía no has contado un reto.{" "}
            <Link href="/empresa/problema/nuevo" className="font-bold text-text underline underline-offset-4">
              Contar un reto
            </Link>
          </p>
        )}
      </section>

      {cerrados.length > 0 && (
        <details>
          <summary className="inline-flex min-h-tap items-center text-xl font-bold underline underline-offset-4">
            Cerrados ({cerrados.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {cerrados.map((c) => {
              const s = situacionEmpresa(c);
              return (
                <li key={c.id} className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4">
                  <p className="font-bold">{nombreDe(perfiles.get(c.talent_id))}</p>
                  <p>{s.titulo}</p>
                  {s.detalle && <p className="text-base text-text-muted">{s.detalle}</p>}
                </li>
              );
            })}
          </ul>
        </details>
      )}

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

function nombreDe(perfil: PerfilVista | undefined) {
  return perfil?.identidad_visible && perfil.nombre ? perfil.nombre : (perfil?.oficio ?? "Perfil");
}

function Grupo({
  id,
  titulo,
  conexiones,
  perfiles,
  retos,
}: {
  id: string;
  titulo: string;
  conexiones: ConexionEmpresa[];
  perfiles: Map<string, PerfilVista>;
  retos: Map<string, NecesidadVista>;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-xl">
        {titulo}
      </h2>
      <ul className="flex flex-col gap-5">
        {conexiones.map((c) => {
          const reto = c.need_id ? retos.get(c.need_id) : undefined;
          return (
            <li key={c.id}>
              <article className="flex flex-col gap-4 rounded-lg border-2 border-border-subtle p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xl">
                    <Link href={`/empresa/perfil/${c.talent_id}`} className="underline underline-offset-4">
                      {nombreDe(perfiles.get(c.talent_id))}
                    </Link>
                  </h3>
                  <p className="line-clamp-2 text-base text-text-muted">
                    {reto ? `Por tu reto: «${reto.problema}»` : "Desde Explorar perfiles"}
                  </p>
                </div>
                <PasosEmpresa c={c} />
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
