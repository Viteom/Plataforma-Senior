import { redirect } from "next/navigation";
import { Semaforo } from "@/components/equipo/semaforo";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { MODO_DEMO } from "@/lib/demo";
import { textoAcuerdo } from "@/lib/procesos";
import { revisarAcuerdoTrabajo } from "../acciones";
export const metadata = { title: "Condiciones de trabajo" };
export default async function Condiciones() {
  const supabase = MODO_DEMO ? null : await crearClienteServidor();
  if (supabase) {
    const { data } = await supabase.rpc("es_equipo");
    if (!data) redirect("/entrar");
  }
  const { data, error } = !supabase
    ? { data: [], error: null }
    : await supabase
        .from("connections")
        .select(
          "id,estado,acuerdo_forma,acuerdo_horas_semana,acuerdo_valor,acuerdo_unidad,acuerdo_inicio,acuerdo_nota,acuerdo_version,acuerdo_semaforo,acuerdo_semaforo_motivos,companies(nombre),talent_profiles(nombre)",
        )
        .eq("estado", "acuerdo")
        .is("acuerdo_revisado_en", null)
        .order("actualizado_en")
        .limit(100);
  return (
    <Pantalla
      titulo="Revisar condiciones de trabajo"
      intro="Aquí solo llegan los acuerdos que el semáforo no pudo aprobar solo. Acompaña a ambas partes. Confirma remuneración justa, tareas claras, descansos, seguridad y ajustes acordados; no solicites diagnósticos ni uses la edad para decidir."
    >
      {error && <p role="alert">No pudimos cargar los acuerdos.</p>}
      {data?.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
              <h2 className="text-xl">
                {(c.companies as unknown as { nombre: string })?.nombre} ·{" "}
                {(c.talent_profiles as unknown as { nombre: string })?.nombre}
              </h2>
              <Semaforo color={c.acuerdo_semaforo as string | null} motivos={c.acuerdo_semaforo_motivos as string[]} />
              <p>{textoAcuerdo(c)}</p>
              <p>{c.acuerdo_nota || "Sin nota adicional: confirma las tareas y condiciones con ambas partes."}</p>
              <BotonAccion
                accion={revisarAcuerdoTrabajo}
                campos={{ conexion: c.id, version: String(c.acuerdo_version) }}
                texto="Confirmar revisión con ambas partes"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay acuerdos pendientes de revisión.</p>
      )}
    </Pantalla>
  );
}
