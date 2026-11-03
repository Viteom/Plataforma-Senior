"use client";

import { CalendarDays, Check, ClipboardList, Handshake, HeartPulse, Mic, UserRound } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { PASOS_EMPRESA, PASOS_TALENTO } from "@/lib/web/home";

// Cómo funciona: los cinco pasos para empresas o para talento, en orden. Cada paso trae una pieza
// de la app (el reto, el semáforo, el perfil sin foto, el SMS) sobre un escenario de tono, para que
// se entienda cómo se ve de verdad. El orden lo da la lista, sin números ni líneas decorativas.
const Pieza = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-md bg-raised ${className}`}>{children}</div>
);

const Mini = ({ Icono, fondo, titulo, texto }: { Icono: typeof Mic; fondo: string; titulo: string; texto: string }) => (
  <Pieza className="flex max-w-[24rem] min-w-0 items-center gap-3 px-4 py-3.5">
    <span className={`grid size-10 shrink-0 place-items-center rounded-sm ${fondo}`}>
      <Icono aria-hidden className="size-5" />
    </span>
    <span className="min-w-0">
      <b className="block text-base font-semibold">{titulo}</b>
      <span className="text-sm text-text-muted">{texto}</span>
    </span>
  </Pieza>
);

const Estado = ({ children, tono }: { children: React.ReactNode; tono: "verde" | "maiz" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${tono === "verde" ? "bg-exito-fondo text-exito-texto" : "bg-accent text-on-accent"}`}
  >
    {tono === "verde" && <Check aria-hidden className="size-4" />}
    {children}
  </span>
);

const Cara = ({ src }: { src: string }) => (
  <Image src={src} alt="" width={148} height={148} className="size-16 shrink-0 rounded-full object-cover object-[center_20%]" />
);

const PIEZAS_EMPRESA = [
  <Mini key="1" Icono={ClipboardList} fondo="bg-neutro" titulo="Ordenar el inventario de la bodega" texto="20 h a la semana · $20.000 la hora" />,
  <div key="2" className="flex flex-wrap gap-2">
    <Estado tono="verde">Pago justo</Estado>
    <Estado tono="verde">Descansos</Estado>
    <Estado tono="maiz">Primer reto: lo revisa una persona</Estado>
  </div>,
  <div key="3" className="flex flex-wrap items-center gap-3">
    <span className="grid size-16 place-items-center rounded-full bg-raised text-tinta-suave">
      <UserRound aria-hidden className="size-7" />
    </span>
    <Pieza className="px-4 py-3.5">
      <b className="block text-base font-semibold">Contabilidad de costos</b>
      <span className="text-sm text-text-muted">NIIF · inventarios · auditoría</span>
    </Pieza>
  </div>,
  <div key="4" className="flex flex-wrap items-center gap-3">
    <Cara src="/web/home/contadora.webp" />
    <Mini Icono={CalendarDays} fondo="bg-accent text-on-accent" titulo="Jueves 14 · 10:00 a. m." texto="Videollamada confirmada" />
  </div>,
  <Mini key="5" Icono={Handshake} fondo="bg-exito-fondo text-exito-texto" titulo="Acuerdo en curso" texto="10 h a la semana · desde el 6 de octubre" />,
];

const ONDAS = [8, 18, 12, 24, 10, 20, 14, 22, 9, 16];
const PIEZAS_TALENTO = [
  <Pieza key="1" className="flex items-center gap-3 px-4 py-3.5">
    <span className="grid size-10 place-items-center rounded-sm bg-accent text-on-accent">
      <Mic aria-hidden className="size-5" />
    </span>
    <span aria-hidden className="flex h-6 items-center gap-[3px]">
      {ONDAS.map((h, i) => (
        <i key={i} className="w-1 rounded-sm bg-primary" style={{ height: h }} />
      ))}
    </span>
    <span className="text-sm text-text-muted">0:42</span>
  </Pieza>,
  <div key="2" className="flex max-w-[24rem] flex-wrap gap-1.5">
    {["Confección", "Patronaje", "Manejo de equipo", "Atención al cliente", "Costos"].map((e, i) => (
      <span key={e} className={`rounded-full px-3 py-1.5 text-sm font-medium ${i === 0 || i === 2 ? "bg-accent text-on-accent" : "bg-raised"}`}>
        {e}
      </span>
    ))}
  </div>,
  <p key="3" className="max-w-[22rem] rounded-t-md rounded-br-md rounded-bl-sm bg-raised px-4 py-3 text-base">
    Kanna: una organizacion quiere conocer tu perfil. Entra a la app para ver de que se trata. Nadie te pedira dinero.
  </p>,
  <div key="4" className="flex flex-wrap gap-2">
    <span className="inline-flex min-h-12 items-center rounded-full bg-primary px-5 text-base font-semibold text-on-primary">Me interesa</span>
    <span className="inline-flex min-h-12 items-center rounded-full bg-raised px-5 text-base font-semibold">Ahora no</span>
  </div>,
  <div key="5" className="flex flex-wrap items-center gap-3">
    <Cara src="/web/home/modista.webp" />
    <Mini Icono={HeartPulse} fondo="bg-exito-fondo text-exito-texto" titulo="¿Cómo vas con tu ritmo?" texto="Bien · Quiero ajustar · Necesito una pausa" />
  </div>,
];

export function ComoFunciona() {
  const [ver, setVer] = useState<"empresa" | "talento">("empresa");
  const pasos = ver === "empresa" ? PASOS_EMPRESA : PASOS_TALENTO;
  const piezas = ver === "empresa" ? PIEZAS_EMPRESA : PIEZAS_TALENTO;

  return (
    <section id="como-funciona" aria-labelledby="titulo-como" className="scroll-mt-20 bg-neutro py-20 font-web text-tinta lg:py-32">
      <div className="mx-auto max-w-web px-4 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="titulo-como" className="text-seccion font-medium tracking-[-0.035em]">
            Cómo funciona <span className="block text-tinta-suave">en cinco pasos.</span>
          </h2>
          <div role="group" aria-label="Ver el recorrido para" className="inline-flex gap-1 rounded-full bg-raised p-1">
            {(["empresa", "talento"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={ver === v}
                onClick={() => setVer(v)}
                className="min-h-12 rounded-full px-5 text-base font-semibold text-tinta-suave transition-colors aria-pressed:bg-tinta aria-pressed:text-white"
              >
                {v === "empresa" ? "Para empresas" : "Para talento"}
              </button>
            ))}
          </div>
        </div>

        <ol className="mt-12 grid gap-4 md:mt-16 md:gap-5">
          {pasos.map((p, i) => (
            <li key={p.titulo} className="grid items-center gap-5 rounded-lg bg-raised p-5 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-10 md:p-6 md:pl-10">
              <div>
                <h3 className="text-2xl font-medium tracking-tight md:text-3xl">{p.titulo}</h3>
                <p className="mt-2 max-w-[38ch] text-base text-text-muted md:text-lg">{p.texto}</p>
              </div>
              <div data-ui className="flex min-h-32 items-center rounded-md bg-neutro-2 p-4 md:min-h-40 md:p-8">
                {piezas[i]}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
