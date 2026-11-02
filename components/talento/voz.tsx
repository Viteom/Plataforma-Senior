"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import Image from "next/image";

import type { VideoTalento } from "@/lib/talento/videos";
import { cn } from "@/lib/utils";
import { textoDe, useVoz } from "@/lib/voz";

// Piezas de voz del talento: todo se puede escuchar con la voz del celular. Si el navegador no
// tiene voz, los botones de escuchar no aparecen y el texto sigue ahí.

// «Escuchar esta pantalla»: lee el contenido principal, sin los botones de voz ni la ayuda.
export function EscucharPantalla({ className }: { className?: string }) {
  const { disponible, sonando, alternar } = useVoz();
  if (!disponible) return null;
  const activo = sonando === "pantalla";

  return (
    <button
      type="button"
      data-no-leer
      aria-pressed={activo}
      onClick={() => alternar("pantalla", textoDe(document.getElementById("contenido")))}
      className={cn(
        "inline-flex min-h-tap items-center gap-3 self-start rounded-full bg-raised py-1.5 pr-5 pl-1.5 text-base font-bold shadow-tarjeta",
        className,
      )}
    >
      <span className="grid size-9 place-items-center rounded-full bg-primary text-on-primary">
        {activo ? <Pause aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-5" />}
      </span>
      {activo ? "Detener" : "Escuchar esta pantalla"}
    </button>
  );
}

// Una frase que se puede oír: la pregunta va escrita y el botón la lee.
export function FraseConVoz({ id, texto }: { id: string; texto: string }) {
  const { disponible, sonando, alternar } = useVoz();
  const activo = sonando === id;

  if (!disponible) return <p className="rounded-md bg-raised px-4 py-3">{texto}</p>;
  return (
    <button
      type="button"
      data-no-leer
      aria-pressed={activo}
      onClick={() => alternar(id, texto)}
      className="flex min-h-action w-full items-center gap-3 rounded-md bg-raised px-3 py-2 text-left"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
        {activo ? <Pause aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-5" />}
      </span>
      <span>
        {texto}
        <span className="sr-only">{activo ? " (detener)" : " (escuchar)"}</span>
      </span>
    </button>
  );
}

// Audio de una oportunidad u otro contenido: un reproductor grande, oscuro, con el tiempo aproximado.
export function Reproductor({ id, titulo, texto }: { id: string; titulo: string; texto: string }) {
  const { disponible, sonando, alternar } = useVoz();
  if (!disponible) return null;
  const activo = sonando === id;
  const minutos = Math.max(1, Math.round(texto.split(/\s+/).length / 140));

  return (
    <button
      type="button"
      data-no-leer
      aria-pressed={activo}
      onClick={() => alternar(id, texto)}
      className="flex min-h-action w-full items-center gap-4 rounded-lg bg-primary px-4 py-3.5 text-left text-on-primary"
    >
      <span className="grid size-13 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
        {activo ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5 fill-current" />}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="font-bold">{activo ? "Detener" : titulo}</span>
        <Ondas activo={activo} />
      </span>
      <span className="text-base text-azul-claro">{minutos} min</span>
    </button>
  );
}

function Ondas({ activo }: { activo: boolean }) {
  const altos = [10, 20, 14, 24, 12, 22, 16, 26, 10, 18, 14, 20, 9, 15];
  return (
    <span aria-hidden className="mt-1.5 flex h-7 items-center gap-[3px]">
      {altos.map((h, i) => (
        <span
          key={i}
          style={{ height: h }}
          className={cn("w-1 rounded-full", activo ? "onda bg-accent" : i < 3 ? "bg-accent" : "bg-white/45")}
        />
      ))}
    </span>
  );
}

// Tarjeta de video. Sin video grabado todavía, se escucha el guion; con `src`, se reproduce el video.
export function TarjetaVideo({ v, forma = "carrusel" }: { v: VideoTalento; forma?: "carrusel" | "fila" | "destacado" }) {
  const { disponible, sonando, alternar } = useVoz();
  const activo = sonando === v.id;

  if (v.src)
    return (
      <video controls preload="none" poster={v.foto} className="w-full rounded-lg bg-deep">
        <source src={v.src} />
      </video>
    );
  if (!disponible) return null;

  const icono = activo ? <Pause aria-hidden className="size-5" /> : <Play aria-hidden className="size-5 fill-current" />;
  const duracion = `${v.minutos} min · con voz`;
  const tocar = () => alternar(v.id, v.guion);

  if (forma === "fila")
    return (
      <button type="button" data-no-leer aria-pressed={activo} onClick={tocar} className="flex w-full items-center gap-3 rounded-lg bg-raised p-2.5 text-left shadow-tarjeta">
        <span className="relative h-18 w-24 shrink-0 overflow-hidden rounded-md">
          <Image src={v.foto} alt="" fill sizes="96px" className="object-cover object-[center_22%]" />
          <span className="absolute inset-0 grid place-items-center bg-deep/30 text-white">{icono}</span>
        </span>
        <span className="flex flex-col">
          <span className="font-bold">{activo ? "Detener" : v.titulo}</span>
          <span className="text-base text-text-muted">{duracion}</span>
        </span>
      </button>
    );

  if (forma === "destacado")
    return (
      <button type="button" data-no-leer aria-pressed={activo} onClick={tocar} className="relative block h-60 w-full overflow-hidden rounded-lg text-left text-white">
        <Image src={v.foto} alt="" fill sizes="(min-width: 640px) 36rem, 100vw" className="object-cover object-[center_22%]" />
        <span className="velo-video absolute inset-0" />
        <span className="absolute top-4 right-4 grid size-15 place-items-center rounded-full bg-accent text-on-accent">{icono}</span>
        <span className="absolute inset-x-5 bottom-5 flex flex-col items-start gap-2">
          <span className="rounded-full bg-white/15 px-3 py-0.5 text-base font-bold">{duracion}</span>
          <span className="font-web text-2xl font-semibold tracking-tight">{activo ? "Detener" : v.titulo}</span>
        </span>
      </button>
    );

  return (
    <button type="button" data-no-leer aria-pressed={activo} onClick={tocar} className="flex w-56 shrink-0 snap-start flex-col overflow-hidden rounded-lg bg-raised text-left shadow-tarjeta">
      <span className="relative block h-32">
        <Image src={v.foto} alt="" fill sizes="224px" className="object-cover object-[center_22%]" />
        <span className="velo-video absolute inset-0" />
        <span className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-full bg-white text-primary">{icono}</span>
        <span className="absolute right-3 bottom-3 rounded-full bg-deep/60 px-2 text-sm font-bold text-white">{v.minutos} min</span>
      </span>
      <span className="px-4 pt-3 pb-4 font-bold leading-snug">{activo ? "Detener" : v.titulo}</span>
    </button>
  );
}
