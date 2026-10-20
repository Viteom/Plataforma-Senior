import { BarraEquipo } from "@/components/layout/barra-equipo";

export default function LayoutEquipo({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex">
      <BarraEquipo />
      <main id="contenido" className="w-full max-w-5xl px-4 py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
