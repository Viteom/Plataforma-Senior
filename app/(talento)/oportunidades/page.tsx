import { BadgeCheck, Briefcase, Flag, Handshake, Info, MapPin, Phone, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AvisoDemo } from "@/components/demo/aviso-demo";
import { Pantalla } from "@/components/layout/pantalla";
import { Calificacion, Motivos } from "@/components/procesos/campos";
import { EscucharPantalla, Reproductor } from "@/components/talento/voz";
import { CuadroSituacion, LineaProceso } from "@/components/procesos/linea";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Textarea } from "@/components/ui/campo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { acuerdosActuales, fechaColombia } from "@/lib/bienestar/resumen";
import type { CargaAcuerdo } from "@/lib/bienestar/resumen";
import { listarOportunidades } from "@/lib/datos/consultas";
import type { Oportunidad } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";
import { esForma, etiquetaForma, modalidades, type FormaContratar } from "@/lib/formas";
import { cn } from "@/lib/utils";
import { avisoDemo, leerAvisos, textoAviso, type AvisoIngresos } from "@/lib/ingresos";
import { fechaLarga, situacion, type Situacion } from "@/lib/procesos";

import {
  aceptarAcuerdo,
  ajustarAcuerdo,
  calificar,
  confirmarFecha,
  meInteresa,
  noMeInteresa,
  noSeguir,
  otraFecha,
  reportarEmpresa,
  terminar,
} from "./acciones";

export const metadata: Metadata = { title: "Oportunidades" };

const enlace = "inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4";

type Busqueda = { donde?: string; forma?: string };

