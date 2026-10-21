import { Eye, EyeOff, MapPin } from "lucide-react";
import Link from "next/link";

import type { PerfilEjemplo } from "@/lib/demo";
import { etiquetaForma } from "@/lib/formas";

export { etiquetaForma };

// Tarjeta de perfil para empresas. Un perfil reservado se presenta por su oficio,
// sin nombre ni foto. Nunca muestra edad.
export function TarjetaPerfil({ perfil }: { perfil: PerfilEjemplo }) {
  const reservado = perfil.visibilidad === "reservado";
  const titulo = reservado ? perfil.oficio : (perfil.nombre ?? perfil.oficio);

  return (
    <article className="relative flex flex-col gap-4 rounded-md border-2 border-border-subtle bg-bg p-5 transition-colors duration-150 focus-within:border-text hover:border-text">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-bold text-text-muted">
          {reservado ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
          {reservado ? "Perfil reservado" : "Perfil visible"}
        </p>
        <h3 className="text-xl">
          {/* El enlace cubre toda la tarjeta */}
          <Link href={`/empresa/perfil/${perfil.id}`} className="after:absolute after:inset-0">
            {titulo}
          </Link>
        </h3>
        {!reservado && <p className="text-text-muted">{perfil.oficio}</p>}
        <p className="flex items-center gap-1 text-base text-text-muted">
          <MapPin aria-hidden className="size-4" />
          {perfil.ubicacion}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold">Ha resuelto</h4>
        <ul className="flex flex-col gap-1">
          {perfil.situaciones.map((s) => (
            <li key={s} className="text-base before:mr-2 before:content-['–']">
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        {perfil.formas.map((f) => (
          <span key={f} className="rounded-sm bg-surface-strong px-2 py-1 text-sm font-bold">
            {etiquetaForma(f)}
          </span>
        ))}
        <span className="rounded-sm bg-surface px-2 py-1 text-sm">
          {perfil.horasSemana} h/semana · {perfil.modalidad}
        </span>
      </div>
    </article>
  );
}
