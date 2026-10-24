import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { retraso } from "./marco";

type Celda =
  | { tipo: "titulo"; texto: string; color: string }
  | { tipo: "dato"; texto: string; corto: string; color: string }
  | { tipo: "accion"; texto: string; corto: string; href: string; color: string };

// Una sola foto cortada en un tablero de cuadros: cada cuadro muestra su pedazo y la imagen se
// lee entera a través de las juntas. Algunos cuadros se cambian por color con el título, los
// datos y la acción. En celular el tablero pasa a 3 columnas y se reparten de nuevo.
export function Mosaico({
  id,
  imagen,
  imagenCelular,
  fondo = "bg-accent",
  descripcion,
  celdas,
  posiciones,
  posicionesCelular,
}: {
  id: string;
  imagen: string; // 3:2, para el tablero de 6 × 4
  imagenCelular: string; // 1:2, para el tablero de 3 × 6
  fondo?: string;
  descripcion: string;
  celdas: Celda[];
  posiciones: number[]; // índices de 0 a 23 (6 × 4) donde va cada celda de color
  posicionesCelular: number[]; // índices de 0 a 17 (3 × 6)
}) {
  const celdaEn = (lista: number[], i: number) => {
    const k = lista.indexOf(i);
    return k === -1 ? null : celdas[k];
  };

  // El título lleva el id solo en el tablero de escritorio; el otro tablero está oculto.
  const pieza = (c: Celda, conId: boolean) => {
    if (c.tipo === "titulo")
      return (
        <h2 id={conId ? id : undefined} className="titular-marca text-titular">
          {c.texto}
        </h2>
      );
    // En celular los cuadros miden unos 115 px: va el texto corto.
    const texto = conId ? c.texto : c.corto;
    if (c.tipo === "dato") return <p className="text-base font-bold lg:text-lg">{texto}</p>;
    return (
      <Link
        href={c.href}
        className="group/accion inline-flex h-full w-full flex-col justify-between gap-2 text-lg font-bold underline underline-offset-4"
      >
        {texto}
        <ArrowRight aria-hidden className="size-8 transition-transform duration-150 group-hover/accion:translate-x-1" />
      </Link>
    );
  };

  const tablero = (columnas: number, filas: number, lista: number[], foto: string, clase: string) => (
    <div className={cn("grid gap-1.5 lg:gap-2", clase)} style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
      {Array.from({ length: columnas * filas }, (_, i) => {
        const c = celdaEn(lista, i);
        // El título ocupa dos cuadros: el siguiente no se dibuja.
        if (i % columnas !== 0 && celdaEn(lista, i - 1)?.tipo === "titulo") return null;
        if (c)
          return (
            <div key={i} className={cn("flex aspect-square flex-col overflow-hidden p-3 lg:p-4", c.color, c.tipo === "titulo" && "col-span-2 aspect-auto")}>
              {pieza(c, columnas === 6)}
            </div>
          );
        const x = i % columnas;
        const y = Math.floor(i / columnas);
        return (
          <div key={i} aria-hidden className={cn("group/pieza aspect-square overflow-hidden", fondo)}>
            <div
              className="h-full w-full bg-no-repeat transition-transform duration-500 group-hover/pieza:scale-[1.08]"
              style={{
                backgroundImage: `url(${foto})`,
                backgroundSize: `${columnas * 100}% ${filas * 100}%`,
                backgroundPosition: `${(x / (columnas - 1)) * 100}% ${(y / (filas - 1)) * 100}%`,
              }}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <section aria-labelledby={id} className="bg-deep px-4 py-4 md:px-8 md:py-8">
      <div data-aparecer style={retraso(0)} className="mx-auto max-w-web">
        {tablero(6, 4, posiciones, imagen, "hidden lg:grid")}
        {tablero(3, 6, posicionesCelular, imagenCelular, "lg:hidden")}
      </div>
      <p className="sr-only">{descripcion}</p>
    </section>
  );
}
