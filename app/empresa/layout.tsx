import { BarraEmpresa } from "@/components/layout/barra-empresa";

export default function LayoutEmpresa({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BarraEmpresa />
      {/* pb deja espacio para la barra inferior fija (solo por debajo de 1280 px) */}
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 pt-8 pb-32 lg:px-8 lg:pt-10 xl:pb-10">
        {children}
      </main>
    </>
  );
}
