import { ArrowLeft, ShieldCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Pantalla } from "@/components/layout/pantalla";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioPagos } from "./formulario";

export const metadata: Metadata = { title: "Cómo recibir tus pagos" };

type Metodo = "nequi" | "daviplata" | "banco" | "giro";

// «300 *** 4567»: se reconoce sin mostrarlo completo en pantalla.
function ocultar(telefono: string | undefined | null) {
  const d = (telefono ?? "").replace(/\D/g, "").replace(/^57(?=3\d{9}$)/, "");
  return /^3\d{9}$/.test(d) ? `${d.slice(0, 3)} *** ${d.slice(6)}` : null;
}

export default async function PagosTalento() {
  let actual: { metodo: Metodo; celular: string | null } | null = null;
  let celularCuenta: string | null = "300 *** 4567";
  if (!MODO_DEMO) {
    const supabase = await crearClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/entrar");
    const { data: perfil } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!perfil) redirect("/perfil/nuevo");
    const { data } = await supabase
      .from("talent_payout_preferences")
      .select("metodo, celular")
      .eq("talent_id", perfil.id)
      .maybeSingle();
    actual = (data as typeof actual) ?? null;
    celularCuenta = ocultar(user.phone);
  }

  return (
    <Pantalla
      antesDelTitulo={
        <Link href="/mi-perfil" className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4">
          <ArrowLeft aria-hidden className="size-5" />
          Mi perfil
        </Link>
      }
      titulo="¿Cómo quieres recibir tus pagos?"
      intro="Lo usamos solo cuando tengas un acuerdo con pago. Puedes cambiarlo cuando quieras."
    >
      <p className="rounded-md bg-surface p-4 text-base">
        Kánna todavía no hace pagos. Guardar tu preferencia nos ayuda a preparar el primero.
      </p>
      <FormularioPagos actual={actual} celularCuenta={celularCuenta} />
      <p className="flex gap-3 rounded-md bg-deep p-4 text-on-deep">
        <ShieldCheck aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
        Nadie de Kánna ni de una organización te va a pedir claves, códigos ni dinero para pagarte.
      </p>
      <p className="flex gap-3 rounded-md bg-surface p-4">
        <UsersRound aria-hidden className="mt-1 size-5 shrink-0" />
        <span>
          ¿No tienes ninguna?{" "}
          <Link href="/ayuda" className="font-bold underline underline-offset-4">
            Pide ayuda
          </Link>{" "}
          y te acompañamos a elegir la que te quede más fácil.
        </span>
      </p>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