export default async function Oportunidades({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const todas = await listarOportunidades();
  // Filtros: dónde es el trabajo y de qué forma. Van en la dirección (no son datos personales).
  const { donde: dondeCrudo, forma: formaCruda } = await searchParams;
  const donde = dondeCrudo === "presencial" || dondeCrudo === "remoto" ? dondeCrudo : undefined;
  const forma = esForma(formaCruda) ? formaCruda : undefined;
  const formasQueHay = [...new Set(todas.flatMap((o) => o.formatos ?? []))].filter(esForma);
  const filas = todas.filter(
    (o) =>
      (!donde || o.modalidad === donde || o.modalidad === "mixto") &&
      (!forma || (o.formatos ?? []).includes(forma)),
  );
  const supabase = MODO_DEMO ? null : await crearClienteServidor();
  const cargas = new Map<string, CargaAcuerdo>();
  // Avisos por pensión o subsidio: los calcula la base con lo que la persona contó en privado.
  const avisos = new Map<string, AvisoIngresos[]>();
  if (supabase)
    await Promise.all(
      filas
        .filter((o) => o.estado === "acuerdo")
        .map(async (o) => {
          const [carga, ingresos] = await Promise.all([
            supabase.rpc("previsualizar_carga", { conexion: o.id, version: o.acuerdo_version }),
            supabase.rpc("avisos_ingresos", { conexion: o.id }),
          ]);
          if (!carga.error && carga.data) cargas.set(o.id, carga.data as CargaAcuerdo);
          if (!ingresos.error) avisos.set(o.id, leerAvisos(ingresos.data));
        }),
    );
  if (MODO_DEMO)
    for (const o of filas.filter((o) => o.estado === "acuerdo")) {
      const fecha = o.acuerdo_inicio && o.acuerdo_inicio > fechaColombia() ? o.acuerdo_inicio : fechaColombia();
      const otros = acuerdosActuales(
        filas.filter((p) => p.id !== o.id),
        fecha,
      );
      const previas = otros.reduce((s, p) => s + Number(p.acuerdo_horas_semana ?? 0), 0);
      const sinHoras =
        otros.filter((p) => p.acuerdo_horas_semana == null).length + (o.acuerdo_horas_semana == null ? 1 : 0);
      const total = previas + Number(o.acuerdo_horas_semana ?? 0);
      cargas.set(o.id, {
        fecha,
        horas_previas: previas,
        horas_nuevas: o.acuerdo_horas_semana ?? null,
        total,
        sin_horas: sinHoras,
        limite: 20,
        requiere_confirmacion: sinHoras > 0 || total > 20,
        token: "demo",
      });
    }
  if (MODO_DEMO)
    for (const o of filas.filter((o) => o.estado === "acuerdo"))
      avisos.set(o.id, avisoDemo(o.acuerdo_valor ?? null, o.acuerdo_unidad ?? null, o.acuerdo_horas_semana ?? null));
  const oportunidades = filas.map((o) => ({
    o,
    s: situacion({ ...o, evaluacion_propia: o.evaluacion_talento }, "talento"),
  }));
  const grupo = (g: Situacion["grupo"]) => oportunidades.filter(({ s }) => s.grupo === g);
  const turno = grupo("turno");
  const proceso = grupo("proceso");
  const cerradas = grupo("cerrado");

  return (
    <Pantalla titulo="Oportunidades" intro="Aquí ves cómo va cada una y qué sigue.">
      <EscucharPantalla className="-mt-4" />
      <AvisoDemo lado="talento" />
      {/* Aviso antifraude fijo (regla 9). */}
      <p className="flex items-start gap-3 rounded-lg bg-deep p-4 text-on-deep">
        <ShieldAlert aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
        <span>
          <span className="font-bold">Nadie te va a pedir dinero.</span>{" "}
          <span className="text-azul-claro">
            Ni códigos, ni contraseñas, ni pagos por «exámenes», «aportes a salud y pensión» o cursos. Si alguien lo
            hace, repórtalo.
          </span>
        </span>
      </p>

      {todas.length > 1 && <Filtros donde={donde} forma={forma} formas={formasQueHay} />}

      {todas.length > 0 && oportunidades.length === 0 && (
        <div role="status" className="flex flex-col items-start gap-2 rounded-lg bg-raised p-5 shadow-tarjeta">
          <p className="font-bold">Ninguna oportunidad coincide con lo que elegiste.</p>
          <Link href="/oportunidades" className={enlace}>
            Ver todas
          </Link>
        </div>
      )}

      {todas.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-raised px-5 py-10 text-center shadow-tarjeta">
          <Handshake aria-hidden className="size-12" />
          <h2 className="text-xl">Todavía no hay oportunidades</h2>
          <p className="max-w-prose text-text-muted">Cuando una empresa te busque, te avisamos por mensaje de texto.</p>
        </div>
      )}

      {turno.length > 0 && (
        <section aria-labelledby="te-toca" className="flex flex-col gap-4">
          <h2 id="te-toca" className="text-xl">
            Te toca a ti
          </h2>
          <ul className="flex flex-col gap-5">
            {turno.map(({ o, s }) => (
              <li key={o.id}>
                <TarjetaProceso o={o} s={s} carga={cargas.get(o.id)} avisos={avisos.get(o.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {proceso.length > 0 && (
        <section aria-labelledby="en-proceso" className="flex flex-col gap-4">
          <h2 id="en-proceso" className="text-xl">
            En proceso
          </h2>
          <ul className="flex flex-col gap-5">
            {proceso.map(({ o, s }) => (
              <li key={o.id}>
                <TarjetaProceso o={o} s={s} carga={cargas.get(o.id)} avisos={avisos.get(o.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {cerradas.length > 0 && (
        <section aria-labelledby="terminadas" className="flex flex-col gap-4">
          <h2 id="terminadas" className="text-xl">
            Terminadas
          </h2>
          <ul className="flex flex-col gap-3">
            {cerradas.map(({ o, s }) => (
              <li key={o.id} className="flex flex-col gap-1 rounded-lg bg-raised p-4 shadow-tarjeta">
                <p className="font-bold">{o.empresa}</p>
                <p>{s.titulo}</p>
                {s.detalle && <p className="text-base text-text-muted">{s.detalle}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}

function TarjetaProceso({
  o,
  s,
  carga,
  avisos = [],
}: {
  o: Oportunidad;
  s: Situacion;
  carga?: CargaAcuerdo;
  avisos?: AvisoIngresos[];
}) {
  const campos = { conexion: o.id };
  // La persona responde a la fecha y al acuerdo que está viendo (ver la migración de revisión).
  const conFecha = { ...campos, version: String(o.conversacion_version ?? 0) };
  const conAcuerdo = {
    ...campos,
    version: String(o.acuerdo_version ?? 0),
    carga_token: carga?.token ?? "",
  };
  const nueva = o.estado === "enviada_talento";
  const abierta = ["abierta", "conversacion", "acuerdo", "en_curso"].includes(o.estado);

  const donde = [o.ciudad, modalidades.find((m) => m.valor === o.modalidad)?.etiqueta].filter(Boolean).join(" · ");
  const como = o.formatos?.length ? o.formatos.map(etiquetaForma).join(", ") : null;

  return (
    <article className="flex flex-col gap-4 rounded-lg bg-raised p-5 shadow-tarjeta">
      <div className="-mx-5 -mt-5 flex flex-col items-start gap-2 rounded-t-lg bg-primary p-5 text-on-primary">
        {o.empresa_verificada && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-0.5 text-base font-bold text-on-accent">
            <BadgeCheck aria-hidden className="size-5" />
            Organización verificada
          </p>
        )}
        <h3 className="text-2xl">{o.empresa}</h3>
        {!nueva && (o.sector || o.ciudad) && (
          <p className="flex items-center gap-1 text-base text-azul-claro">
            <MapPin aria-hidden className="size-4" />
            {[o.sector, o.ciudad].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {nueva && (
        <Reproductor
          id={`oportunidad-${o.id}`}
          titulo="Escucha de qué se trata"
          texto={[
            `${o.empresa}${o.empresa_verificada ? ", una organización verificada por Kánna," : ""} quiere hablarte de un trabajo.`,
            o.problema ? `Esto es lo que necesita: ${o.problema}` : "Vio tu perfil y quiere hablarte de un trabajo.",
            donde && `Es en ${donde}.`,
            como && `Busca a alguien para: ${como}.`,
            "Si te interesa, toca Me interesa. Si no, toca No me interesa: tu perfil sigue ahí.",
            "Recuerda: nadie te va a pedir dinero.",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}
      {(nueva || o.problema) && (
        <p className="text-lg">{o.problema ? `«${o.problema}»` : "Vio tu perfil y quiere hablarte de un trabajo."}</p>
      )}
      {nueva && (donde || como || o.sector) && (
        <ul className="flex flex-col gap-2.5">
          {donde && <Dato icono={MapPin} titulo={donde} nota="Dónde" />}
          {como && <Dato icono={Handshake} titulo={como} nota="Cómo trabajarían juntos" />}
          {o.sector && <Dato icono={Briefcase} titulo={o.sector} nota="Sector" />}
        </ul>
      )}

      {s.etapa && <LineaProceso etapa={s.etapa} />}
      <CuadroSituacion s={s} lado="talento" />
      {o.estado === "acuerdo" && o.acuerdo_nota && (
        <p className="text-base">
          <span className="font-bold">Lo que van a lograr:</span> {o.acuerdo_nota}
        </p>
      )}

      {nueva && (
        <>
          <BotonAccion accion={meInteresa} campos={campos} texto="Me interesa" ancho="completo" />
          <BotonAccion
            accion={noMeInteresa}
            campos={campos}
            texto="No me interesa"
            variant="secundario"
            ancho="completo"
          />
          <Link href="/ayuda#llameme" className={`${enlace} self-center`}>
            <Phone aria-hidden className="size-5" />
            Tengo una pregunta: que me llamen
          </Link>
        </>
      )}
      {o.estado === "conversacion" && !o.conversacion_confirmada && (
        <>
          <BotonAccion accion={confirmarFecha} campos={conFecha} texto="Sí, me sirve" ancho="completo" />
          <BotonAccion
            accion={otraFecha}
            campos={conFecha}
            texto="Necesito otra fecha"
            variant="secundario"
            ancho="completo"
          />
        </>
      )}
      {o.estado === "acuerdo" && (
        <>
          <AvisosIngresos avisos={avisos} />
          {MODO_DEMO || (o.acuerdo_revisado_en && carga) ? (
            <BotonAccion accion={aceptarAcuerdo} campos={conAcuerdo} texto="Acepto el acuerdo" ancho="completo">
              {carga && (
                <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
                  <p className="font-bold">Revisa tu tiempo antes de aceptar</p>
                  <p>
                    Al inicio de este acuerdo (el {fechaLarga(carga.fecha)}), tienes {carga.horas_previas} horas semanales pactadas en
                    otros acuerdos. Este suma {carga.horas_nuevas ?? "horas por definir"}.
                  </p>
                  <p>
                    Total con horas conocidas: {carga.total}.{" "}
                    {carga.limite === null
                      ? "No has elegido un límite personal."
                      : `Tu límite personal es ${carga.limite} horas.`}
                  </p>
                  {carga.sin_horas > 0 && (
                    <p>Hay {carga.sin_horas} acuerdos sin horas definidas. Revisa su dedicación con el equipo.</p>
                  )}
                  <p>La proyección no incluye trabajos fuera de Kánna ni descuenta finales todavía no registrados.</p>
                  {carga.requiere_confirmacion && (
                    <label className="flex min-h-tap items-start gap-3">
                      <input
                        type="checkbox"
                        name="confirmar_carga"
                        value="si"
                        required
                        className="mt-1 size-6 shrink-0"
                      />
                      Revisé esta carga y quiero continuar con estas condiciones. Puedo pedir ajustes en lugar de
                      aceptar.
                    </label>
                  )}
                </div>
              )}
            </BotonAccion>
          ) : (
            <p role="status">
              {o.acuerdo_revisado_en
                ? "No pudimos calcular tu carga de trabajo. Recarga la página; puedes pedir ajustes mientras tanto."
                : "Kánna está revisando las condiciones. Te avisamos cuando puedas decidir; puedes pedir ajustes mientras tanto."}
            </p>
          )}
          <BotonAccion
            accion={ajustarAcuerdo}
            campos={conAcuerdo}
            texto="Quiero ajustarlo"
            variant="secundario"
            ancho="completo"
          />
        </>
      )}
      {o.estado === "en_curso" && (
        <details>
          <summary className={enlace}>Ya terminamos</summary>
          <BotonAccion
            accion={terminar}
            campos={campos}
            texto="Marcar como terminado"
            variant="secundario"
            className="mt-3"
          >
            <Calificacion pregunta="¿Cómo te fue con esta organización?" />
          </BotonAccion>
        </details>
      )}
      {o.estado === "cerrada" && o.cierre_tipo === "terminado" && !o.evaluacion_talento && (
        <BotonAccion accion={calificar} campos={campos} texto="Enviar calificación">
          <Calificacion pregunta="¿Cómo te fue con esta organización?" />
        </BotonAccion>
      )}

      {abierta && (
        <details>
          <summary className={enlace}>No quiero seguir</summary>
          <BotonAccion
            accion={noSeguir}
            campos={campos}
            texto="Cerrar este proceso"
            variant="secundario"
            className="mt-3"
          >
            <Motivos lado="talento" />
          </BotonAccion>
        </details>
      )}
      {(nueva || abierta) && (
        <details>
          <summary className={enlace}>
            <Flag aria-hidden className="size-5" />
            Reportar esta empresa
          </summary>
          <BotonAccion
            accion={reportarEmpresa}
            campos={campos}
            texto="Enviar reporte"
            variant="secundario"
            className="mt-3"
          >
            <Campo
              id={`motivo-${o.id}`}
              etiqueta="¿Qué pasó?"
              ayuda="Por ejemplo: me pidieron plata o mis datos del banco."
            >
              {(p) => <Textarea {...p} name="motivo" rows={3} className={`${p.className} min-h-28`} />}
            </Campo>
          </BotonAccion>
        </details>
      )}
    </article>
  );
}

function Dato({ icono: Icono, titulo, nota }: { icono: typeof MapPin; titulo: string; nota: string }) {
  return (
    <li className="flex items-center gap-4 rounded-md bg-surface px-4 py-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-md bg-raised">
        <Icono aria-hidden className="size-6" />
      </span>
      <span className="flex flex-col">
        <span className="text-base text-text-muted">{nota}</span>
        <span className="font-web text-xl font-semibold tracking-tight">{titulo}</span>
      </span>
    </li>
  );
}

// Avisos por pensión o subsidio antes de aceptar. Los importantes van con borde y el ícono de alerta
// (no solo con color) y llevan a hablar con el equipo.
function AvisosIngresos({ avisos }: { avisos: AvisoIngresos[] }) {
  if (!avisos.length) return null;
  const textos = avisos.map(textoAviso);
  return (
    <div className="flex flex-col gap-3">
      {textos.map((t) => (
        <div
          key={t.titulo}
          role={t.importante ? "alert" : undefined}
          className={`flex gap-3 rounded-md p-4 ${t.importante ? "border-2 border-danger bg-raised" : "bg-surface"}`}
        >
          {t.importante ? (
            <ShieldAlert aria-hidden className="mt-1 size-6 shrink-0 text-danger" />
          ) : (
            <Info aria-hidden className="mt-1 size-6 shrink-0" />
          )}
          <div className="flex flex-col gap-1">
            <p className="font-bold">{t.titulo}</p>
            <p>{t.texto}</p>
          </div>
        </div>
      ))}
      {textos.some((t) => t.importante) && (
        <Link href="/ayuda#llameme" className={`${enlace} self-start`}>
          <Phone aria-hidden className="size-5" />
          Hablar con el equipo antes de aceptar
        </Link>
      )}
      <p className="text-base text-text-muted">
        Lo calculamos con lo que contaste en Mi perfil. La organización no lo ve.
      </p>
    </div>
  );
}

// Filtros como enlaces grandes: funcionan sin JavaScript y el lector de pantalla dice cuál está elegido.
function Filtros({ donde, forma, formas }: { donde?: string; forma?: FormaContratar; formas: FormaContratar[] }) {
  const href = (d?: string, f?: string) => {
    const q = new URLSearchParams();
    if (d) q.set("donde", d);
    if (f) q.set("forma", f);
    const texto = q.toString();
    return texto ? `/oportunidades?${texto}` : "/oportunidades";
  };
  const chip = (activo: boolean) =>
    cn(
      "inline-flex min-h-tap items-center rounded-full border-2 px-4 text-base transition-[background-color,transform] duration-100 active:scale-[0.97]",
      activo ? "border-text bg-text font-bold text-bg" : "border-border bg-raised hover:bg-surface",
    );
  return (
    <nav aria-label="Filtrar oportunidades" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <p className="font-bold">¿Dónde?</p>
        <ul className="flex flex-wrap gap-2">
          {[{ valor: undefined, etiqueta: "Todas" }, { valor: "presencial", etiqueta: "Presencial" }, { valor: "remoto", etiqueta: "Desde mi casa" }].map((d) => (
            <li key={d.etiqueta}>
              <Link href={href(d.valor, forma)} aria-current={donde === d.valor ? "true" : undefined} className={chip(donde === d.valor)}>
                {d.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {formas.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="font-bold">¿De qué forma?</p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link href={href(donde)} aria-current={!forma ? "true" : undefined} className={chip(!forma)}>
                Todas
              </Link>
            </li>
            {formas.map((f) => (
              <li key={f}>
                <Link href={href(donde, f)} aria-current={forma === f ? "true" : undefined} className={chip(forma === f)}>
                  {etiquetaForma(f)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
