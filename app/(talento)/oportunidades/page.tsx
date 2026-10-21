import { BadgeCheck, Flag, Handshake, MapPin, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Textarea } from "@/components/ui/campo";
import { listarOportunidades } from "@/lib/datos/consultas";
import type { Oportunidad } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";
import { etiquetaForma } from "@/lib/formas";

import { meInteresa, noMeInteresa, reportarEmpresa } from "./acciones";

export const metadata: Metadata = { title: "Oportunidades" };

const ESTADO: Record<string, string> = {
  visible_empresa: "Usted dijo que le interesa. Esperamos a la empresa.",
  abierta: "Conexión abierta: nuestro equipo les pone en contacto.",
  cerrada: "Terminada.",
  descarta: "Usted dijo que no le interesa.",
  pausada: "En pausa mientras revisamos un reporte.",
};

export default async function Oportunidades() {
  const oportunidades = await listarOportunidades();
  const nuevas = oportunidades.filter((o) => o.estado === "enviada_talento");
  const anteriores = oportunidades.filter((o) => o.estado !== "enviada_talento");

  return (
    <Pantalla titulo="Oportunidades" intro="Empresas que necesitan algo parecido a lo que usted ya resolvió.">
      {/* Aviso antifraude fijo (regla 9). */}
      <p className="flex items-start gap-3 rounded-md border-2 border-text p-4">
        <ShieldAlert aria-hidden className="mt-0.5 size-6 shrink-0" />
        <span>
          <span className="font-bold">Nadie de la plataforma ni de una empresa le va a pedir dinero</span>, códigos,
          contraseñas, ni pagos por «exámenes», «aportes a salud y pensión» o cursos. Si alguien lo hace, repórtelo.
        </span>
      </p>

      {oportunidades.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-5 py-10 text-center">
          <Handshake aria-hidden className="size-12" />
          <h2 className="text-xl">Todavía no hay oportunidades</h2>
          <p className="max-w-prose text-text-muted">Cuando una empresa le busque, le avisamos por mensaje de texto.</p>
        </div>
      )}

      {nuevas.length > 0 && (
        <section aria-labelledby="nuevas" className="flex flex-col gap-4">
          <h2 id="nuevas" className="text-xl">
            Nuevas
          </h2>
          <ul className="flex flex-col gap-5">
            {nuevas.map((o) => (
              <li key={o.id}>
                <TarjetaOportunidad o={o} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {anteriores.length > 0 && (
        <section aria-labelledby="anteriores" className="flex flex-col gap-4">
          <h2 id="anteriores" className="text-xl">
            Anteriores
          </h2>
          <ul className="flex flex-col gap-3">
            {anteriores.map((o) => (
              <li key={o.id} className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4">
                <p className="font-bold">{o.empresa}</p>
                <p>{ESTADO[o.estado] ?? ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}

function TarjetaOportunidad({ o }: { o: Oportunidad }) {
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

      <p className="text-lg">
        {o.problema ? `«${o.problema}»` : "Vio su perfil y quiere conocerle."}
      </p>
      {o.formatos && o.formatos.length > 0 && (
        <p className="text-base">Busca: {o.formatos.map(etiquetaForma).join(", ")}</p>
      )}

      <BotonAccion accion={meInteresa} campos={{ conexion: o.id }} texto="Me interesa" ancho="completo" />
      <BotonAccion accion={noMeInteresa} campos={{ conexion: o.id }} texto="No me interesa" variant="secundario" ancho="completo" />

      <details>
        <summary className="inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4">
          <Flag aria-hidden className="size-5" />
          Reportar esta empresa
        </summary>
        <BotonAccion accion={reportarEmpresa} campos={{ conexion: o.id }} texto="Enviar reporte" variant="secundario" className="mt-3">
          <Campo id={`motivo-${o.id}`} etiqueta="¿Qué pasó?" ayuda="Por ejemplo: me pidieron plata o mis datos del banco.">
            {(p) => <Textarea {...p} name="motivo" rows={3} className={`${p.className} min-h-28`} />}
          </Campo>
        </BotonAccion>
      </details>
    </article>
  );
}
