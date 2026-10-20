import { BarraEmpresa } from "@/components/layout/barra-empresa";

export default function LayoutEmpresa({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BarraEmpresa />
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
        {children}
      </main>
    </>
  );
}
