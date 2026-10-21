import type { Metadata } from "next";

import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import { RegistroAsistido } from "./registro";

export const metadata: Metadata = { title: "Registro asistido" };

export default async function Registrar() {
  // Las personas que este gestor registró y todavía no han entrado con su celular.
  let registradas: { id: string; nombre: string }[] = [];
  if (!MODO_DEMO) {
    const supabase = await crearClienteServidor();
    const { data } = await supabase.from("talent_profiles").select("id, nombre").order("created_at", { ascending: false }).limit(50);
    registradas = data ?? [];
  }

  return (
    <div className="flex flex-col gap-10">
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
