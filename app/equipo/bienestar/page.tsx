import { redirect } from "next/navigation";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { MODO_DEMO } from "@/lib/demo";
import { gestionarCaso } from "./acciones";
export const metadata = { title: "Acompañamiento de bienestar" };
export default async function Seguimientos() {
  const supabase = MODO_DEMO ? null : await crearClienteServidor();
  let usuario: string | undefined;
  if (supabase) {
    const { data } = await supabase.rpc("es_equipo");
    if (!data) redirect("/entrar");
    usuario = (await supabase.auth.getUser()).data.user?.id;
  }
  const { data, error } = supabase
    ? await supabase
        .from("wellbeing_cases")
        .select(
          "id,prioridad,permite_contacto,estado,asignado_a,creado_en,revision_sugerida_en,talent_profiles(nombre),wellbeing_checkins(energia,trato_respetuoso,pago_a_tiempo)",
        )
        .in("estado", ["abierto", "en_curso"])
        .order("prioridad", { ascending: false })
        .order("creado_en")
        .limit(100)
    : { data: [], error: null };
  return (
    <Pantalla
      titulo="Acompañamiento de bienestar"
      intro="Cola privada del equipo. Revisa las señales, toma el caso y registra el cierre. Ninguna organización recibe las respuestas."
    >
      <p>
        La fecha sugerida es un objetivo interno de revisión de 48 horas, no una
        promesa de llamada ni un servicio de emergencias.
      </p>
      {error && <p role="alert">No pudimos cargar los casos.</p>}
      {data?.length ? (
        <ul className="flex flex-col gap-4">
          {data.map((r) => {
            const respuestas = r.wellbeing_checkins as unknown as {
              energia: string;
              trato_respetuoso: boolean;
              pago_a_tiempo: boolean | null;
            } | null;
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4"
              >
                <h2 className="text-xl">
                  {(r.talent_profiles as unknown as { nombre?: string } | null)
                    ?.nombre ?? "Persona"}{" "}
                  ·{" "}
                  {r.prioridad === "preferente"
                    ? "Revisión preferente"
                    : "Acompañamiento"}
                </h2>
                <p>
                  Estado:{" "}
                  {r.estado === "abierto"
                    ? "Sin asignar"
                    : r.asignado_a === usuario
                      ? "Asignado a ti"
                      : "Asignado a otra persona del equipo"}
                  .
                </p>
                <p>
                  Revisión sugerida antes del{" "}
                  {new Date(r.revision_sugerida_en).toLocaleString("es-CO", {
                    timeZone: "America/Bogota",
                  })}
                  .
                </p>
                <p>
                  Ritmo:{" "}
                  {respuestas?.energia === "pausa"
                    ? "Necesita una pausa"
                    : respuestas?.energia === "ajustar"
                      ? "Quiere ajustar su carga"
                      : "Se siente bien"}
                  . Trato respetuoso:{" "}
                  {respuestas?.trato_respetuoso ? "Sí" : "No"}. Pago a tiempo:{" "}
                  {respuestas?.pago_a_tiempo === null
                    ? "Todavía no corresponde"
                    : respuestas?.pago_a_tiempo
                      ? "Sí"
                      : "No"}
                  .
                </p>
                <p className="font-bold">
                  {r.permite_contacto
                    ? "Autorizó contacto para este seguimiento."
                    : "No autorizó contacto: realiza solo revisión interna. No llames ni escribas por este caso."}
                </p>
                {r.estado === "abierto" && (
                  <BotonAccion
                    accion={gestionarCaso}
                    campos={{ caso: r.id, accion: "tomar" }}
                    texto="Tomar este caso"
                  />
                )}
                {r.asignado_a === usuario && r.estado === "en_curso" && (
                  <BotonAccion
                    accion={gestionarCaso}
                    campos={{ caso: r.id, accion: "cerrar" }}
                    texto="Marcar revisión como finalizada"
                    variant="secundario"
                  />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No hay casos pendientes de revisión.</p>
      )}
    </Pantalla>
  );
}
