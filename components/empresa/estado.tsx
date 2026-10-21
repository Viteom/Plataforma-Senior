import { Building2, Check, Clock, PauseCircle, X } from "lucide-react";
import Link from "next/link";

import type { EstadoEmpresa, MiEmpresa } from "@/lib/datos/tipos";

// Estados escritos en palabras, con ícono: nunca solo un color.
export const TEXTO_ESTADO: Record<EstadoEmpresa, string> = {
  esperando: "Esperando respuesta de la persona",
  no_disponible: "La persona no está disponible por ahora",
  le_interesa: "Le interesa: usted decide si quiere conocerla",
  abierta: "Conexión abierta: les ponemos en contacto",
  cerrada: "Cerrada",
  pausada: "En pausa",
};

const ICONO: Record<EstadoEmpresa, typeof Check> = {
  esperando: Clock,
  no_disponible: X,
  le_interesa: Check,
  abierta: Check,
  cerrada: Check,
  pausada: PauseCircle,
};

export function EstadoConexion({ estado }: { estado: EstadoEmpresa }) {
  const Icono = ICONO[estado];
  return (
    <span className="inline-flex items-center gap-2 font-bold">
      <Icono aria-hidden className="size-5 shrink-0" />
      {TEXTO_ESTADO[estado]}
    </span>
  );
}

// Aviso según la situación de la empresa: sin registrar, en verificación o en pausa (regla 9).
export function AvisoEmpresa({ empresa }: { empresa: MiEmpresa | null }) {
  if (empresa && empresa.verificada && empresa.estado === "activa") return null;
  const texto = !empresa
    ? "Para pedir conocer perfiles, primero registre los datos de su empresa."
    : empresa.estado === "pausada"
      ? "Su empresa está en pausa mientras revisamos un reporte. Puede explorar, pero no pedir conexiones."
      : "Estamos verificando su empresa en el RUES. Mientras tanto puede explorar perfiles.";
  return (
    <div role="status" className="flex flex-wrap items-start gap-3 rounded-md border-2 border-border p-4">
      <Building2 aria-hidden className="mt-0.5 size-6 shrink-0" />
      <p className="flex-1">{texto}</p>
      {!empresa && (
        <Link href="/empresa/datos" className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
          Registrar mi empresa
        </Link>
      )}
    </div>
  );
}

const NOMBRES_DESGLOSE: Record<string, string> = {
  situaciones: "Situaciones que ha resuelto",
  oficio_normas: "Oficio y normas",
  contexto_escala: "Contexto y tamaño",
  formato: "Forma de contratar",
  evidencia: "Respaldos verificados",
  ubicacion: "Ubicación",
  economica: "Dentro del presupuesto",
};

// "Coincide con su problema": cada componente con barra y porcentaje escrito.
export function Desglose({ desglose }: { desglose: Record<string, number> }) {
  const filas = Object.entries(desglose).filter(([k]) => NOMBRES_DESGLOSE[k]);
  return (
    <dl className="flex flex-col gap-3">
      {filas.map(([k, v]) => {
        const pct = Math.round(v * 100);
        return (
          <div key={k} className="flex flex-col gap-1">
            <div className="flex justify-between gap-2 text-base">
              <dt>{NOMBRES_DESGLOSE[k]}</dt>
              <dd className="font-bold">{pct} %</dd>
            </div>
            <div aria-hidden className="h-2 rounded-full bg-surface-strong">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </dl>
  );
}
