import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";

import { Diagnostico } from "./formulario";

export const metadata: Metadata = { title: "Emprende" };

export default function Emprende() {
  return (
    <Pantalla titulo="Emprende" intro="Cuéntenos en qué va su negocio y le mostramos los pasos y cursos que le sirven.">
      <Diagnostico />
    </Pantalla>
  );
}
