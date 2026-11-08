"use client";

import { Check, Mic, PenLine, Phone, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { ImportarHojaVida } from "@/components/perfil/importar-hoja-vida";
import { ChipAlternable } from "@/components/huella/chip";
import { Dictado } from "@/components/huella/dictado";
import { Pantalla } from "@/components/layout/pantalla";
import { EscucharPantalla, FraseConVoz, TarjetaVideo } from "@/components/talento/voz";
import { Button } from "@/components/ui/button";
import { Campo, Textarea } from "@/components/ui/campo";
import { ayudaCapa, MAX_ETIQUETA_LIBRE, nombreCapa, ORDEN_CAPAS, problemaEtiquetaLibre, separarEtiquetas } from "@/lib/capas";
import { prepararHistoria } from "@/lib/ia/preparar";
import { EJEMPLO_HISTORIA, PREGUNTAS_GUIA, video } from "@/lib/talento/videos";
import type { Capa } from "@/lib/ia/tipos";

import { confirmarHuella, guardarHistoria, type EstadoHuella } from "./acciones";

type Modo = "escribir" | "dictar";

type Props = { ia: boolean; nombre: string | null; historiaInicial?: string };

export function FormularioHuella({ ia, nombre, historiaInicial }: Props) {
  const [estado, guardar, guardando] = useActionState<EstadoHuella, FormData>(guardarHistoria, {});

  if (estado.historiaId) return <Confirmar estado={estado} />;
  return (
    <Contar
      historiaInicial={historiaInicial}
      ia={ia}
      nombre={nombre}
      estado={estado}
      guardar={guardar}
      guardando={guardando}
    />
  );
}

// Paso 1 de 2. Hablar es lo principal: un micrófono grande, un ejemplo y tres preguntas guía que
// también se escuchan. Escribir o que te llamen quedan a un toque.
function Contar({
  historiaInicial,
  ia,
  nombre,
  estado,
  guardar,
  guardando,
}: {
  historiaInicial?: string;
  ia: boolean;
  nombre: string | null;
  estado: EstadoHuella;
  guardar: (d: FormData) => void;
  guardando: boolean;
}) {
  const [modo, setModo] = useState<Modo>(historiaInicial ? "escribir" : "dictar");
  const [historia, setHistoria] = useState(historiaInicial ?? "");

  // Lo mismo que hará el servidor antes de enviarla al asistente: se lo contamos a la persona.
  const revision = useMemo(
    () => (ia && historia.length > 20 ? prepararHistoria(historia, nombre) : null),
    [ia, historia, nombre],
  );
  const quitados = revision
    ? [
        revision.reemplazos.fechas + revision.reemplazos.tiempos > 0 && "las fechas y edades",
        revision.reemplazos.contacto > 0 && "los datos de contacto",
        revision.reemplazos.documentos > 0 && "los números de documento",
        revision.reemplazos.nombre > 0 && "tu nombre",
      ].filter((x): x is string => Boolean(x))
    : [];
  const listaQuitados = new Intl.ListFormat("es", {
    type: "conjunction",
  }).format(quitados);
  const verTexto = modo === "escribir" || historia.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div role="img" aria-label="Paso 1 de 2" className="flex gap-1.5">
          <span className="h-2 flex-1 rounded-full bg-primary" />
          <span className="h-2 flex-1 rounded-full bg-surface-strong" />
        </div>
        <h1 className="text-3xl">Cuéntanos qué sabes hacer</h1>
        <EscucharPantalla />
      </div>

      <div className="flex flex-col gap-2.5">
        <TarjetaVideo v={{ ...video("contar-historia"), titulo: "Escucha un ejemplo", guion: EJEMPLO_HISTORIA }} forma="fila" />
        {PREGUNTAS_GUIA.map((p, i) => (
          <FraseConVoz key={p} id={`pregunta-${i}`} texto={p} />
        ))}
      </div>

      <form action={guardar} className="flex flex-col gap-6">
        <input type="hidden" name="origen" value={modo === "dictar" ? "dictado" : "escrito"} />
        {modo === "dictar" && (
          <Dictado
            onTexto={(t) => setHistoria((h) => (h ? `${h} ${t}` : t))}
            onNoSoportado={() => setModo("escribir")}
          />
        )}

        <div data-no-leer className="flex flex-wrap justify-center gap-2">
          {modo === "dictar" ? (
            <button type="button" onClick={() => setModo("escribir")} className={pildora}>
              <PenLine aria-hidden className="size-5" />
              Prefiero escribir
            </button>
          ) : (
            <button type="button" onClick={() => setModo("dictar")} className={pildora}>
              <Mic aria-hidden className="size-5" />
              Prefiero hablar
            </button>
          )}
          <Link href="/ayuda#llameme" className={pildora}>
            <Phone aria-hidden className="size-5" />
            Que me llamen
          </Link>
        </div>

        {verTexto && (
          <Campo
            id="historia"
            etiqueta={modo === "dictar" ? "Lo que dijiste (puedes corregirlo)" : "Tu historia"}
            ayuda="No importa la ortografía. Cuenta detalles: dónde era, con quién, qué hiciste."
            error={estado.error}
          >
            {(p) => (
              <Textarea
                {...p}
                name="historia"
                rows={8}
                value={historia}
                onChange={(e) => setHistoria(e.target.value)}
                className={`${p.className} bg-raised`}
              />
            )}
          </Campo>
        )}
        {!verTexto && estado.error && (
          <p role="alert" className="font-bold text-danger">
            {estado.error}
          </p>
        )}

        {revision && (quitados.length > 0 || revision.nombresPosibles.length > 0) && (
          <div className="flex flex-col gap-3 rounded-md bg-raised p-4">
            {quitados.length > 0 && (
              <p className="flex items-start gap-3">
                <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0" />
                <span>Antes de enviarla al asistente quitamos {listaQuitados}. Tu texto aquí no cambia.</span>
              </p>
            )}
            {revision.nombresPosibles.length > 0 && (
              <p>
                ¿Estos son nombres de otras personas?{" "}
                <span className="font-bold">{revision.nombresPosibles.join(", ")}</span>. Si quieres, cámbialos por el
                cargo, por ejemplo «el jefe de planta».
              </p>
            )}
          </div>
        )}

        {verTexto && (
          <Button type="submit" ancho="completo" disabled={guardando || !historia.trim()}>
            {guardando
              ? ia
                ? "Leyendo tu historia…"
                : "Guardando…"
              : ia
                ? "Seguir: ver lo que entendimos"
                : "Guardar mi historia"}
          </Button>
        )}
      </form>

      <ImportarHojaVida
        onConfirmar={(d) => {
          setHistoria(d.historia);
          setModo("escribir");
        }}
      />

      <Link
        href="/inicio"
        className="inline-flex min-h-tap items-center self-start text-base font-bold underline underline-offset-4"
      >
        Hacerlo más tarde
      </Link>
    </div>
  );
}

