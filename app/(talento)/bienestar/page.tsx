import Link from "next/link";
import { redirect } from "next/navigation";
import { Pantalla } from "@/components/layout/pantalla";
import { FormularioMetas, FormularioSeguimiento } from "@/components/bienestar/formularios";
import { listarOportunidades } from "@/lib/datos/consultas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { MODO_DEMO } from "@/lib/demo";
import { resumenCarga, acuerdosActuales } from "@/lib/bienestar/resumen";
import { pesos } from "@/lib/formas";
export const metadata = { title: "Mi ritmo y bienestar" };
export default async function Bienestar() {
  const procesos = await listarOportunidades();
  let preferencias: { horas_meta: number; ingreso_meta: number | null } | null = MODO_DEMO
    ? { horas_meta: 20, ingreso_meta: null }
    : null;
  let registros: {
    id: string;
    energia: string;
    creado_en: string;
    quiere_contacto: boolean;
  }[] = [];
  const estadosCaso = new Map<string, string>();
  let errorDatos = false;
  if (!MODO_DEMO) {
    const supabase = await crearClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/entrar");
    const { data: p } = await supabase.from("talent_profiles").select("id").eq("user_id", user.id).single();
    if (!p) redirect("/perfil/nuevo");
    const [metas, seguimientos, casos] = await Promise.all([
      supabase.from("wellbeing_preferences").select("horas_meta,ingreso_meta").eq("talent_id", p.id).maybeSingle(),
      supabase
        .from("wellbeing_checkins")
        .select("id,energia,creado_en,quiere_contacto")
        .eq("talent_id", p.id)
        .order("creado_en", { ascending: false })
        .limit(12),
      supabase.from("wellbeing_cases").select("checkin_id,estado").eq("talent_id", p.id),
    ]);
    for (const caso of casos.data ?? []) estadosCaso.set(caso.checkin_id, caso.estado);
    preferencias = metas.data;
    registros = seguimientos.data ?? [];
    errorDatos = Boolean(metas.error || seguimientos.error || casos.error);
  }
  const carga = preferencias ? resumenCarga(preferencias.horas_meta, procesos) : null;
  const ingresoSemanal = acuerdosActuales(procesos)
    .filter((p) => p.estado === "en_curso" && p.acuerdo_unidad === "hora" && p.acuerdo_horas_semana != null)
    .reduce((s, p) => s + Number(p.acuerdo_valor ?? 0) * Number(p.acuerdo_horas_semana), 0);
  return (
    <Pantalla
      titulo="Mi ritmo y bienestar"
      intro="Tu bienestar va primero. Tú eliges cuánto quieres trabajar y puedes pedir acompañamiento antes, durante y después de un trabajo."
    >
      {errorDatos && (
        <p role="alert">El seguimiento todavía no está disponible. Puedes contactar al equipo desde Ayuda.</p>
      )}
      {MODO_DEMO && <p className="rounded-md bg-surface p-4">Ejemplo de demostración. Tus respuestas no se guardan.</p>}
      {carga && (
        <section className="flex flex-col gap-3 rounded-lg bg-surface p-5">
          <h2 className="text-xl">Tu carga semanal acordada</h2>
          <p className="font-bold">
            {carga.horas} horas pactadas / {preferencias!.horas_meta} horas que elegiste
          </p>
          <progress
            aria-label="Horas pactadas frente a tu límite personal"
            max={100}
            value={carga.porcentaje}
            className="h-6 w-full accent-primary"
          />
          <p>{carga.mensaje}</p>
          <p>Son horas semanales pactadas, no un registro de horas trabajadas. No tienes que completar la barra.</p>
          {carga.futuros > 0 && (
            <p>
              Hay {carga.futuros} acuerdos aceptados con inicio futuro; se mostrarán en la carga actual cuando llegue su
              fecha.
            </p>
          )}
          {carga.sinHoras > 0 && (
            <p>
              Hay {carga.sinHoras} acuerdos sin horas semanales registradas. El total no incluye esos trabajos ni los
              que tengas fuera de Kánna.
            </p>
          )}
          {preferencias!.ingreso_meta != null && (
            <p>
              Meta semanal: {pesos(preferencias!.ingreso_meta)}. Estimación de acuerdos por hora:{" "}
              {pesos(ingresoSemanal)}. Es una proyección, no un pago recibido; no incluye acuerdos por mes ni por
              proyecto.
            </p>
          )}
          <Link href="/ayuda" className="inline-flex min-h-tap items-center font-bold underline">
            Pedir ayuda para ajustar mi carga
          </Link>
        </section>
      )}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl">Mis metas, a mi ritmo</h2>
        <FormularioMetas horas={preferencias?.horas_meta} ingreso={preferencias?.ingreso_meta} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl">¿Cómo vas con tu trabajo?</h2>
        <p>Estas preguntas ayudan a acompañarte. No son una valoración médica ni calculan tu longevidad.</p>
        <FormularioSeguimiento
          procesos={procesos.filter((p) =>
            ["abierta", "conversacion", "acuerdo", "en_curso", "cerrada"].includes(p.estado),
          )}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Mi seguimiento en el tiempo</h2>
        {registros.length ? (
          <ul>
            {registros.map((r) => (
              <li key={r.id} className="border-b border-border-subtle py-3">
                {new Date(r.creado_en).toLocaleDateString("es-CO", {
                  timeZone: "America/Bogota",
                })}
                :{" "}
                {
                  (
                    {
                      bien: "Me siento bien",
                      ajustar: "Quiero ajustar mi carga",
                      pausa: "Necesito una pausa",
                    } as Record<string, string>
                  )[r.energia]
                }
                {r.quiere_contacto ? " · Pediste acompañamiento" : ""}
                {estadosCaso.has(r.id) && (
                  <span>
                    {" "}
                    ·{" "}
                    {
                      (
                        {
                          abierto: "Recibido para revisión",
                          en_curso: "El equipo está revisando",
                          cerrado: "Revisión finalizada",
                        } as Record<string, string>
                      )[estadosCaso.get(r.id)!]
                    }
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Cuando registres cómo vas, podrás revisar aquí tus respuestas.</p>
        )}
      </section>
    </Pantalla>
  );
}
