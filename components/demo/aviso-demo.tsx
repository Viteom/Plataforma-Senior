import { MessageSquareText, RotateCcw } from "lucide-react";
import Link from "next/link";

import { reiniciarDemo } from "@/app/demo/acciones";
import { MODO_DEMO } from "@/lib/demo";
import { cn } from "@/lib/utils";

const enlace = "inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4";

// Solo en la demostración: explica que un proceso avanza de verdad y deja saltar al otro lado,
// ver los mensajes que recibe la persona y empezar de nuevo.
export function AvisoDemo({ lado }: { lado: "talento" | "empresa" }) {
  if (!MODO_DEMO) return null;
  return (
    <aside aria-label="Demostración" className="flex flex-col gap-2 rounded-md bg-surface p-4">
      <p>
        <span className="font-bold">Demostración.</span> El proceso con Alimentos del Oriente avanza de verdad en este
        navegador: da un paso aquí y míralo desde el otro lado.
      </p>
      <div className="flex flex-wrap gap-x-5">
        <Link href={lado === "talento" ? "/empresa/procesos" : "/oportunidades"} className={enlace}>
          {lado === "talento" ? "Ver como organización" : "Ver como talento"}
        </Link>
        <Link href="/demo/mensajes" className={enlace}>
          <MessageSquareText aria-hidden className="size-5" />
          Mensajes al celular
        </Link>
        <form action={reiniciarDemo}>
          <button type="submit" className={cn(enlace, "active:opacity-70")}>
            <RotateCcw aria-hidden className="size-5" />
            Empezar de nuevo
          </button>
        </form>
      </div>
    </aside>
  );
}
