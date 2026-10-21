import { Download, EyeOff, Pencil, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonSalir } from "@/components/layout/boton-salir";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";
import { Etiqueta } from "@/components/ui/etiqueta";

export const metadata: Metadata = { title: "Mi perfil" };

export default function MiPerfil() {
  return (
    <Pantalla titulo="Mi perfil">
      <Seccion titulo="Quién ve mi perfil">
        <div className="flex items-start gap-3">
          <EyeOff aria-hidden className="mt-0.5 size-6 shrink-0" />
          <p>
            <span className="font-bold">Reservado.</span> Las empresas ven su experiencia, pero no
            su nombre ni su foto.
          </p>
        </div>
        <Button variant="secundario" size="normal" className="self-start">
          Cambiar
        </Button>
      </Seccion>

      <Seccion titulo="Mi huella de experiencia">
        <div className="flex flex-wrap gap-2">
          <Etiqueta texto="Ejemplo confirmado" confirmada />
          <Etiqueta texto="Ejemplo por revisar" />
        </div>
        <Link
          href="/huella"
          className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4"
        >
          <Pencil aria-hidden className="size-5" />
          Contar otra historia
        </Link>
      </Seccion>

      <Seccion titulo="Cómo me pueden contratar">
        <p className="text-text-muted">Aún no ha elegido formas de trabajar.</p>
      </Seccion>

      <Seccion titulo="Empresas que me buscaron">
        <p className="text-text-muted">Todavía ninguna.</p>
      </Seccion>

      <Seccion titulo="Mis datos">
        <div className="flex flex-col gap-2">
          <Button variant="suave" size="normal" className="justify-start">
            <Download aria-hidden />
            Descargar mis datos
          </Button>
          <Button variant="suave" size="normal" className="justify-start">
            <Trash2 aria-hidden />
            Borrar mi cuenta
          </Button>
        </div>
      </Seccion>

      <BotonSalir />

      <Pendiente hito={3}>
        Editar perfil, formas de trabajar y visibilidad; descargar o borrar los datos.
      </Pendiente>
    </Pantalla>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b-2 border-border-subtle pb-6">
      <h2 className="text-xl">{titulo}</h2>
      {children}
    </section>
  );
}
