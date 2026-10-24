import { CabeceraWeb } from "@/components/web/cabecera";
import { MovimientoWeb } from "@/components/web/movimiento";
import { PieWeb } from "@/components/web/pie";

// Web informativa: páginas anchas, por capítulos de color. La app (celular primero) sigue en
// sus propios grupos de rutas.
export default function LayoutWeb({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CabeceraWeb />
      <main id="contenido">{children}</main>
      <PieWeb />
      <MovimientoWeb />
    </>
  );
}
