import { EyeOff, Lock, Trash2, UserCheck } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = { title: "Cómo cuidamos sus datos" };

const puntos = [
  {
    icono: EyeOff,
    titulo: "Su edad nunca la ve una empresa",
    texto: "La fecha de nacimiento la guarda aparte y solo la puede ver el equipo, que deja registro cada vez que la consulta.",
  },
  {
    icono: UserCheck,
    titulo: "Usted decide quién ve su nombre",
    texto: "Con perfil reservado, las empresas ven su experiencia pero no su nombre ni su foto hasta que usted acepte conocerlas.",
  },
  {
    icono: Lock,
    titulo: "Su historia se usa para armar su huella",
    texto: "Si usa el asistente, el texto se procesa con un proveedor de inteligencia artificial fuera de Colombia, sin su nombre, sus datos de contacto ni fechas. Antes de abrir el piloto verificamos y publicamos aquí que el proveedor no la usa para entrenar sus modelos.",
  },
  {
    icono: Trash2,
    titulo: "Puede descargar o borrar sus datos",
    texto: "Desde Mi perfil, cuando quiera.",
  },
];

// Resumen en lenguaje sencillo. El texto legal (Ley 1581 de 2012) está en revisión con un abogado.
export default function Privacidad() {
  return (
    <Pantalla
      titulo="Cómo cuidamos sus datos"
      intro={`${MARCA.nombre} trata sus datos según la Ley 1581 de 2012 de Colombia.`}
    >
      <ul className="flex flex-col gap-5">
        {puntos.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-strong">
              <Icono aria-hidden className="size-6" />
            </span>
            <div>
              <h2 className="text-lg">{titulo}</h2>
              <p className="text-text-muted">{texto}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="rounded-md border-2 border-dashed border-border p-4 text-base">
        La política completa de tratamiento de datos está en revisión legal. Esta página se
        actualizará con el texto aprobado.
      </p>
    </Pantalla>
  );
}
