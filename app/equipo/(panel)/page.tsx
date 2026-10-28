import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MINUTOS_INACTIVIDAD } from "@/lib/auth/inactividad";
import { estadoEquipo, type ResumenEquipo } from "@/lib/datos/equipo";
import { MODO_DEMO } from "@/lib/demo";

export const metadata: Metadata = { title: "Inicio del equipo" };

const ZONA = "America/Bogota";

function saludo(nombre: string | null) {
  const hora = Number(new Intl.DateTimeFormat("es-CO", { hour: "numeric", hourCycle: "h23", timeZone: ZONA }).format(new Date()));
  const base = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  return nombre ? `${base}, ${nombre}` : base;
}

const hoy = () => {
  const t = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA }).format(new Date());
  return t.charAt(0).toUpperCase() + t.slice(1).replace(",", "");
};

function hace(iso: string) {
  const minutos = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 48) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} días`;
}

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

export default async function InicioEquipo() {
  const { conteos: c, resumen: r, nombre } = await estadoEquipo();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-text-muted">{hoy()}</p>
          <h1 className="text-3xl">{saludo(nombre)}</h1>
        </div>
        {!MODO_DEMO && (
          <p className="inline-flex items-center gap-2 text-base text-text-muted">
            <ShieldCheck aria-hidden className="size-5 shrink-0" />
            Entraste con segundo factor · tu sesión se cierra tras {MINUTOS_INACTIVIDAD} minutos sin uso
          </p>
        )}
      </header>

      <ConPlazo r={r} />

      <section aria-labelledby="t-decidir" className="flex flex-col gap-4">
        <Encabezado id="t-decidir" titulo="Por decidir" nota="Lo que espera una revisión del equipo" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Area
            titulo="Retos y acuerdos"
            Icono={ClipboardCheck}
            filas={[
              { n: c.amarillos, texto: plural(c.amarillos, "reto en amarillo por revisar", "retos en amarillo por revisar"), href: "/equipo/curaduria" },
              { n: c.necesidades, texto: plural(c.necesidades, "búsqueda por curar", "búsquedas por curar"), href: "/equipo/curaduria" },
              {
                n: c.muestra,
                texto: plural(c.muestra, "aprobación automática por confirmar", "aprobaciones automáticas por confirmar"),
                href: "/equipo/curaduria",
              },
              {
                n: r.condiciones,
                texto: plural(r.condiciones, "acuerdo con condiciones por revisar", "acuerdos con condiciones por revisar"),
                href: "/equipo/condiciones",
              },
            ]}
          />
          <Area
            titulo="Organizaciones"
            Icono={Building2}
            filas={[
              { n: c.empresas, texto: plural(c.empresas, "por verificar el NIT", "por verificar el NIT"), href: "/equipo/empresas" },
              { n: c.reportes, texto: plural(c.reportes, "reporte de trato o pago abierto", "reportes de trato o pago abiertos"), href: "/equipo/empresas" },
            ]}
          />
          <Area
            titulo="Talento"
            Icono={UsersRound}
            filas={[
              { n: c.evidencias, texto: plural(c.evidencias, "evidencia por revisar", "evidencias por revisar"), href: "/equipo/evidencias" },
              { n: c.etiquetas, texto: plural(c.etiquetas, "etiqueta nueva por aprobar", "etiquetas nuevas por aprobar"), href: "/equipo/etiquetas" },
              { n: c.cotizaciones, texto: plural(c.cotizaciones, "pedido del campo por cotizar", "pedidos del campo por cotizar"), href: "/equipo/experiencias" },
            ]}
          />
          <Actividad actividad={r.actividad} />
        </div>
      </section>

      <Semana r={r} />
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </div>
  );
}

function Encabezado({ id, titulo, nota, claro }: { id: string; titulo: string; nota: string; claro?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="text-2xl">
        {titulo}
      </h2>
      <p className={claro ? "text-base text-on-deep/80" : "text-base text-text-muted"}>{nota}</p>
    </div>
  );
}

// El único momento oscuro: personas que esperan una respuesta, con su plazo.
function ConPlazo({ r }: { r: ResumenEquipo }) {
  const tarjetas = [
    {
      n: r.bienestar.abiertos,
      que: plural(r.bienestar.abiertos, "caso de bienestar abierto", "casos de bienestar abiertos"),
      vencidos: r.bienestar.vencidos,
      detalle: r.bienestar.mas_antiguo
        ? `El más antiguo se abrió ${hace(r.bienestar.mas_antiguo)}.`
        : "No hay casos esperando.",
      accion: "Ver casos",
      href: "/equipo/bienestar",
    },
    {
      n: r.ayuda.abiertas,
      que: plural(r.ayuda.abiertas, "solicitud de ayuda", "solicitudes de ayuda"),
      vencidos: 0,
      detalle: r.ayuda.mas_antigua ? `La más antigua llegó ${hace(r.ayuda.mas_antigua)}.` : "Nadie está esperando.",
      accion: "Atender",
      href: "/equipo/ayuda",
    },
    {
      n: r.avisos,
      que: plural(r.avisos, "aviso por dar", "avisos por dar"),
      vencidos: 0,
      detalle: "Mensajes que no salieron por SMS y hay que dar por otro medio.",
      accion: "Ver avisos",
      href: "/equipo/ayuda#avisos",
    },
  ];

  return (
    <section aria-labelledby="t-plazo" className="flex flex-col gap-6 rounded-lg bg-deep p-5 text-on-deep lg:p-8">
      <Encabezado id="t-plazo" titulo="Primero, lo que tiene plazo" nota="Personas que esperan una respuesta del equipo" claro />
      <ul className="grid gap-4 xl:grid-cols-3">
        {tarjetas.map((t) => (
          <li key={t.href} className="flex flex-col gap-2 rounded-md border-2 border-on-deep/20 bg-on-deep/5 p-5">
            <span className="text-display leading-none font-bold">{t.n}</span>
            <span className="text-lg font-bold">{t.que}</span>
            {t.vencidos > 0 && (
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-accent px-3 py-0.5 text-sm font-bold text-on-accent">
                <AlertTriangle aria-hidden className="size-4" />
                {plural(t.vencidos, "1 pasó las 48 horas", `${t.vencidos} pasaron las 48 horas`)}
              </span>
            )}
            <span className="flex-1 text-base text-on-deep/80">{t.detalle}</span>
            <Link
              href={t.href}
              className="mt-2 inline-flex min-h-action items-center justify-between gap-2 rounded-full bg-accent px-6 text-lg font-bold text-on-accent transition-colors hover:bg-accent-hover"
            >
              {t.accion}
              <ArrowRight aria-hidden className="size-6" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Area({
  titulo,
  Icono,
  filas,
}: {
  titulo: string;
  Icono: LucideIcon;
  filas: { n: number; texto: string; href: string }[];
}) {
  return (
    <div className="flex flex-col rounded-lg border-2 border-border-subtle bg-raised px-5 py-4">
      <h3 className="flex items-center gap-2 pb-2 text-lg">
        <Icono aria-hidden className="size-5" />
        {titulo}
      </h3>
      <ul>
        {filas.map((f) => (
          <li key={f.texto} className="border-t border-border-subtle">
            <Link href={f.href} className="group flex min-h-action items-center gap-4 py-1">
              <span className={f.n ? "min-w-10 text-2xl font-bold" : "min-w-10 text-2xl font-bold text-text-muted"}>{f.n}</span>
              <span className="flex-1 group-hover:underline group-hover:underline-offset-4">{f.texto}</span>
              <ChevronRight aria-hidden className="size-5 shrink-0 text-text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Actividad({ actividad }: { actividad: ResumenEquipo["actividad"] }) {
  return (
    <div className="flex flex-col rounded-lg border-2 border-border-subtle bg-raised px-5 py-4">
      <h3 className="flex items-center gap-2 pb-2 text-lg">
        <Activity aria-hidden className="size-5" />
        Lo último del equipo
      </h3>
      {actividad.length ? (
        <ul>
          {actividad.map((a) => (
            <li key={`${a.tipo}-${a.en}-${a.organizacion}`} className="flex items-center gap-3 border-t border-border-subtle py-3">
              <span
                aria-hidden
                className={
                  a.quien
                    ? "grid size-11 shrink-0 place-items-center rounded-full bg-surface-strong text-sm font-bold"
                    : "grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary"
                }
              >
                {a.quien ? a.quien.slice(0, 2).toUpperCase() : <ShieldCheck className="size-5" />}
              </span>
              <span className="flex-1">
                {a.tipo === "reto_aprobado"
                  ? `${a.quien ?? "El semáforo"} aprobó${a.quien ? "" : " solo"} un reto de ${a.organizacion}`
                  : `${a.quien ?? "El equipo"} verificó a ${a.organizacion}`}
              </span>
              <span className="text-base whitespace-nowrap text-text-muted">{hace(a.en)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-border-subtle pt-3 text-text-muted">Todavía no hay decisiones registradas.</p>
      )}
    </div>
  );
}

function Semana({ r }: { r: ResumenEquipo }) {
  const cifras = [
    { n: r.personas_nuevas, l: plural(r.personas_nuevas, "persona nueva", "personas nuevas"), d: `${r.personas_publicadas} ya publicaron su perfil` },
    {
      n: r.organizaciones_verificadas,
      l: plural(r.organizaciones_verificadas, "organización verificada", "organizaciones verificadas"),
      d: "esta semana",
    },
    { n: r.conversaciones, l: plural(r.conversaciones, "conversación agendada", "conversaciones agendadas"), d: "entre talento y organizaciones" },
    { n: r.acuerdos_en_curso, l: plural(r.acuerdos_en_curso, "acuerdo en curso", "acuerdos en curso"), d: `${r.acuerdos_nuevos} empezaron esta semana` },
  ];
  const s = r.semaforo;
  const total = s.verde + s.amarillo + s.rojo;
  const colores = [
    { n: s.verde, clase: "bg-primary text-on-primary", nombre: "verdes", texto: `aprobados solos (${s.muestra} en la muestra de control)` },
    { n: s.amarillo, clase: "bg-accent text-on-accent", nombre: "amarillos", texto: "pasaron a revisión del equipo" },
    { n: s.rojo, clase: "bg-raised text-danger ring-3 ring-danger ring-inset", nombre: "rojos", texto: "devueltos a la organización" },
  ];

  return (
    <section aria-labelledby="t-semana" className="flex flex-col gap-4">
      <Encabezado id="t-semana" titulo="Cómo va la semana" nota="Desde el lunes" />
      <ul className="grid grid-cols-2 overflow-hidden rounded-lg border-2 border-border-subtle bg-raised lg:grid-cols-4">
        {cifras.map((x, i) => (
          <li
            key={x.l}
            className={`flex flex-col p-5 ${i % 2 ? "border-l-2 border-border-subtle" : ""} ${i > 1 ? "border-t-2 border-border-subtle lg:border-t-0" : ""} ${i === 2 ? "lg:border-l-2" : ""}`}
          >
            <span className="text-3xl font-bold">{x.n}</span>
            <span className="font-bold">{x.l}</span>
            <span className="text-base text-text-muted">{x.d}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-4 rounded-lg border-2 border-border-subtle bg-raised p-5">
        <p className="font-bold">Retos revisados por el semáforo: {total}</p>
        {total > 0 && (
          <div aria-hidden className="flex h-10 gap-1 overflow-hidden rounded-md">
            {colores
              .filter((x) => x.n > 0)
              .map((x) => (
                <span key={x.nombre} className={`flex items-center px-3 text-base font-bold ${x.clase}`} style={{ flexGrow: x.n }}>
                  <span className="max-sm:sr-only">{x.n}</span>
                </span>
              ))}
          </div>
        )}
        <ul className="flex flex-wrap gap-x-7 gap-y-2">
          {colores.map((x) => (
            <li key={x.nombre} className="flex items-center gap-2">
              <span aria-hidden className={`size-4 shrink-0 rounded-sm ${x.clase}`} />
              <span>
                <b>
                  {x.n} {x.nombre}:
                </b>{" "}
                {x.texto}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
