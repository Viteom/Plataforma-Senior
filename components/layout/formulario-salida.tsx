"use client";

import type { ReactNode } from "react";
import { cerrarSesionLocal } from "@/lib/privacidad/cache";

export function FormularioSalida({ accion, children, className }: {
  accion: () => Promise<void>; children: ReactNode; className?: string;
}) {
  return <form className={className} action={() => cerrarSesionLocal(accion)}>{children}</form>;
}
