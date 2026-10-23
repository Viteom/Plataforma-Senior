import type { Metadata } from "next";

import { Pantalla } from "@/components/layout/pantalla";

import { Diagnostico } from "./formulario";

export const metadata: Metadata = { title: "Emprende" };

export default function Emprende() {
  return (
    <Pantalla titulo="Emprende" intro="Cuéntanos en qué va tu negocio y te mostramos los pasos y cursos que te sirven.">
      <Diagnostico />
    </Pantalla>
  );
}
