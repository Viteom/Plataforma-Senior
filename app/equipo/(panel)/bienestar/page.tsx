import { redirect } from "next/navigation";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { MODO_DEMO } from "@/lib/demo";
import { gestionarCaso } from "./acciones";
export const metadata = { title: "Acompañamiento de bienestar" };

type CasoEquipo = {
  id: string;
  prioridad: string;
  permite_contacto: boolean;
  estado: string;
  asignado_a_mi: boolean;
  revision_sugerida_en: string;
  nombre: string | null;
  energia: string;
  trato_respetuoso: boolean;
  pago_a_tiempo: boolean | null;
};
export default async function Seguimientos() {
  const supabase = MODO_DEMO ? null : await crearClienteServidor();
  if (supabase) {
    const { data } = await supabase.rpc("es_equipo");
    if (!data) redirect("/entrar");
  }
  // La función deja registro de cada lectura; el equipo no tiene acceso directo a las tablas.
  const { data, error } = supabase ? await supabase.rpc("casos_bienestar_equipo") : { data: [], error: null };
  const casos = (data ?? []) as CasoEquipo[];
  return (
    <Pantalla
      titulo="Acompañamiento de bienestar"
      intro="Cola privada del equipo. Revisa las señales, toma el caso y registra el cierre. Ninguna organización recibe las respuestas, y cada vez que abres esta cola queda registrado."
    >
      <p>
        La fecha sugerida es un objetivo interno de revisión de 48 horas, no una promesa de llamada ni un servicio de
        emergencias.
      </p>
      {error && <p role="alert">No pudimos cargar los casos.</p>}
      {casos.length ? (
        <ul className="flex flex-col gap-4">
          {casos.map((r) => {
            return (
              <li key={r.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
                <h2 className="text-xl">
                  {r.nombre ?? "Persona"} ·{" "}
                  {r.prioridad === "preferente" ? "Revisión preferente" : "Acompañamiento"}
                </h2>
                <p>
                  Estado:{" "}
                  {r.estado === "abierto"
                    ? "Sin asignar"
                    : r.asignado_a_mi
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
                  {r.energia === "pausa"
                    ? "Necesita una pausa"
                    : r.energia === "ajustar"
                      ? "Quiere ajustar su carga"
                      : "Se siente bien"}
                  . Trato respetuoso: {r.trato_respetuoso ? "Sí" : "No"}. Pago a tiempo:{" "}
                  {r.pago_a_tiempo === null
                    ? "Todavía no corresponde"
                    : r.pago_a_tiempo
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
                {r.asignado_a_mi && r.estado === "en_curso" && (
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
