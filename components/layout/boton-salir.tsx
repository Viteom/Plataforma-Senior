import { LogOut } from "lucide-react";

import { salir } from "@/app/(publico)/entrar/acciones";
import { MODO_DEMO } from "@/lib/demo";
import { cn } from "@/lib/utils";

// Cerrar sesión. En modo demostración no hay sesión, así que no se muestra.
export function BotonSalir({ className }: { className?: string }) {
  if (MODO_DEMO) return null;
  return (
    <form action={salir} className={className}>
      <button
        type="submit"
        className={cn(
          "inline-flex min-h-tap items-center gap-2 px-1 text-base font-bold underline underline-offset-4 hover:decoration-2",
        )}
      >
        <LogOut aria-hidden className="size-5" />
        Salir
      </button>
    </form>
  );
}