const pildora =
  "inline-flex min-h-tap items-center gap-2 rounded-full bg-raised px-4 text-base font-bold shadow-tarjeta transition-transform duration-100 active:scale-[0.97]";

const MENSAJE_MANUAL = {
  apagada: "Elige solo lo que se parezca a lo tuyo. Si no lo encuentras, escríbelo con tus palabras.",
  cuota: "Hoy ya usaste el asistente varias veces. Tu historia quedó guardada: elige tus etiquetas o escríbelas.",
  error: "El asistente no respondió. Tu historia quedó guardada: elige tus etiquetas o escríbelas.",
};

type Libre = { capa: Capa; texto: string };

function Confirmar({ estado }: { estado: EstadoHuella }) {
  const propuestas = estado.etiquetas ?? [];
  // Las del asistente salen de la historia y llegan marcadas; las del catálogo (por palabras
  // sueltas) llegan sin marcar: la persona toca solo las que son suyas.
  const [seleccionadas, setSeleccionadas] = useState<string[]>(propuestas.filter((e) => !e.catalogo).map((e) => e.id));
  const [libres, setLibres] = useState<Libre[]>([]);
  const [resultado, confirmar, confirmando] = useActionState<{ error?: string }, FormData>(confirmarHuella, {});
  const manual = estado.modo === "manual";
  const conPropuestas = propuestas.length > 0;
  // Desplegables guiados: abre solo la primera parte (la primera con propuestas, si hay);
  // «Listo, seguir» cierra la actual y abre la siguiente. El contador del título muestra lo elegido.
  const [abiertas, setAbiertas] = useState<Capa[]>(() => [
    ORDEN_CAPAS.find((c) => propuestas.some((e) => e.capa === c)) ?? "oficio",
  ]);
  const abrir = (capa: Capa, abierta: boolean) =>
    setAbiertas((x) => (abierta ? [...new Set([...x, capa])] : x.filter((c) => c !== capa)));
  const seguir = (capa: Capa) => {
    const siguiente = ORDEN_CAPAS[ORDEN_CAPAS.indexOf(capa) + 1];
    setAbiertas((x) => [...x.filter((c) => c !== capa), ...(siguiente ? [siguiente] : [])]);
    if (siguiente) requestAnimationFrame(() => document.getElementById(`capa-${siguiente}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) =>
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

  const introManual = conPropuestas
    ? "Encontramos estas palabras en tu historia. Toca las que son tuyas y escribe con tus palabras lo que falte."
    : MENSAJE_MANUAL[estado.motivoManual ?? "apagada"];

  return (
    <Pantalla
      antesDelTitulo={
        <div role="img" aria-label="Paso 2 de 2" className="flex gap-1.5">
          <span className="h-2 flex-1 rounded-full bg-primary" />
          <span className="h-2 flex-1 rounded-full bg-primary" />
        </div>
      }
      titulo={manual ? "Escribe lo que sabes hacer" : "Esto entendimos de tu historia"}
      intro={
        manual ? introManual : "Quita lo que no sea tuyo tocando la etiqueta. Puedes agregar otras o escribirlas con tus palabras."
      }
    >
      <form action={confirmar} className="flex flex-col gap-8">
        <input type="hidden" name="historiaId" value={estado.historiaId} />
        {seleccionadas.map((id) => (
          <input
            key={id}
            type="hidden"
            // Las del catálogo todavía no existen en la huella: se agregan al confirmar.
            name={propuestas.find((e) => e.id === id)?.catalogo ? "agregada" : "seleccionada"}
            value={id}
          />
        ))}
        {libres.map((l) => (
          <input key={`${l.capa}:${l.texto}`} type="hidden" name="libre" value={`${l.capa}|${l.texto}`} />
        ))}

        <div className="flex flex-col gap-3">
          {ORDEN_CAPAS.map((capa, i) => {
            const deCapa = propuestas.filter((e) => e.capa === capa);
            const propias = libres.filter((l) => l.capa === capa);
            const elegidas = deCapa.filter((e) => seleccionadas.includes(e.id)).length + propias.length;
            const ultima = i === ORDEN_CAPAS.length - 1;
            return (
              <details
                key={capa}
                id={`capa-${capa}`}
                open={abiertas.includes(capa)}
                onToggle={(e) => abrir(capa, e.currentTarget.open)}
                className="scroll-mt-24 rounded-lg bg-raised px-4 shadow-tarjeta"
              >
                <summary className="flex min-h-action cursor-pointer items-center justify-between gap-3 text-lg font-bold">
                  {nombreCapa[capa]}
                  {elegidas > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-3 text-base whitespace-nowrap">
                      <Check aria-hidden className="size-4" />
                      {elegidas} {elegidas === 1 ? "elegida" : "elegidas"}
                    </span>
                  )}
                </summary>
                <div className="flex flex-col gap-4 pb-5">
                  <p className="text-base text-text-muted">{ayudaCapa[capa]}</p>
                  {deCapa.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {deCapa.map((e) => (
                        <ChipAlternable
                          key={e.id}
                          texto={e.etiqueta}
                          nueva={e.nueva}
                          activo={seleccionadas.includes(e.id)}
                          onAlternar={() => alternar(seleccionadas, setSeleccionadas, e.id)}
                        />
                      ))}
                    </div>
                  )}
                  {propias.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {propias.map((l) => (
                        <ChipAlternable
                          key={l.texto}
                          texto={l.texto}
                          nueva
                          activo
                          onAlternar={() => setLibres((x) => x.filter((y) => !(y.capa === capa && y.texto === l.texto)))}
                        />
                      ))}
                    </div>
                  )}
                  <EscribirOtra
                    capa={capa}
                    hayPropuestas={deCapa.length > 0}
                    onAgregar={(texto) =>
                      setLibres((x) =>
                        x.some((y) => y.capa === capa && y.texto.toLowerCase() === texto.toLowerCase())
                          ? x
                          : [...x, { capa, texto }],
                      )
                    }
                  />
                  <Button type="button" variant="suave" className="self-start" onClick={() => seguir(capa)}>
                    {ultima ? "Listo con esta parte" : "Listo, seguir"}
                  </Button>
                </div>
              </details>
            );
          })}
        </div>

        <p className="text-base text-text-muted">
          Lo que escribas con tus palabras lo revisa el equipo antes de que lo vea una empresa. Puedes dejar partes vacías.
        </p>

        {estado.dudas && estado.dudas.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
            <h2 className="text-lg">Para que tu historia quede más clara</h2>
            <p className="text-text-muted">Si quieres, cuenta esto en otra historia desde Mi perfil:</p>
            <ul className="list-disc pl-6">
              {estado.dudas.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-base text-text-muted">
          Al confirmar, las empresas pueden encontrar tu perfil según lo que elegiste: reservado o visible.
        </p>

        {resultado.error && (
          <p role="alert" className="font-bold text-danger">
            {resultado.error}
          </p>
        )}
        <Button type="submit" ancho="completo" disabled={confirmando}>
          {confirmando ? "Guardando…" : "Confirmar mis etiquetas"}
        </Button>
      </form>
    </Pantalla>
  );
}

// Campo para escribir una etiqueta propia. Vive dentro del formulario principal, así que Enter
// agrega la etiqueta en vez de enviar todo.
function EscribirOtra({
  capa,
  hayPropuestas,
  onAgregar,
}: {
  capa: Capa;
  hayPropuestas: boolean;
  onAgregar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = `otra-${capa}`;

  const agregar = () => {
    const partes = separarEtiquetas(texto);
    // Agregar sin haber escrito nada no es un error: solo lleva al campo.
    if (!partes.length) {
      setError(null);
      document.getElementById(id)?.focus();
      return;
    }
    // Las que están bien se agregan; las que tienen un problema se quedan en el campo para corregir.
    const malas: string[] = [];
    let problema: string | null = null;
    for (const parte of partes) {
      const p = problemaEtiquetaLibre(parte);
      if (p) {
        problema ??= `«${parte}»: ${p}`;
        malas.push(parte);
      } else onAgregar(parte);
    }
    setError(problema);
    setTexto(malas.join(", "));
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold">
        {hayPropuestas ? "¿Falta algo? Escríbelo con tus palabras" : "Escríbelo con tus palabras"}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          value={texto}
          maxLength={MAX_ETIQUETA_LIBRE * 6}
          autoComplete="off"
          aria-describedby={error ? `${id}-error` : `${id}-ayuda`}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setTexto(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          className="min-h-action flex-1 rounded-sm border-2 border-border bg-bg px-4 text-base focus-visible:border-text"
        />
        <Button type="button" variant="secundario" onClick={agregar}>
          <Plus aria-hidden />
          Agregar
        </Button>
      </div>
      <p id={`${id}-ayuda`} className="text-base text-text-muted">
        Si son varias, sepáralas con comas.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
