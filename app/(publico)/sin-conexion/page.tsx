import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";

export const metadata: Metadata = { title: "Sin conexión" };

export default function SinConexion() {
  return (
    <Pantalla
      titulo="No hay conexión a internet"
      antesDelTitulo={<WifiOff aria-hidden className="size-12" />}
      intro="Revise los datos o el wifi y vuelva a intentar. Lo que ya había guardado no se pierde."
    />
  );
}
