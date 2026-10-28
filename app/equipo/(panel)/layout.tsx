import { BarraEquipo } from "@/components/layout/barra-equipo";
import { estadoEquipo } from "@/lib/datos/equipo";

export default async function LayoutEquipo({ children }: { children: React.ReactNode }) {
  const { conteos: c, resumen: r, nombre, rol } = await estadoEquipo();
  const cuentas: Record<string, number> = {
    "/equipo/curaduria": c.necesidades + c.amarillos + c.muestra,
    "/equipo/condiciones": r.condiciones,
    "/equipo/bienestar": r.bienestar.abiertos,
    "/equipo/ayuda": c.ayuda + c.avisos,
    "/equipo/evidencias": c.evidencias,
    "/equipo/etiquetas": c.etiquetas,
    "/equipo/experiencias": c.cotizaciones,
    "/equipo/empresas": c.empresas + c.reportes,
  };

  return (
    <div className="lg:flex">
      <BarraEquipo cuentas={cuentas} nombre={nombre} rol={rol} />
      <main id="contenido" className="w-full max-w-6xl min-w-0 px-4 py-8 lg:px-12 lg:py-10">
        {children}
      </main>
    </div>
  );
}
