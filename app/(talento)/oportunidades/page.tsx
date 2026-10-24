import { BadgeCheck, Flag, Handshake, MapPin, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Calificacion, Motivos } from "@/components/procesos/campos";
import { CuadroSituacion, LineaProceso } from "@/components/procesos/linea";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Textarea } from "@/components/ui/campo";
import { listarOportunidades } from "@/lib/datos/consultas";
import type { Oportunidad } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";
import { etiquetaForma } from "@/lib/formas";
import { situacion, type Situacion } from "@/lib/procesos";

import {
  aceptarAcuerdo,
  ajustarAcuerdo,
  calificar,
  confirmarFecha,
  meInteresa,
  noMeInteresa,
  noSeguir,
  otraFecha,
  reportarEmpresa,
  terminar,
} from "./acciones";

export const metadata: Metadata = { title: "Oportunidades" };

const enlace = "inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4";

export default async function Oportunidades() {
  const oportunidades = (await listarOportunidades()).map((o) => ({
    o,
    s: situacion({ ...o, evaluacion_propia: o.evaluacion_talento }, "talento"),
  }));
  const grupo = (g: Situacion["grupo"]) => oportunidades.filter(({ s }) => s.grupo === g);
  const turno = grupo("turno");
  const proceso = grupo("proceso");
  const cerradas = grupo("cerrado");

  return (
    <Pantalla titulo="Oportunidades" intro="Aquí ves cómo va cada una y qué sigue.">
      {/* Aviso antifraude fijo (regla 9). */}
      <p className="flex items-start gap-3 rounded-md border-2 border-text p-4">
        <ShieldAlert aria-hidden className="mt-0.5 size-6 shrink-0" />
        <span>
          <span className="font-bold">Nadie de Kánna ni de una empresa te va a pedir dinero</span>, códigos,
          contraseñas, ni pagos por «exámenes», «aportes a salud y pensión» o cursos. Si alguien lo hace, repórtalo.
        </span>
      </p>

      {oportunidades.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-5 py-10 text-center">
          <Handshake aria-hidden className="size-12" />
          <h2 className="text-xl">Todavía no hay oportunidades</h2>
          <p className="max-w-prose text-text-muted">Cuando una empresa te busque, te avisamos por mensaje de texto.</p>
        </div>
      )}

      {turno.length > 0 && (
        <section aria-labelledby="te-toca" className="flex flex-col gap-4">
          <h2 id="te-toca" className="text-xl">
            Te toca a ti
          </h2>
          <ul className="flex flex-col gap-5">
            {turno.map(({ o, s }) => (
              <li key={o.id}>
                <TarjetaProceso o={o} s={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {proceso.length > 0 && (
        <section aria-labelledby="en-proceso" className="flex flex-col gap-4">
          <h2 id="en-proceso" className="text-xl">
            En proceso
          </h2>
          <ul className="flex flex-col gap-5">
            {proceso.map(({ o, s }) => (
              <li key={o.id}>
                <TarjetaProceso o={o} s={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {cerradas.length > 0 && (
        <section aria-labelledby="terminadas" className="flex flex-col gap-4">
          <h2 id="terminadas" className="text-xl">
            Terminadas
          </h2>
          <ul className="flex flex-col gap-3">
            {cerradas.map(({ o, s }) => (
              <li key={o.id} className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4">
                <p className="font-bold">{o.empresa}</p>
                <p>{s.titulo}</p>
                {s.detalle && <p className="text-base text-text-muted">{s.detalle}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}

function TarjetaProceso({ o, s }: { o: Oportunidad; s: Situacion }) {
  const campos = { conexion: o.id };
  const nueva = o.estado === "enviada_talento";
  const abierta = ["abierta", "conversacion", "acuerdo", "en_curso"].includes(o.estado);

  return (
    <article className="flex flex-col gap-4 rounded-lg border-2 border-border-subtle p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl">{o.empresa}</h3>
        {o.empresa_verificada && (
          <p className="flex items-center gap-2 font-bold">
            <BadgeCheck aria-hidden className="size-5" />
            Empresa verificada
          </p>
        )}
        {(o.sector || o.ciudad) && (
          <p className="flex items-center gap-1 text-base text-text-muted">
            <MapPin aria-hidden className="size-4" />
            {[o.sector, o.ciudad].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {(nueva || o.problema) && (
        <p className="text-lg">{o.problema ? `«${o.problema}»` : "Vio tu perfil y quiere conocerte."}</p>
      )}
      {nueva && o.formatos && o.formatos.length > 0 && <p className="text-base">Busca: {o.formatos.map(etiquetaForma).join(", ")}</p>}

      {s.etapa && <LineaProceso etapa={s.etapa} />}
      <CuadroSituacion s={s} lado="talento" />
      {o.estado === "acuerdo" && o.acuerdo_nota && (
        <p className="text-base">
          <span className="font-bold">Lo que van a lograr:</span> {o.acuerdo_nota}
        </p>
      )}

      {nueva && (
        <>
          <BotonAccion accion={meInteresa} campos={campos} texto="Me interesa" ancho="completo" />
          <BotonAccion accion={noMeInteresa} campos={campos} texto="No me interesa" variant="secundario" ancho="completo" />
        </>
      )}
      {o.estado === "conversacion" && !o.conversacion_confirmada && (
        <>
          <BotonAccion accion={confirmarFecha} campos={campos} texto="Sí, me sirve" ancho="completo" />
          <BotonAccion accion={otraFecha} campos={campos} texto="Necesito otra fecha" variant="secundario" ancho="completo" />
        </>
      )}
      {o.estado === "acuerdo" && (
        <>
          <BotonAccion accion={aceptarAcuerdo} campos={campos} texto="Acepto el acuerdo" ancho="completo" />
          <BotonAccion accion={ajustarAcuerdo} campos={campos} texto="Quiero ajustarlo" variant="secundario" ancho="completo" />
        </>
      )}
      {o.estado === "en_curso" && (
        <details>
          <summary className={enlace}>Ya terminamos</summary>
          <BotonAccion accion={terminar} campos={campos} texto="Marcar como terminado" variant="secundario" className="mt-3">
            <Calificacion pregunta="¿Cómo te fue con esta organización?" />
          </BotonAccion>
        </details>
      )}
      {o.estado === "cerrada" && o.cierre_tipo === "terminado" && !o.evaluacion_talento && (
        <BotonAccion accion={calificar} campos={campos} texto="Enviar calificación">
          <Calificacion pregunta="¿Cómo te fue con esta organización?" />
        </BotonAccion>
      )}

      {abierta && (
        <details>
          <summary className={enlace}>No quiero seguir</summary>
          <BotonAccion accion={noSeguir} campos={campos} texto="Cerrar este proceso" variant="secundario" className="mt-3">
            <Motivos lado="talento" />
          </BotonAccion>
        </details>
      )}
      {(nueva || abierta) && (
        <details>
          <summary className={enlace}>
            <Flag aria-hidden className="size-5" />
            Reportar esta empresa
          </summary>
          <BotonAccion accion={reportarEmpresa} campos={campos} texto="Enviar reporte" variant="secundario" className="mt-3">
            <Campo id={`motivo-${o.id}`} etiqueta="¿Qué pasó?" ayuda="Por ejemplo: me pidieron plata o mis datos del banco.">
              {(p) => <Textarea {...p} name="motivo" rows={3} className={`${p.className} min-h-28`} />}
            </Campo>
          </BotonAccion>
        </details>
      )}
    </article>
  );
}
