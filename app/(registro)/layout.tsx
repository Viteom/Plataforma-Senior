import { Encabezado } from "@/components/layout/encabezado";

// Registro y huella: sin barra inferior para no distraer mientras se completa el perfil.
export default function LayoutRegistro({ children }: { children: React.ReactNode }) {
  return (
    <div className="talento min-h-dvh">
      <Encabezado inicioHref="/inicio" tono="lleno" />
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 pt-4 pb-12">
        {children}
      </main>
    </div>
  );
}
