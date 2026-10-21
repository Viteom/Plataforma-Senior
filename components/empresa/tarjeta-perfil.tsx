import { BadgeCheck, Eye, EyeOff, MapPin } from "lucide-react";
import Link from "next/link";

import type { PerfilVista } from "@/lib/datos/tipos";
import { etiquetaForma } from "@/lib/formas";

export { etiquetaForma };

// Tarjeta de perfil para empresas. Un perfil reservado se presenta por su oficio, sin nombre ni
// foto, hasta que hay una conexión abierta. Nunca muestra edad.
export function TarjetaPerfil({ perfil }: { perfil: PerfilVista }) {
  const titulo = perfil.identidad_visible && perfil.nombre ? perfil.nombre : (perfil.oficio ?? "Talento con trayectoria");
  const situaciones = perfil.huella.filter((h) => h.capa === "situaciones").slice(0, 3);

  return (
    <article className="relative flex flex-col gap-4 rounded-md border-2 border-border-subtle bg-bg p-5 transition-colors duration-150 focus-within:border-text hover:border-text">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-bold text-text-muted">
          {perfil.identidad_visible ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
          {perfil.identidad_visible ? "Perfil visible" : "Perfil reservado"}
        </p>
        <h3 className="text-xl">
          {/* El enlace cubre toda la tarjeta */}
          <Link href={`/empresa/perfil/${perfil.id}`} className="after:absolute after:inset-0">
            {titulo}
          </Link>
        </h3>
        {perfil.identidad_visible && perfil.oficio && <p className="text-text-muted">{perfil.oficio}</p>}
        {perfil.ubicacion && (
          <p className="flex items-center gap-1 text-base text-text-muted">
            <MapPin aria-hidden className="size-4" />
            {perfil.ubicacion}
          </p>
        )}
      </div>

      {situaciones.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold">Ha resuelto</h4>
          <ul className="flex flex-col gap-1">
            {situaciones.map((s) => (
              <li key={s.etiqueta} className="text-base before:mr-2 before:content-['–']">
                {s.etiqueta}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {perfil.ofertas.map((o) => (
          <span key={o.tipo} className="rounded-sm bg-surface-strong px-2 py-1 text-sm font-bold">
            {etiquetaForma(o.tipo)}
          </span>
        ))}
        {perfil.evidencias > 0 && (
          <span className="inline-flex items-center gap-1 rounded-sm bg-surface px-2 py-1 text-sm">
            <BadgeCheck aria-hidden className="size-4" />
            {perfil.evidencias} {perfil.evidencias === 1 ? "respaldo verificado" : "respaldos verificados"}
          </span>
        )}
      </div>
    </article>
  );
}
