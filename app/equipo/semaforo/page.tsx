import { redirect } from "next/navigation";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import { cambiarReglaTexto, crearReglaTexto, guardarParametro } from "../acciones";

export const metadata = { title: "Semáforo de trabajo digno" };

type Parametro = { clave: string; valor: number; descripcion: string; actualizado_en: string };
type Regla = { id: number; patron: string; color: string; motivo: string; activa: boolean };

// En la demostración se muestran los valores iniciales de la migración.
const PARAMETROS_DEMO: Parametro[] = [
  { clave: "salario_minimo_mensual", valor: 1423500, descripcion: "Salario mínimo mensual legal vigente, en pesos. Actualizar cada año.", actualizado_en: "" },
  { clave: "jornada_maxima_semana", valor: 42, descripcion: "Jornada máxima legal en horas a la semana. Más que esto es rojo.", actualizado_en: "" },
  { clave: "muestreo_verdes_pct", valor: 10, descripcion: "Porcentaje de aprobaciones automáticas que el equipo revisa al azar.", actualizado_en: "" },
];

export default async function PaginaSemaforo() {
  let parametros: Parametro[] = PARAMETROS_DEMO;
  let reglas: Regla[] = [];
  let esAdmin = false;
  if (!MODO_DEMO) {
    const supabase = await crearClienteServidor();
    const { data: equipo } = await supabase.rpc("es_equipo");
    if (!equipo) redirect("/entrar");
    const [{ data: rol }, { data: p }, { data: r }] = await Promise.all([
      supabase.rpc("mi_rol"),
      supabase.from("parametros_trabajo_digno").select("clave, valor, descripcion, actualizado_en").order("clave"),
      supabase.from("reglas_texto_digno").select("id, patron, color, motivo, activa").order("color").order("id"),
    ]);
    esAdmin = rol === "admin";
    parametros = (p ?? []) as Parametro[];
    reglas = (r ?? []) as Regla[];
  }

  return (
    <Pantalla
      titulo="Semáforo de trabajo digno"
      intro="Kánna revisa sola cada reto y cada acuerdo con estas reglas. Verde se aprueba, rojo vuelve a la organización y amarillo llega a la cola del equipo. Ninguna regla mira la edad ni la salud de nadie."
    >
      {!esAdmin && (
        <p className="rounded-md bg-surface p-4">
          Puedes ver las reglas. Para cambiarlas se necesita el rol de administración.
        </p>
      )}

      <section aria-labelledby="umbrales" className="flex flex-col gap-4">
        <h2 id="umbrales" className="text-xl">
          Umbrales
        </h2>
        <p className="text-base text-text-muted">
          Confirma los valores legales con asesoría laboral. Un cambio aplica a los retos y acuerdos nuevos o que cambien.
        </p>
        <ul className="flex flex-col gap-4">
          {parametros.map((p) => (
            <li key={p.clave} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
              <p className="font-bold">{p.descripcion}</p>
              {esAdmin ? (
                <BotonAccion accion={guardarParametro} campos={{ clave: p.clave }} texto="Guardar" variant="secundario">
                  <label className="flex flex-col gap-2">
                    Valor
                    <input
                      name="valor"
                      inputMode="decimal"
                      required
                      defaultValue={String(p.valor)}
                      className="min-h-action border-2 border-border bg-bg px-3"
                    />
                  </label>
                </BotonAccion>
              ) : (
                <p className="text-2xl font-bold">{Number(p.valor).toLocaleString("es-CO")}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reglas" className="flex flex-col gap-4">
        <h2 id="reglas" className="text-xl">
          Reglas sobre el texto del reto
        </h2>
        <p className="text-base text-text-muted">
          Se buscan en el reto y en las condiciones, en minúscula y sin tildes. Rojo devuelve el reto; amarillo lo
          manda a revisión.
        </p>
        {reglas.length ? (
          <ul className="flex flex-col gap-3">
            {reglas.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-md border-2 border-border-subtle p-4">
                <p className="font-bold">
                  {r.color === "rojo" ? "Rojo" : "Amarillo"} · {r.motivo}
                  {!r.activa && <span className="font-normal"> · apagada</span>}
                </p>
                <p className="font-mono text-base break-all">{r.patron}</p>
                {esAdmin && (
                  <BotonAccion
                    accion={cambiarReglaTexto}
                    campos={{ id: String(r.id), activa: r.activa ? "no" : "si" }}
                    texto={r.activa ? "Apagar regla" : "Activar regla"}
                    variant="secundario"
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">{MODO_DEMO ? "En la demostración no se cargan las reglas." : "No hay reglas."}</p>
        )}
        {esAdmin && (
          <details className="rounded-md border-2 border-border-subtle p-4">
            <summary className="min-h-tap cursor-pointer font-bold">Agregar una regla</summary>
            <BotonAccion accion={crearReglaTexto} campos={{}} texto="Guardar regla">
              <label className="flex flex-col gap-2">
                Expresión a buscar (por ejemplo: uniforme propio)
                <input name="patron" required minLength={3} maxLength={200} className="min-h-action border-2 border-border bg-bg px-3" />
              </label>
              <label className="flex flex-col gap-2">
                Motivo que verá el equipo o la organización
                <input name="motivo" required minLength={5} maxLength={200} className="min-h-action border-2 border-border bg-bg px-3" />
              </label>
              <label className="flex flex-col gap-2">
                Color
                <select name="color" defaultValue="amarillo" className="min-h-action border-2 border-border bg-bg px-3">
                  <option value="amarillo">Amarillo: revisión del equipo</option>
                  <option value="rojo">Rojo: vuelve a la organización</option>
                </select>
              </label>
            </BotonAccion>
          </details>
        )}
      </section>
    </Pantalla>
  );
}
