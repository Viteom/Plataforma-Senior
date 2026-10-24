import { Building2 } from "lucide-react";
import Link from "next/link";

import type { MiEmpresa } from "@/lib/datos/tipos";

// El estado de cada conexión, en palabras, lo dan las etapas del proceso (lib/procesos.ts).

// Aviso según la situación de la empresa: sin registrar, en verificación o en pausa (regla 9).
export function AvisoEmpresa({ empresa }: { empresa: MiEmpresa | null }) {
  if (empresa && empresa.verificada && empresa.estado === "activa") return null;
  const texto = !empresa
    ? "Para pedir conocer perfiles, primero registra los datos de tu empresa."
    : empresa.estado === "pausada"
      ? "Tu empresa está en pausa mientras revisamos un reporte. Puedes explorar, pero no pedir conexiones."
      : "Estamos verificando tu empresa en el RUES. Mientras tanto puedes explorar perfiles.";
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
