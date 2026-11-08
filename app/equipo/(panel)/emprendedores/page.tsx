import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { comunidadEmprendedores } from "@/lib/datos/equipo";
import { CATEGORIAS, esCategoria, esEtapa, etiquetaCategoria, etiquetaEtapa } from "@/lib/emprende/ruta";
import { cn } from "@/lib/utils";

import { Contactos } from "./contactos";

export const metadata: Metadata = { title: "Emprendedores" };

// Comunidad interna de emprendedores: quien llenó Emprende, por tipo de negocio. Sirve para
// compartirles ferias, lugares para vender y oportunidades. Ninguna organización lo ve.
export default async function Emprendedores({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat: crudo } = await searchParams;
  const cat = esCategoria(crudo) ? crudo : undefined;
  const todos = await comunidadEmprendedores();
  const lista = cat ? todos.filter((e) => e.categoria === cat) : todos;
  const cuenta = (c?: string) => todos.filter((e) => !c || e.categoria === c).length;

  return (
    <Pantalla
      titulo="Emprendedores"
      intro="Las personas que llenaron Emprende, por tipo de negocio. Es un grupo interno: las organizaciones no lo ven."
    >
      <nav aria-label="Tipos de negocio">
        <ul className="flex flex-wrap gap-2">
          {[{ valor: undefined, etiqueta: "Todos" }, ...CATEGORIAS].map((c) => {
            const activo = c.valor === cat;
            return (
              <li key={c.etiqueta}>
                <Link
                  href={c.valor ? `/equipo/emprendedores?cat=${c.valor}` : "/equipo/emprendedores"}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-tap items-center rounded-full border-2 px-4 font-bold",
                    activo ? "border-text bg-text text-bg" : "border-border-subtle bg-raised hover:bg-surface",
                  )}
                >
                  {c.etiqueta} ({cuenta(c.valor)})
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Contactos categoria={cat ?? null} etiqueta={cat ? etiquetaCategoria(cat) : "todos los tipos de negocio"} />

      {lista.length ? (
        <ul className="flex flex-col gap-3">
          {lista.map((e) => (
            <li key={e.talent_id} className="flex flex-col gap-1 rounded-md border-2 border-border-subtle p-4">
              <p className="text-lg font-bold">{e.nombre}</p>
              <p className="text-base text-text-muted">
                {[
                  e.ubicacion,
                  esCategoria(e.categoria) ? etiquetaCategoria(e.categoria) : "Sin tipo de negocio",
                  esEtapa(e.etapa) ? etiquetaEtapa(e.etapa) : e.etapa,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {e.idea && <p>«{e.idea}»</p>}
              <p className="text-base">
                {e.pasos_hechos} {e.pasos_hechos === 1 ? "paso hecho" : "pasos hechos"}
                {e.quiere_asesoria && " · Pidió asesoría"}
                {e.quiere_oportunidades ? " · Recibe ferias y oportunidades" : " · No quiere recibir oportunidades"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">Todavía no hay emprendedores en este grupo.</p>
      )}
    </Pantalla>
  );
}
