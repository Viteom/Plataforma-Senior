"use client";

import { Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/marca/logo";
import { estaActivo, gruposEquipo, inicioEquipo, type ItemNav } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

import { BotonAyuda } from "./boton-ayuda";
import { BotonSalir } from "./boton-salir";

type Props = {
  // Pendientes por destino (href → número). Solo cifras: ningún dato de una persona.
  cuentas: Record<string, number>;
  nombre: string | null;
  rol: "curador" | "admin";
};

// Equipo: barra lateral por áreas en escritorio; en celular, un menú que se abre.
export function BarraEquipo({ cuentas, nombre, rol }: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const enlace = ({ href, etiqueta, icono: Icono }: ItemNav) => {
    const activo = estaActivo(pathname, href, ["/equipo"]);
    const n = cuentas[href] ?? 0;
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={() => setAbierto(false)}
          aria-current={activo ? "page" : undefined}
          className={cn(
            "flex min-h-tap items-center gap-3 rounded-md px-3 py-1.5 text-base transition-colors duration-150",
            activo ? "bg-bg font-bold text-text ring-2 ring-text" : "text-text-muted hover:bg-bg hover:text-text",
          )}
        >
          <Icono aria-hidden className="size-5 shrink-0" />
          <span className="flex-1">{etiqueta}</span>
          {n > 0 && (
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-on-primary">
              {n}
              <span className="sr-only">{n === 1 ? " pendiente" : " pendientes"}</span>
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="sticky top-0 z-20 max-h-dvh overflow-y-auto overscroll-contain border-b-2 border-border-subtle bg-surface lg:h-dvh lg:w-76 lg:shrink-0 lg:overflow-y-auto lg:border-r-2 lg:border-b-0">
      <div className="flex h-full flex-col gap-2 p-3 lg:p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/equipo" className="inline-flex min-h-tap flex-col justify-center gap-0.5 px-1">
            <Logo alto={26} />
            <span className="text-sm text-text-muted">Panel del equipo</span>
          </Link>
          <div className="flex gap-2 lg:hidden">
            <BotonAyuda />
            <button
              type="button"
              onClick={() => setAbierto((a) => !a)}
              aria-expanded={abierto}
              aria-controls="menu-equipo"
              className="inline-flex min-h-tap items-center gap-2 rounded-md border-2 border-text bg-bg px-3 text-base font-bold"
            >
              {abierto ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
              Menú
            </button>
          </div>
        </div>

        <nav id="menu-equipo" aria-label="Principal" className={cn("flex-col gap-1 pt-2 lg:flex", abierto ? "flex" : "hidden")}>
          <ul>{enlace(inicioEquipo)}</ul>
          {gruposEquipo.map((g) => (
            <div key={g.titulo} className="flex flex-col gap-0.5">
              <p className="px-3 pt-3 pb-1 text-sm font-bold text-text-muted">{g.titulo}</p>
              <ul className="flex flex-col gap-0.5">{g.items.map(enlace)}</ul>
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "mt-auto flex-col gap-3 border-t-2 border-border-subtle px-1 pt-4 lg:flex",
            abierto ? "flex" : "hidden",
          )}
        >
          <p className="flex flex-col">
            {nombre && <span className="font-bold">{nombre}</span>}
            <span className="flex items-start gap-1.5 text-sm text-text-muted">
              <ShieldCheck aria-hidden className="mt-1 size-4 shrink-0" />
              {rol === "admin" ? "Administración" : "Curaduría"}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <BotonAyuda className="hidden lg:inline-flex" />
            <BotonSalir />
          </div>
        </div>
      </div>
    </aside>
  );
}
