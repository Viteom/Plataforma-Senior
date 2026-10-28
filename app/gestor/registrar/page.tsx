import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import { RegistroAsistido } from "./registro";

export const metadata: Metadata = { title: "Registro asistido" };

export default async function Registrar({ searchParams }: { searchParams: Promise<{ desde?: string }> }) {
  // Las personas que esta cuenta registró y todavía no han entrado con su celular. Se filtra aquí
  // porque el equipo puede leer todos los perfiles.
  let registradas: { id: string; nombre: string }[] = [];
  // El equipo llega aquí desde su panel: necesita una forma de volver.
  let desdeEquipo = MODO_DEMO && (await searchParams).desde === "equipo";
  if (!MODO_DEMO) {
    const supabase = await crearClienteServidor();
    const [{ data: usuario }, { data: rol }] = await Promise.all([supabase.auth.getUser(), supabase.rpc("mi_rol")]);
    desdeEquipo = rol === "curador" || rol === "admin";
    const { data } = await supabase
      .from("talent_profiles")
      .select("id, nombre")
      .eq("registrado_por", usuario.user?.id ?? "")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(50);
    registradas = data ?? [];
  }

  return (
    <div className="flex flex-col gap-10">
      {desdeEquipo && (
        <Link href="/equipo" className="-mb-6 inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4">
          <ArrowLeft aria-hidden className="size-5" />
          Volver al panel del equipo
        </Link>
      )}
      <RegistroAsistido />
      <section aria-labelledby="registradas" className="flex flex-col gap-3">
        <h2 id="registradas" className="text-xl">
          Personas que registró
        </h2>
        {registradas.length ? (
          <ul className="flex flex-col gap-2">
            {registradas.map((p) => (
              <li key={p.id} className="flex flex-col rounded-md bg-surface px-4 py-3">
                <span className="font-bold">{p.nombre}</span>
                <span className="text-base text-text-muted">Cuando entre con su celular, verá su perfil.</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">{MODO_DEMO ? "En la demostración no se guarda nada en el servidor." : "Todavía ninguna."}</p>
        )}
      </section>
    </div>
  );
}
