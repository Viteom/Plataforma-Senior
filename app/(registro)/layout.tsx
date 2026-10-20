import { Encabezado } from "@/components/layout/encabezado";

// Registro y huella: sin barra inferior para no distraer mientras se completa el perfil.
export default function LayoutRegistro({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado inicioHref="/inicio" />
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
