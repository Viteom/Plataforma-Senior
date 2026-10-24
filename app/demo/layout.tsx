import { Encabezado } from "@/components/layout/encabezado";

// Páginas de diseño de la demostración (no son parte de la app publicada).
export default function LayoutDemo({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado ancho="amplio" />
      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-8 lg:py-10">
        {children}
      </main>
    </>
  );
}
