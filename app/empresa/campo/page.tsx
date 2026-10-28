import { Package, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TEXTO_TIPO } from "@/components/experiencias/textos";
import { Pantalla } from "@/components/layout/pantalla";
import { listarExperiencias } from "@/lib/datos/experiencias";
import type { TipoCampo } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";
import { pesos } from "@/lib/formas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Talento del campo" };

const FILTROS: { valor?: TipoCampo; etiqueta: string }[] = [
  { etiqueta: "Todo" },
  { valor: "experiencia", etiqueta: TEXTO_TIPO.experiencia.plural },
  { valor: "oficio", etiqueta: TEXTO_TIPO.oficio.plural },
];

export default async function TalentoDelCampo({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo: crudo } = await searchParams;
  const tipo = crudo === "experiencia" || crudo === "oficio" ? crudo : undefined;
  const ofertas = await listarExperiencias(tipo);

  return (
    <Pantalla
      titulo="Talento del campo"
      intro="Talleres, experiencias y oficios por encargo con personas del territorio. Kánna los arma con ellas y te acompaña de principio a fin."
    >
      {/* Filtros como enlaces: funcionan sin JavaScript y el tipo no es un dato personal. */}
      <nav aria-label="Qué buscas">
        <ul className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const activo = f.valor === tipo;
            return (
              <li key={f.etiqueta}>
                <Link
                  href={f.valor ? `/empresa/campo?tipo=${f.valor}` : "/empresa/campo"}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-tap items-center rounded-full border-2 px-4 transition-colors duration-150",
                    activo ? "border-primary bg-primary font-bold text-on-primary" : "border-border hover:bg-surface",
                  )}
                >
                  {f.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {ofertas.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ofertas.map((o) => {
            const Icono = o.tipo === "oficio" ? Package : Sparkles;
            return (
              <article
                key={o.id}
                className="relative flex flex-col gap-4 overflow-hidden rounded-lg border-2 border-border-subtle bg-raised transition-colors duration-150 focus-within:border-text hover:border-text"
              >
                {/* Espacio reservado para la foto: evita saltos cuando llegue */}
                <div className="flex aspect-[4/3] items-center justify-center bg-deep">
                  <Icono aria-hidden className="size-12 text-accent" />
                </div>
                <div className="flex flex-col gap-3 px-5 pb-5">
                  <p className="self-start rounded-full bg-surface px-3 text-sm font-bold">{TEXTO_TIPO[o.tipo].nombre}</p>
                  {o.estado === "borrador" && (
                    <p className="self-start rounded-sm border-2 border-dashed border-border px-2 text-sm font-bold">Borrador</p>
                  )}
                  <h2 className="text-xl">
                    <Link href={`/empresa/campo/${o.slug}`} className="after:absolute after:inset-0">
                      {o.nombre}
                    </Link>
                  </h2>
                  <p className="line-clamp-3 text-text-muted">{o.proposito}</p>
                  {o.para_quien && (
                    <p className="flex items-center gap-2 text-base">
                      <Users aria-hidden className="size-5" />
                      {o.para_quien}
                    </p>
                  )}
                  {o.precio_desde && <p className="text-base font-bold">Desde {pesos(o.precio_desde)}</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md bg-surface p-5 text-lg">
          Estamos preparando las primeras ofertas con personas del territorio. Muy pronto las verás aquí.
        </p>
      )}
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
