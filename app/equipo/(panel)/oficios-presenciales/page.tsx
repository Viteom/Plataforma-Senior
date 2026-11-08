import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input } from "@/components/ui/campo";
import { MODO_DEMO } from "@/lib/demo";
import { OFICIOS_PRESENCIALES_BASE } from "@/lib/oficios-presenciales";
import { crearClienteServidor } from "@/lib/supabase/server";

import { agregarOficioPresencial, quitarOficioPresencial } from "../acciones";

export const metadata: Metadata = { title: "Oficios presenciales" };

// Oficios que siempre se hacen en persona. Con uno de ellos, el registro no ofrece trabajo desde la
// casa; las mentorías y los talleres sí, si la persona lo activa.
export default async function OficiosPresenciales() {
  let lista: { id: number; palabra: string }[];
  let error = false;
  if (MODO_DEMO) {
    lista = OFICIOS_PRESENCIALES_BASE.map((palabra, i) => ({ id: i + 1, palabra }));
  } else {
    const supabase = await crearClienteServidor();
    const { data: esEquipo } = await supabase.rpc("es_equipo");
    if (!esEquipo) redirect("/entrar");
    const { data, error: fallo } = await supabase.from("oficios_presenciales").select("id, palabra").order("palabra");
    lista = (data ?? []) as { id: number; palabra: string }[];
    error = Boolean(fallo);
  }

  return (
    <Pantalla
      titulo="Oficios presenciales"
      intro="Si el oficio de una persona tiene una de estas palabras, en el registro no le ofrecemos trabajo desde la casa. Las mentorías y los talleres sí pueden ser desde la casa, si la persona lo activa."
    >
      <section aria-labelledby="agregar" className="flex flex-col gap-4 rounded-lg bg-surface p-5">
        <h2 id="agregar" className="text-xl">
          Agregar una palabra
        </h2>
        <BotonAccion accion={agregarOficioPresencial} campos={{}} texto="Agregar" repetible>
          <Campo
            id="palabra"
            etiqueta="Palabra o comienzo de palabra"
            ayuda="Sin tildes. «cocin» reconoce cocina, cocinera y cocinero. Se busca al comienzo de cada palabra del oficio."
          >
            {(p) => <Input {...p} name="palabra" required minLength={3} maxLength={40} autoComplete="off" />}
          </Campo>
        </BotonAccion>
      </section>

      {error && <p role="alert">No pudimos cargar la lista. Revisa que la migración esté aplicada.</p>}
      <section aria-labelledby="lista" className="flex flex-col gap-3">
        <h2 id="lista" className="text-xl">
          {lista.length} {lista.length === 1 ? "palabra" : "palabras"} en la lista
        </h2>
        <ul className="flex flex-col gap-2">
          {lista.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 rounded-md border-2 border-border-subtle px-4 py-2">
              <span className="text-lg font-bold">{o.palabra}</span>
              <BotonAccion
                accion={quitarOficioPresencial}
                campos={{ id: String(o.id) }}
                texto="Quitar"
                textoEnviando="Quitando…"
                variant="enlace"
                size="normal"
              />
            </li>
          ))}
        </ul>
      </section>
    </Pantalla>
  );
}
