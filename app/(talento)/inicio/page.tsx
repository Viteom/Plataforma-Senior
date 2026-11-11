import { BookOpen, ChevronRight, Circle, Lightbulb, UserRound, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AvisoBienestar } from "@/components/bienestar/aviso";
import { EscucharPantalla, TarjetaVideo } from "@/components/talento/voz";
import { Button } from "@/components/ui/button";
import { listarOportunidades } from "@/lib/datos/consultas";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { video } from "@/lib/talento/videos";

export const metadata: Metadata = { title: "Inicio" };

// Inicio del talento: lo que le toca primero, en grande; después videos cortos y atajos. Sin párrafos.
export default async function Inicio() {
  const [nuevas, { nombre, falta }] = await Promise.all([
    listarOportunidades().then((o) => o.filter((x) => x.estado === "enviada_talento").length),
    miAvance(),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {nombre && (
            <span aria-hidden className="grid size-13 shrink-0 place-items-center rounded-full bg-primary font-web text-xl font-semibold text-accent">
              {nombre[0]}
            </span>
          )}
          <h1 className="text-3xl">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
        </div>
        <EscucharPantalla />
      </div>

      <section aria-labelledby="siguiente" className="relative overflow-hidden rounded-lg bg-primary text-on-primary">
        {/* El símbolo de Kánna como motivo, en lugar de una foto: la experiencia no se muestra con la edad. */}
        <Image
          src="/marca/kanna-simbolo-negativo.svg"
          alt=""
          aria-hidden
          width={220}
          height={220}
          unoptimized
          priority
          className="pointer-events-none absolute -top-16 -right-16 size-56 opacity-25"
        />
        <div className="relative flex min-h-48 flex-col items-start justify-end gap-3 p-5">
          {nuevas > 0 && (
            <span className="rounded-full bg-accent px-3 py-0.5 text-base font-bold text-on-accent">Te toca a ti</span>
          )}
          <h2 id="siguiente" className="text-2xl">
            {nuevas === 0
              ? "Cuéntanos qué sabes hacer"
              : nuevas === 1
                ? "Una organización quiere hablarte de un trabajo"
                : `${nuevas} organizaciones quieren hablarte de un trabajo`}
          </h2>
          {nuevas === 0 && <p className="text-azul-claro">Hablando toma unos 5 minutos.</p>}
          <Button asChild variant="acento" ancho="completo" className="mt-1">
            <Link href={nuevas > 0 ? "/oportunidades" : "/huella"}>{nuevas > 0 ? "Ver de qué se trata" : "Contar mi historia"}</Link>
          </Button>
        </div>
      </section>

      {falta.length > 0 && (
        <section aria-labelledby="falta" className="flex flex-col gap-3 rounded-lg bg-raised p-5 shadow-tarjeta">
          <div className="flex items-center gap-4">
            {/* Aro de avance: cuenta creada, experiencia y cómo quiere trabajar. */}
            <div
              aria-hidden
              className="grid size-16 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-primary) ${((PASOS_PERFIL - falta.length) / PASOS_PERFIL) * 100}%, var(--color-surface-strong) 0)`,
              }}
            >
              <span className="grid size-12 place-items-center rounded-full bg-raised text-base font-bold">
                {PASOS_PERFIL - falta.length}/{PASOS_PERFIL}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h2 id="falta" className="text-xl">
                Tu perfil va en {PASOS_PERFIL - falta.length} de {PASOS_PERFIL}
              </h2>
              <p className="text-base text-text-muted">
                Para que te lleguen oportunidades {falta.length === 1 ? "falta esto" : `faltan ${falta.length} cosas`}. Hazlas cuando quieras.
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {falta.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="flex min-h-action items-center gap-3 rounded-md border-2 border-border px-4 py-2 transition-[background-color,transform] duration-100 hover:bg-surface active:scale-[0.99]"
                >
                  <Circle aria-hidden className="size-6 shrink-0" />
                  <span className="flex flex-1 flex-col">
                    <span className="font-bold">{f.titulo}</span>
                    <span className="text-base text-text-muted">{f.tiempo}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-6 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="como-funciona" className="flex flex-col gap-3">
        <h2 id="como-funciona" className="text-xl">
          Mira cómo funciona
        </h2>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          {["como-funciona", "te-quieren-conocer", "estafas"].map((id) => (
            <TarjetaVideo key={id} v={video(id)} />
          ))}
        </div>
      </section>

      <nav aria-label="Atajos" className="grid grid-cols-2 gap-3">
        {ATAJOS.map(({ href, etiqueta, icono: Icono }) => (
          <Link key={href} href={href} className="flex min-h-28 flex-col justify-between gap-3 rounded-lg bg-raised p-4 shadow-tarjeta transition-transform duration-100 active:scale-[0.97]">
            <span className="grid size-11 place-items-center rounded-md bg-neutro-2">
              <Icono aria-hidden className="size-6" />
            </span>
            <span className="flex items-center justify-between gap-2 font-bold leading-tight">
              {etiqueta}
              <ChevronRight aria-hidden className="size-6 shrink-0" />
            </span>
          </Link>
        ))}
      </nav>

      <AvisoBienestar />
    </div>
  );
}

const ATAJOS = [
  { href: "/mi-perfil", etiqueta: "Mi perfil", icono: UserRound },
  { href: "/mi-perfil/pagos", etiqueta: "Cómo me pagan", icono: Wallet },
  { href: "/aprende", etiqueta: "Aprende", icono: BookOpen },
  { href: "/emprende", etiqueta: "Emprende", icono: Lightbulb },
];

// Pasos del perfil: crear la cuenta, contar la experiencia y decir cómo quiere trabajar.
const PASOS_PERFIL = 3;

type Falta = { href: string; titulo: string; tiempo: string };

// El nombre y lo que falta para que el perfil reciba oportunidades. Quien entró con lo mínimo
// («Entrar ya y completar después») lo ve aquí y lo llena cuando quiera.
async function miAvance(): Promise<{ nombre: string | null; falta: Falta[] }> {
  if (MODO_DEMO) return { nombre: "Gloria", falta: [] };
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { nombre: null, falta: [] };
  const { data: perfil } = await supabase.from("talent_profiles").select("id, nombre").eq("user_id", user.id).maybeSingle();
  if (!perfil) return { nombre: null, falta: [] };
  const [{ count: formas }, { count: etiquetas }] = await Promise.all([
    supabase.from("talent_offers").select("id", { count: "exact", head: true }).eq("talent_id", perfil.id),
    supabase.from("footprint_tags").select("id", { count: "exact", head: true }).eq("talent_id", perfil.id).eq("confirmada", true),
  ]);
  const falta: Falta[] = [];
  if (!etiquetas) falta.push({ href: "/huella", titulo: "Contar tu experiencia", tiempo: "Hablando, unos 5 minutos" });
  if (!formas) falta.push({ href: "/mi-perfil#formas", titulo: "Decir cómo quieres trabajar", tiempo: "3 preguntas" });
  return { nombre: (perfil.nombre as string | null)?.trim().split(/\s+/)[0] || null, falta };
}
