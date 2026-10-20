import type { Metadata } from "next";

import { MODO_DEMO } from "@/lib/demo";

import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

// ?para=empresa crea la cuenta con rol empresa. No es un dato personal: puede ir en la URL.
export default async function Entrar({ searchParams }: { searchParams: Promise<{ para?: string }> }) {
  const { para } = await searchParams;
  return <FormularioEntrar para={para === "empresa" ? "empresa" : "talento"} demo={MODO_DEMO} />;
}
