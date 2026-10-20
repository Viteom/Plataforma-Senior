import Link from "next/link";

import { Encabezado } from "@/components/layout/encabezado";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";

export default function NoEncontrada() {
  return (
    <>
      <Encabezado />
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-8">
        <Pantalla
          titulo="No encontramos esta página"
          intro="Puede que el enlace esté mal escrito o que la página ya no exista."
        >
          <Button asChild ancho="completo">
            <Link href="/">Ir al comienzo</Link>
          </Button>
        </Pantalla>
      </main>
    </>
  );
}
