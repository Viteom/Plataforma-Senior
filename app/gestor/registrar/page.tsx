import { Camera, FileSignature, Mic, UserRound, WifiOff } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Registro asistido" };

const pasos = [
  { icono: UserRound, titulo: "Datos de la persona", texto: "Nombre, vereda y a qué se dedica." },
  { icono: Mic, titulo: "Su historia", texto: "Grábela o escríbala mientras la persona cuenta." },
  { icono: Camera, titulo: "Foto", texto: "Solo si la persona quiere aparecer visible." },
  { icono: FileSignature, titulo: "Autorización de datos", texto: "Firma en pantalla o audio de aceptación." },
];

export default function RegistroAsistido() {
  return (
    <Pantalla
      titulo="Registrar a una persona"
      intro="Usted crea el perfil en su nombre. Después le llega un mensaje con su código para entrar, si tiene celular."
    >
      <div className="flex items-start gap-3 rounded-md bg-surface p-4">
        <WifiOff aria-hidden className="mt-0.5 size-6 shrink-0" />
        <p>
          <span className="font-bold">Funciona sin señal.</span> Lo que registre se guarda en el
          celular y se envía cuando vuelva la conexión.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {pasos.map(({ icono: Icono, titulo, texto }, i) => (
          <li key={titulo} className="flex items-start gap-4 rounded-md border-2 border-border-subtle p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-strong">
              <Icono aria-hidden className="size-6" />
            </span>
            <div>
              <h2 className="text-lg">
                {i + 1}. {titulo}
              </h2>
              <p className="text-text-muted">{texto}</p>
            </div>
          </li>
        ))}
      </ol>

      <Button ancho="completo">Empezar registro</Button>
      <Pendiente hito={5}>Formulario completo, borradores sin conexión y envío del código.</Pendiente>
    </Pantalla>
  );
}
