import { Handshake } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";
import { Pendiente } from "@/components/layout/pendiente";

export const metadata: Metadata = { title: "Oportunidades" };

export default function Oportunidades() {
  return (
    <Pantalla
      titulo="Oportunidades"
      intro="Empresas que necesitan resolver algo parecido a lo que usted ya resolvió."
    >
      <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-5 py-10 text-center">
        <Handshake aria-hidden className="size-12" />
        <h2 className="text-xl">Todavía no hay oportunidades</h2>
        <p className="max-w-prose text-text-muted">
          Ninguna empresa ve su nombre hasta que usted diga “Me interesa”.
        </p>
      </div>
      <Pendiente hito={4}>
        Aquí aparecerán las conexiones propuestas con el botón “Me interesa”.
      </Pendiente>
    </Pantalla>
  );
}
