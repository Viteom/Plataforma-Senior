import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { enmascarar } from "@/lib/auth/destino";
import { leerPendiente } from "@/lib/auth/pendiente";
import { MODO_DEMO } from "@/lib/demo";

import { FormularioCodigo } from "./formulario";

export const metadata: Metadata = { title: "Código" };

export default async function Codigo() {
  if (MODO_DEMO) return <FormularioCodigo enviadoA={null} porCorreo={false} demo />;

  // Sin un código pedido en los últimos 10 minutos no hay nada que escribir aquí.
  const pendiente = await leerPendiente();
  if (!pendiente) redirect("/entrar");

  return (
    <FormularioCodigo
      enviadoA={enmascarar(pendiente)}
      porCorreo={pendiente.tipo === "correo"}
      demo={false}
    />
  );
}
