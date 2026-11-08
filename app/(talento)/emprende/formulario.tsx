"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Opcion } from "@/components/ui/opcion";
import { useAccion } from "@/components/ui/use-accion";
import { CATEGORIAS, ETAPAS, IDEA_MAX, NECESIDADES, preguntaPaso, RESPUESTA_MAX, type Categoria, type Etapa, type Necesidad, type Paso } from "@/lib/emprende/ruta";

import { guardarDiagnostico, guardarRespuesta, marcarPaso, type EstadoDiagnostico } from "./acciones";

type Inicial = {
  etapa: Etapa;
  necesidades: Necesidad[];
  idea: string | null;
  asesoria: boolean;
  categoria: Categoria | null;
  oportunidades: boolean;
} | null;

export function Diagnostico({ inicial }: { inicial?: Inicial }) {
  const [etapa, setEtapa] = useState<Etapa | null>(inicial?.etapa ?? null);
  const [necesidades, setNecesidades] = useState<Necesidad[]>(inicial?.necesidades ?? []);
  const [asesoria, setAsesoria] = useState(inicial?.asesoria ?? false);
  const [categoria, setCategoria] = useState<Categoria | null>(inicial?.categoria ?? null);
  const [oportunidades, setOportunidades] = useState(inicial?.oportunidades ?? false);
  const { estado, enviar, pendiente, alEnviar } = useAccion<EstadoDiagnostico>(guardarDiagnostico, {});

  // Con cuenta, al guardar se vuelve a la ruta guardada. Esto solo se ve en la demostración o
  // si todavía no hay perfil: la ruta se muestra, pero no queda guardada.
  if (estado.ruta) {
    return (
      <section aria-labelledby="ruta" className="flex flex-col gap-5">
        <h2 id="ruta" className="text-xl">
          Tu ruta
        </h2>
        {estado.idea && <p className="rounded-md bg-surface p-4">Tu idea: {estado.idea}</p>}
        <ol className="flex flex-col gap-4">
          {estado.ruta.map((p, i) => (
            <PasoRuta key={p.clave} paso={p} numero={i + 1} hechoInicial={false} />
          ))}
        </ol>
        {estado.asesoria && (
          <p role="status" className="rounded-md bg-surface p-4 font-bold">
            Listo: alguien del equipo te contacta para la asesoría.
          </p>
        )}
      </section>
    );
  }

  return (
    <form action={enviar} onSubmit={alEnviar} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="idea" className="text-lg font-bold">
          Cuéntanos tu idea o tu negocio (opcional)
        </label>
        <p id="idea-ayuda" className="text-text-muted">
          Con tus palabras. Por ejemplo: «quiero vender cerámica pintada a mano».
        </p>
        <textarea
          id="idea"
          name="idea"
          defaultValue={inicial?.idea ?? ""}
          maxLength={IDEA_MAX}
          rows={3}
          aria-describedby="idea-ayuda"
          className="rounded-sm border-2 border-border bg-bg p-4 text-lg focus-visible:border-text"
        />
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿De qué es tu negocio?</legend>
        {CATEGORIAS.map((c) => (
          <Opcion key={c.valor} name="categoria" value={c.valor} checked={categoria === c.valor} onChange={() => setCategoria(c.valor)} titulo={c.etiqueta} />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿En qué va tu negocio?</legend>
        {ETAPAS.map((e) => (
          <Opcion key={e.valor} name="etapa" value={e.valor} checked={etapa === e.valor} onChange={() => setEtapa(e.valor)} titulo={e.etiqueta} />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-bold">¿Con qué necesitas ayuda?</legend>
        <p className="mb-2 text-text-muted">Puedes elegir varias.</p>
        {NECESIDADES.map((n) => (
          <Opcion
            key={n.valor}
            tipo="checkbox"
            name="necesidades"
            value={n.valor}
            checked={necesidades.includes(n.valor)}
            onChange={() => setNecesidades((x) => (x.includes(n.valor) ? x.filter((v) => v !== n.valor) : [...x, n.valor]))}
            titulo={n.etiqueta}
          />
        ))}
      </fieldset>
      <Opcion
        tipo="checkbox"
        name="oportunidades"
        value="si"
        checked={oportunidades}
        onChange={() => setOportunidades(!oportunidades)}
        titulo="Quiero recibir ferias y lugares para vender"
        descripcion="Te sumamos al grupo de emprendedores de Kánna y te escribimos cuando haya algo para tu tipo de negocio. Puedes quitarlo cuando quieras."
      />
      <Opcion tipo="checkbox" name="asesoria" value="si" checked={asesoria} onChange={() => setAsesoria(!asesoria)} titulo="Quiero que alguien me asesore" descripcion="Una persona del equipo te contacta." />
      {estado.error && (
        <p role="alert" className="font-bold text-danger">
          {estado.error}
        </p>
      )}
      <Button type="submit" ancho="completo" disabled={pendiente}>
        {pendiente ? "Guardando…" : inicial ? "Guardar mis respuestas" : "Ver mi ruta"}
      </Button>
      {inicial && (
        <Link href="/emprende" className={buttonVariants({ variant: "enlace", size: "normal", className: "self-center" })}>
          Volver a mi ruta sin cambiar nada
        </Link>
      )}
    </form>
  );
}

// Un paso de la ruta: se marca «Ya lo hice» y queda guardado. El cambio se ve al instante; si no se
// pudo guardar, vuelve atrás y lo dice.
export function PasoRuta({
  paso,
  numero,
  hechoInicial,
  respuestaInicial = "",
}: {
  paso: Paso;
  numero: number;
  hechoInicial: boolean;
  respuestaInicial?: string;
}) {
  const [hecho, setHecho] = useState(hechoInicial);
  const [error, setError] = useState(false);
  const [guardando, iniciar] = useTransition();

  const alternar = () => {
    const nuevo = !hecho;
    setHecho(nuevo);
    setError(false);
    iniciar(async () => {
      const r = await marcarPaso(paso.clave, nuevo);
      if (!r.ok) {
        setHecho(!nuevo);
        setError(true);
      }
    });
  };

  return (
    <li className="flex gap-4">
      <span
        aria-hidden
        className={`flex size-10 shrink-0 items-center justify-center rounded-full font-bold ${hecho ? "bg-exito-fondo text-exito-texto" : "bg-surface-strong"}`}
      >
        {hecho ? <Check className="size-6" /> : numero}
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-lg font-bold">
          <span className="sr-only">Paso {numero}: </span>
          {paso.titulo}
          {hecho && <span className="sr-only"> (hecho)</span>}
        </p>
        <p>{paso.descripcion}</p>
        <RespuestaPaso clave={paso.clave} inicial={respuestaInicial} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={hecho ? "suave" : "secundario"} size="normal" aria-pressed={hecho} onClick={alternar} disabled={guardando}>
            <Check aria-hidden />
            {hecho ? "Ya lo hice" : "Marcar como hecho"}
          </Button>
          {paso.tema && (
            <Link href={`/aprende?tema=${paso.tema}`} className={buttonVariants({ variant: "secundario", size: "normal" })}>
              Ver cursos
              <ArrowRight aria-hidden />
            </Link>
          )}
        </div>
        {error && (
          <p role="alert" className="font-bold text-danger">
            No pudimos guardarlo. Intenta de nuevo.
          </p>
        )}
      </div>
    </li>
  );
}

// Una línea para escribir en el paso, ahí mismo: se guarda con su botón o al presionar Enter.
function RespuestaPaso({ clave, inicial }: { clave: string; inicial: string }) {
  const [texto, setTexto] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [guardando, iniciar] = useTransition();
  const id = `respuesta-${clave}`;
  const cambio = texto.trim() !== guardado.trim();

  const guardar = () => {
    if (!cambio) return;
    iniciar(async () => {
      const r = await guardarRespuesta(clave, texto);
      if (r.ok) {
        setGuardado(texto);
        setAviso({ ok: true, texto: texto.trim() ? "Guardado." : "Borrado." });
      } else setAviso({ ok: false, texto: r.error ?? "No pudimos guardarlo. Intenta de nuevo." });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold">
        {preguntaPaso(clave)}
      </label>
      <div className="flex flex-col gap-2">
        {/* Corta, pero sin esconder lo escrito: tres líneas a lo ancho y Enter guarda. */}
        <textarea
          id={id}
          value={texto}
          rows={3}
          maxLength={RESPUESTA_MAX}
          autoComplete="off"
          onChange={(e) => {
            setTexto(e.target.value);
            setAviso(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              guardar();
            }
          }}
          className="min-h-action flex-1 resize-none rounded-sm border-2 border-border bg-bg px-4 py-3 text-lg focus-visible:border-text"
        />
        <Button type="button" variant="secundario" size="normal" className="self-start" onClick={guardar} disabled={guardando || !cambio}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </div>
      <p role="status" className={aviso?.ok === false ? "font-bold text-danger" : "text-base text-text-muted"}>
        {aviso?.texto ?? ""}
      </p>
    </div>
  );
}
