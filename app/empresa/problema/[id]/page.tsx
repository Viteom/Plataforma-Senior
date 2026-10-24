import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Desglose } from "@/components/empresa/estado";
import { TarjetaPerfil } from "@/components/empresa/tarjeta-perfil";
import { Pantalla } from "@/components/layout/pantalla";
import { PasosEmpresa } from "@/components/procesos/pasos-empresa";
import { obtenerNecesidad } from "@/lib/datos/consultas";
import { MODO_DEMO } from "@/lib/demo";
import { etiquetaForma } from "@/lib/formas";

export const metadata: Metadata = { title: "Talento sugerido" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TalentoSugerido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const datos = await obtenerNecesidad(id);
  if (!datos) notFound();
  const { necesidad, conexiones, perfiles } = datos;

  return (
    <Pantalla
      titulo="Talento sugerido"
      antesDelTitulo={
        <Link href="/empresa/procesos" className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline-offset-4 hover:underline">
          <ArrowLeft aria-hidden className="size-5" />
          Mis procesos
        </Link>
      }
      intro={`«${necesidad.problema}»`}
    >
      <div className="flex flex-wrap gap-2">
        {necesidad.formatos.map((f) => (
          <span key={f} className="rounded-sm bg-surface-strong px-2 py-1 text-sm font-bold">
            {etiquetaForma(f)}
          </span>
        ))}
        {necesidad.requisitos.map((r) => (
          <span key={r.etiqueta} className="rounded-sm border-2 border-border-subtle px-2 py-1 text-sm">
            {r.etiqueta} {r.obligatorio ? "(obligatorio)" : "(deseable)"}
          </span>
        ))}
      </div>

      {necesidad.estado === "en_curaduria" && (
        <p className="flex items-start gap-3 rounded-md bg-surface p-5 text-lg">
          <Clock aria-hidden className="mt-1 size-6 shrink-0" />
          Nuestro equipo está eligiendo hasta 5 perfiles para tu reto. Cuando una persona diga que le interesa, aparece
          aquí.
        </p>
      )}

      {necesidad.estado !== "en_curaduria" && !conexiones.length && (
        <p className="rounded-md bg-surface p-5 text-lg">
          Enviamos tu reto a las personas elegidas. Aparecerán aquí cuando digan que les interesa.
        </p>
      )}

      <ul className="flex flex-col gap-6">
        {conexiones.map((c) => {
          const perfil = perfiles.get(c.talent_id);
          if (!perfil) return null;
          return (
            <li key={c.id} className="grid gap-4 lg:grid-cols-[1fr_22rem]">
              <TarjetaPerfil perfil={perfil} />
              <div className="flex flex-col gap-4 rounded-md bg-surface p-5">
                {c.puntaje !== null && (
                  <p className="text-lg">
                    <span className="font-bold">Coincide {Math.round(c.puntaje)} %</span> con tu reto
                  </p>
                )}
                {c.desglose && <Desglose desglose={c.desglose} />}
                {c.razon_curador && (
                  <p className="text-base">
                    <span className="font-bold">Nota del equipo:</span> {c.razon_curador}
                  </p>
                )}
                <PasosEmpresa c={c} />
              </div>
            </li>
          );
        })}
      </ul>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
