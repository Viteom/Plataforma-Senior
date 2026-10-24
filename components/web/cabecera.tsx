import Link from "next/link";

import { Logo } from "@/components/marca/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EnlacesWeb, MenuCelular } from "./enlaces";
import { MARCO } from "./marco";

// Barra simple: logo, cuatro enlaces y una acción. Ayuda siempre a la vista (regla 6).
export function CabeceraWeb() {
  return (
    <header className="relative z-30 bg-bg">
      <div className={cn(MARCO, "flex min-h-20 items-center justify-between gap-3")}>
        <Link href="/" className="inline-flex min-h-tap items-center">
          <Logo alto={34} className="max-sm:!w-[110px]" />
        </Link>
        <EnlacesWeb />
        <div className="flex items-center gap-2">
          <Button asChild size="normal" className="px-5 text-lg active:scale-[0.97]">
            <Link href="/entrar">Entrar</Link>
          </Button>
          <MenuCelular />
        </div>
      </div>
    </header>
  );
}
