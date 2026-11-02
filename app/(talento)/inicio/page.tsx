import { BookOpen, Lightbulb, UserRound, Wallet } from "lucide-react";
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
  const [nuevas, nombre] = await Promise.all([
    listarOportunidades().then((o) => o.filter((x) => x.estado === "enviada_talento").length),
    primerNombre(),
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

      <section aria-labelledby="siguiente" className="overflow-hidden rounded-lg bg-deep text-on-deep">
        <div className="relative h-40">
          <Image
            src={nuevas > 0 ? "/web/home/gerente.webp" : "/web/home/carpintero.webp"}
            alt=""
            fill
            priority
            sizes="(min-width: 640px) 36rem, 100vw"
            className="object-cover object-[center_25%]"
          />
        </div>
        <div className="flex flex-col items-start gap-3 p-5">
          {nuevas > 0 && (
            <span className="rounded-full bg-accent px-3 py-0.5 text-base font-bold text-on-accent">Te toca a ti</span>
          )}
          <h2 id="siguiente" className="text-2xl">
            {nuevas === 0
              ? "Cuéntanos qué sabes hacer"
              : nuevas === 1
                ? "Una organización quiere conocerte"
                : `${nuevas} organizaciones quieren conocerte`}
          </h2>
          {nuevas === 0 && <p className="text-azul-claro">Hablando toma unos 5 minutos.</p>}
          <Button asChild variant="acento" ancho="completo" className="mt-1">
            <Link href={nuevas > 0 ? "/oportunidades" : "/huella"}>{nuevas > 0 ? "Ver de qué se trata" : "Contar mi historia"}</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-3">
        <h2 id="como-funciona" className="text-xl">
          Mira cómo funciona
        </h2>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none]">
          {["como-funciona", "te-quieren-conocer", "estafas"].map((id) => (
            <TarjetaVideo key={id} v={video(id)} />
          ))}
        </div>
      </section>

      <nav aria-label="Atajos" className="grid grid-cols-2 gap-3">
        {ATAJOS.map(({ href, etiqueta, icono: Icono, fondo }) => (
          <Link key={href} href={href} className="flex min-h-28 flex-col justify-between gap-3 rounded-lg bg-raised p-4 shadow-tarjeta transition-transform duration-100 active:scale-[0.97]">
            <span className={`grid size-11 place-items-center rounded-md ${fondo}`}>
              <Icono aria-hidden className="size-6" />
            </span>
            <span className="font-bold leading-tight">{etiqueta}</span>
          </Link>
        ))}
      </nav>

      <AvisoBienestar />
    </div>
  );
}

const ATAJOS = [
  { href: "/mi-perfil", etiqueta: "Mi perfil", icono: UserRound, fondo: "bg-azul-claro/50" },
  { href: "/mi-perfil/pagos", etiqueta: "Cómo me pagan", icono: Wallet, fondo: "bg-accent/50" },
  { href: "/aprende", etiqueta: "Aprende", icono: BookOpen, fondo: "bg-exito-fondo" },
  { href: "/emprende", etiqueta: "Emprende", icono: Lightbulb, fondo: "bg-campo-claro" },
];

async function primerNombre(): Promise<string | null> {
  if (MODO_DEMO) return "Gloria";
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("talent_profiles").select("nombre").eq("user_id", user.id).maybeSingle();
  const nombre = (data?.nombre as string | null)?.trim().split(/\s+/)[0];
  return nombre || null;
}
