import { redirect } from "next/navigation";

// El código ahora se escribe en /entrar (paso 2 de la misma tarjeta). Si queda un código pedido,
// /entrar abre directo en ese paso.
export default function Codigo() {
  redirect("/entrar");
}
