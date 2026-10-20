import { Encabezado } from "@/components/layout/encabezado";

// El gestor trabaja en campo, desde el celular.
export default function LayoutGestor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado inicioHref="/gestor/registrar" />
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
