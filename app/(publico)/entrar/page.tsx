import type { Metadata } from "next";

import { enmascarar } from "@/lib/auth/destino";
import { leerPendiente } from "@/lib/auth/pendiente";
import { proveedoresActivos } from "@/lib/auth/proveedores";
import { MODO_DEMO } from "@/lib/demo";

import { FormularioEntrar } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

// ?para=empresa crea la cuenta con rol empresa. No es un dato personal: puede ir en la URL.
// SMS_ACTIVO=si cuando Supabase tenga proveedor de SMS (Twilio): el talento empieza por celular.
export default async function Entrar({ searchParams }: { searchParams: Promise<{ para?: string; aviso?: string }> }) {
  const { para, aviso } = await searchParams;
  const pendiente = MODO_DEMO ? null : await leerPendiente();
  const smsActivo = MODO_DEMO || process.env.SMS_ACTIVO === "si";

  return (
    <FormularioEntrar
      para={pendiente?.para ?? (para === "empresa" ? "empresa" : "talento")}
      demo={MODO_DEMO}
      smsActivo={smsActivo}
      proveedores={proveedoresActivos()}
      falloProveedor={aviso === "proveedor"}
      enviadoAntes={pendiente ? { medio: pendiente.tipo, a: enmascarar(pendiente) } : null}
    />
  );
}
