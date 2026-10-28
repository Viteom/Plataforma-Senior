import { AlertTriangle, ArrowRight, BadgeCheck, Clock, Handshake, Plus, Search, Sprout, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { situacionEmpresa } from "@/components/procesos/pasos-empresa";
import { Button } from "@/components/ui/button";
import { listarConexiones, obtenerMiEmpresa } from "@/lib/datos/consultas";
import { listarSolicitudes } from "@/lib/datos/experiencias";
import { equipoOrganizacion } from "@/lib/datos/organizacion";
import type { NecesidadVista } from "@/lib/datos/tipos";
import { MODO_DEMO } from "@/lib/demo";

export const metadata: Metadata = { title: "Inicio de la organización" };

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

// El estado de un reto, en palabras y con ícono (nunca solo con color).
function estadoReto(n: NecesidadVista) {
  if (n.dignidad_estado === "ajustes")
    return { texto: "Con ajustes", Icono: AlertTriangle, clase: "bg-raised text-danger ring-2 ring-danger ring-inset" };
  if (n.dignidad_estado === "pendiente")
    return { texto: "En revisión de Kánna", Icono: Clock, clase: "bg-accent text-on-accent" };
  if (n.estado === "en_curaduria") return { texto: "Kánna elige perfiles", Icono: Search, clase: "bg-primary text-on-primary" };
  if (n.estado === "enviada") return { texto: "Enviado a personas", Icono: BadgeCheck, clase: "bg-primary text-on-primary" };
  return { texto: "Cerrado", Icono: Handshake, clase: "ring-2 ring-border ring-inset" };
}

export default async function InicioOrganizacion() {
  const empresa = await obtenerMiEmpresa();
  if (!empresa) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl">Te damos la bienvenida a Kánna</h1>
        <p className="max-w-[60ch]">
          Para conocer talento con trayectoria, primero registra tu organización. Nuestro equipo verifica el NIT en el
          RUES. Si alguien de tu organización ya la registró, pídele que te invite con tu correo.
        </p>
        <Button asChild className="self-start">
          <Link href="/empresa/datos">Registrar mi organización</Link>
        </Button>
      </div>
    );
  }

  const [{ conexiones, necesidades }, solicitudes, { miembros }] = await Promise.all([
    listarConexiones(),
    listarSolicitudes(),
    equipoOrganizacion(),
  ]);
  const situaciones = conexiones.map((c) => ({ c, s: situacionEmpresa(c) }));
  const teToca = situaciones.filter(({ s }) => s.grupo === "turno");
  const conAjustes = necesidades.filter((n) => n.dignidad_estado === "ajustes");
  const porConfirmar = solicitudes.filter((s) => s.estado === "cotizada");
  const puedeCambiar = empresa.rol !== "lectura";

  const espera = [
    {
      n: conAjustes.length,
      que: conAjustes.length === 1 ? "reto con ajustes" : "retos con ajustes",
      detalle: conAjustes[0]
        ? `«${conAjustes[0].problema.slice(0, 70)}${conAjustes[0].problema.length > 70 ? "…" : ""}»${conAjustes[0].semaforo_motivos?.[0] ? `: ${conAjustes[0].semaforo_motivos[0]}` : ""}`
        : "",
      accion: "Ajustar el reto",
      href: conAjustes[0] ? `/empresa/problema/${conAjustes[0].id}` : "/empresa/procesos",
    },
    {
      n: teToca.length,
      que: teToca.length === 1 ? "proceso espera tu respuesta" : "procesos esperan tu respuesta",
      detalle: teToca[0]?.s.titulo ?? "",
      accion: "Responder",
      href: "/empresa/procesos#te-toca",
    },
    {
      n: porConfirmar.length,
      que: porConfirmar.length === 1 ? "cotización del campo por confirmar" : "cotizaciones del campo por confirmar",
      detalle: porConfirmar[0] ? porConfirmar[0].experiencia : "",
      accion: "Revisar cotización",
      href: "/empresa/procesos#experiencias",
    },
  ].filter((e) => e.n > 0);

  const enCurso = situaciones.filter(({ s }) => s.etapa === "en_curso").length;
  const terminados = situaciones.filter(({ s }) => s.etapa === "terminado").length;

  return (
    <div className="flex flex-col gap-9">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-text-muted">{empresa.nombre}</p>
          <h1 className="text-3xl">Inicio</h1>
        </div>
        {puedeCambiar && (
          <Button asChild>
            <Link href="/empresa/problema/nuevo">
              <Plus aria-hidden />
              Contar un reto
            </Link>
          </Button>
        )}
      </header>

      {!empresa.verificada && (
        <p className="flex gap-3 rounded-md bg-surface p-4">
          <Clock aria-hidden className="mt-1 size-5 shrink-0" />
          Nuestro equipo está verificando el NIT de tu organización. Mientras tanto puedes explorar perfiles y contar
          retos; las personas los reciben cuando quede verificada.
        </p>
      )}

      {espera.length ? (
        <section aria-labelledby="t-espera" className="flex flex-col gap-5 rounded-lg bg-deep p-5 text-on-deep lg:p-8">
          <div>
            <h2 id="t-espera" className="text-2xl">
              Espera tu respuesta
            </h2>
            <p className="text-base text-on-deep/80">Personas y procesos que avanzan cuando tu equipo responde</p>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
            {espera.map((e) => (
              <li key={e.href} className="flex flex-col gap-2 rounded-md border-2 border-on-deep/20 bg-on-deep/5 p-5">
                <span className="text-lg font-bold">
                  {e.n} {e.que}
                </span>
                <span className="flex-1 text-base text-on-deep/80">{e.detalle}</span>
                {puedeCambiar && (
                  <Link
                    href={e.href}
                    className="mt-2 inline-flex min-h-action items-center justify-between gap-2 rounded-full bg-accent px-6 text-lg font-bold text-on-accent transition-colors hover:bg-accent-hover"
                  >
                    {e.accion}
                    <ArrowRight aria-hidden className="size-6" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-md bg-surface p-5 text-lg">Nada espera tu respuesta por ahora.</p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[7fr_5fr]">
        <section aria-labelledby="t-retos" className="flex flex-col rounded-lg border-2 border-border-subtle bg-raised p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
            <h2 id="t-retos" className="text-xl">
              Tus retos
            </h2>
            <Link href="/empresa/procesos" className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
              Ver procesos
            </Link>
          </div>
          {necesidades.length ? (
            <ul>
              {necesidades.slice(0, 5).map((n) => {
                const e = estadoReto(n);
                const personas = conexiones.filter((c) => c.need_id === n.id).length;
                return (
                  <li key={n.id} className="border-t border-border-subtle first:border-t-0">
                    <Link href={`/empresa/problema/${n.id}`} className="group flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <span className="flex flex-col">
                        <span className="line-clamp-2 font-bold group-hover:underline group-hover:underline-offset-4">{n.problema}</span>
                        {personas > 0 && <span className="text-base text-text-muted">{plural(personas, "persona", "personas")} en proceso</span>}
                      </span>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-0.5 text-sm font-bold whitespace-nowrap ${e.clase}`}>
                        <e.Icono aria-hidden className="size-4" />
                        {e.texto}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-text-muted">Todavía no has contado un reto.</p>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="t-juntos" className="rounded-lg border-2 border-border-subtle bg-raised p-5">
            <h2 id="t-juntos" className="pb-2 text-xl">
              Lo que han hecho juntos
            </h2>
            <dl className="grid grid-cols-2">
              {[
                { n: enCurso, d: enCurso === 1 ? "acuerdo en curso" : "acuerdos en curso" },
                { n: terminados, d: terminados === 1 ? "trabajo terminado" : "trabajos terminados" },
                { n: necesidades.length, d: necesidades.length === 1 ? "reto contado" : "retos contados" },
                { n: miembros.length, d: miembros.length === 1 ? "persona del equipo" : "personas del equipo" },
              ].map((x, i) => (
                <div key={x.d} className={`flex flex-col-reverse py-3 ${i > 1 ? "border-t border-border-subtle" : ""}`}>
                  <dt className="text-base text-text-muted">{x.d}</dt>
                  <dd className="text-3xl font-bold">{x.n}</dd>
                </div>
              ))}
            </dl>
          </section>
          <nav aria-label="Atajos" className="flex flex-col">
            {[
              { href: "/empresa/campo", texto: "Talento del campo", Icono: Sprout },
              { href: "/empresa/equipo", texto: "Equipo de la organización", Icono: UsersRound },
            ].map(({ href, texto, Icono }) => (
              <Link key={href} href={href} className="flex min-h-action items-center gap-3 border-b border-border-subtle font-bold">
                <Icono aria-hidden className="size-5" />
                <span className="flex-1">{texto}</span>
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </div>
  );
}
