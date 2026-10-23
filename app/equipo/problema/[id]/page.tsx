import { AlertTriangle, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { necesidadParaCurar } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";
import { etiquetaForma, pesos } from "@/lib/formas";

import { calcularPropuestos } from "../../acciones";
import { ElegirPropuestos } from "./elegir";

export const metadata: Metadata = { title: "Curar búsqueda" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ESTADO_PERSONA: Record<string, string> = {
  enviada_talento: "Enviada: esperando respuesta",
  visible_empresa: "Le interesa",
  descarta: "No le interesa",
  abierta: "Conexión abierta",
  cerrada: "Cerrada",
  pausada: "En pausa",
};

export default async function CurarProblema({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const datos = await necesidadParaCurar(id);
  if (!datos) notFound();
  const { necesidad, empresa, propuestas } = datos;
  const enCola = propuestas.filter((p) => p.estado === "propuesta");
  const enviadas = propuestas.filter((p) => p.estado !== "propuesta");

  return (
    <Pantalla
      titulo={`Búsqueda de ${empresa.nombre}`}
      antesDelTitulo={
        <Link href="/equipo" className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline-offset-4 hover:underline">
          <ArrowLeft aria-hidden className="size-5" />
          Panel
        </Link>
      }
      intro={`«${necesidad.problema}»`}
    >
      {!empresa.verificada && (
        <p role="status" className="flex items-start gap-3 rounded-md border-2 border-danger p-4">
          <AlertTriangle aria-hidden className="mt-0.5 size-6 shrink-0 text-danger" />
          <span>
            <span className="font-bold">Empresa sin verificar.</span> Puedes preparar la lista, pero no se envía a nadie hasta
            verificarla en{" "}
            <Link href="/equipo/empresas" className="font-bold underline underline-offset-4">
              Empresas
            </Link>
            .
          </span>
        </p>
      )}

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-base text-text-muted">Forma de contratar</dt>
          <dd className="font-bold">{necesidad.formatos.map(etiquetaForma).join(", ") || "Cualquiera"}</dd>
        </div>
        <div>
          <dt className="text-base text-text-muted">Dónde</dt>
          <dd className="font-bold">{[necesidad.modalidad, necesidad.ubicacion].filter(Boolean).join(" · ") || "Sin indicar"}</dd>
        </div>
        <div>
          <dt className="text-base text-text-muted">Presupuesto</dt>
          <dd className="font-bold">{necesidad.presupuesto ? pesos(necesidad.presupuesto) : "Sin indicar"}</dd>
        </div>
        <div>
          <dt className="text-base text-text-muted">Requisitos</dt>
          <dd className="font-bold">
            {necesidad.requisitos.map((r) => `${r.etiqueta}${r.obligatorio ? " (obligatorio)" : ""}`).join(", ") || "Ninguno"}
          </dd>
        </div>
      </dl>

      {necesidad.estado === "en_curaduria" && (
        <section aria-labelledby="propuestos" className="flex flex-col gap-4">
          <h2 id="propuestos" className="text-xl">
            Propuestos
          </h2>
          <BotonAccion
            accion={calcularPropuestos}
            campos={{ need: necesidad.id }}
            texto={enCola.length ? "Volver a calcular" : "Calcular propuestos"}
            textoEnviando="Calculando…"
            variant="secundario"
            className="self-start"
          />
          {enCola.length > 0 ? (
            <ElegirPropuestos need={necesidad.id} propuestas={enCola} />
          ) : (
            <p className="text-text-muted">Calcula el puntaje para ver los 10 mejores perfiles publicados.</p>
          )}
        </section>
      )}

      {enviadas.length > 0 && (
        <section aria-labelledby="enviadas" className="flex flex-col gap-3">
          <h2 id="enviadas" className="text-xl">
            Enviadas
          </h2>
          <ul className="flex flex-col gap-2">
            {enviadas.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-surface px-4 py-3">
                <span className="font-bold">{p.nombre}</span>
                <span>{ESTADO_PERSONA[p.estado] ?? p.estado}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo: el puntaje se calcula de verdad con los perfiles de ejemplo.</p>}
    </Pantalla>
  );
}
