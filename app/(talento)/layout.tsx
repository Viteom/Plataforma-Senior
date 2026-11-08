import { BarraInferior } from "@/components/layout/barra-inferior";
import { Encabezado } from "@/components/layout/encabezado";

export default function LayoutTalento({ children }: { children: React.ReactNode }) {
  return (
    <div className="talento min-h-dvh">
      <Encabezado inicioHref="/inicio" tono="lleno" salir />
      {/* pb deja espacio para la barra inferior fija */}
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 pt-4 pb-32">
        {children}
      </main>
      <BarraInferior className="border-t border-border-subtle bg-raised" />
    </div>
  );
}
