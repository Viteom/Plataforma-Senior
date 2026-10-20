import { Encabezado } from "@/components/layout/encabezado";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado />
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
