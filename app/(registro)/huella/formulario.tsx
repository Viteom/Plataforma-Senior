"use client";

import { Mic, PenLine, Phone, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { ImportarHojaVida } from "@/components/perfil/importar-hoja-vida";
import { ChipAlternable } from "@/components/huella/chip";
import { Dictado } from "@/components/huella/dictado";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Textarea } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { ayudaCapa, MAX_ETIQUETA_LIBRE, nombreCapa, ORDEN_CAPAS, problemaEtiquetaLibre } from "@/lib/capas";
import { prepararHistoria } from "@/lib/ia/preparar";
import type { Capa } from "@/lib/ia/tipos";

import { confirmarHuella, guardarHistoria, type EstadoHuella } from "./acciones";

type Modo = "escribir" | "dictar" | "llamada";

const modos = [
  {
    valor: "escribir" as const,
    titulo: "Escribirla",
    descripcion: "A tu ritmo, con tus palabras.",
    icono: PenLine,
  },
  {
    valor: "dictar" as const,
    titulo: "Contarla hablando",
    descripcion: "El celular escribe lo que dices.",
    icono: Mic,
  },
  {
    valor: "llamada" as const,
    titulo: "Que me llamen",
    descripcion: "Una persona del equipo te ayuda por teléfono.",
    icono: Phone,
  },
];

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
  const [modo, setModo] = useState<Modo>("escribir");
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

  return (
    <Pantalla
      titulo="Cuéntanos un reto difícil que resolviste"
      intro="¿Qué pasó, qué hiciste y cómo terminó? Con eso armamos tu huella de experiencia: lo que las empresas ven de ti."
    >
      <ImportarHojaVida
        onConfirmar={(d) => {
          setHistoria(d.historia);
          setModo("escribir");
        }}
      />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿Cómo prefieres contarla?</legend>
        {modos.map(({ valor, titulo, descripcion, icono: Icono }) => (
          <Opcion
            key={valor}
            name="modo"
            value={valor}
            checked={modo === valor}
            onChange={() => setModo(valor)}
            icono={<Icono aria-hidden className="mt-0.5 size-6 shrink-0" />}
            titulo={titulo}
            descripcion={descripcion}
          />
        ))}
      </fieldset>

      {modo === "llamada" ? (
        <div className="flex flex-col gap-6">
          <p className="text-lg">
            Déjanos tu número y la hora en que te queda bien. Nunca te vamos a pedir códigos, contraseñas ni dinero.
          </p>
          <Button asChild ancho="completo">
            <Link href="/ayuda#llameme">Pedir que me llamen</Link>
          </Button>
        </div>
      ) : (
        <form action={guardar} className="flex flex-col gap-6">
          <input type="hidden" name="origen" value={modo === "dictar" ? "dictado" : "escrito"} />
          {modo === "dictar" && <Dictado onTexto={(t) => setHistoria((h) => (h ? `${h} ${t}` : t))} />}
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
              />
            )}
          </Campo>

          {revision && (quitados.length > 0 || revision.nombresPosibles.length > 0) && (
            <div className="flex flex-col gap-3 rounded-md bg-surface p-4">
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

          {!ia && (
            <p className="text-base text-text-muted">
              Después de guardarla, puedes escribir con tus palabras las capacidades que quieres destacar.
            </p>
          )}

          <Button type="submit" ancho="completo" disabled={guardando}>
            {guardando
              ? ia
                ? "Leyendo tu historia…"
                : "Guardando…"
              : ia
                ? "Guardar y ver mis etiquetas"
                : "Guardar mi historia"}
          </Button>
        </form>
      )}

      <Link
        href="/inicio"
        className="inline-flex min-h-tap items-center self-start text-base font-bold underline underline-offset-4"
      >
        Hacerlo más tarde
      </Link>
    </Pantalla>
  );
}

const MENSAJE_MANUAL = {
  apagada: "Elige solo lo que se parezca a lo tuyo. Si no lo encuentras, escríbelo con tus palabras.",
  cuota: "Hoy ya usaste el asistente varias veces. Tu historia quedó guardada: elige tus etiquetas o escríbelas.",
  error: "El asistente no respondió. Tu historia quedó guardada: elige tus etiquetas o escríbelas.",
};

type Libre = { capa: Capa; texto: string };

function Confirmar({ estado }: { estado: EstadoHuella }) {
  const propuestas = estado.etiquetas ?? [];
  const [seleccionadas, setSeleccionadas] = useState<string[]>(propuestas.map((e) => e.id));
  const [libres, setLibres] = useState<Libre[]>([]);
  const [resultado, confirmar, confirmando] = useActionState<{ error?: string }, FormData>(confirmarHuella, {});
  const manual = estado.modo === "manual";

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) =>
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

  return (
    <Pantalla
      titulo={manual ? "Escribe lo que sabes hacer" : "Esto entendimos de tu historia"}
      intro={
        manual
          ? MENSAJE_MANUAL[estado.motivoManual ?? "apagada"]
          : "Quita lo que no sea tuyo tocando la etiqueta. Puedes agregar otras o escribirlas con tus palabras."
      }
    >
      <form action={confirmar} className="flex flex-col gap-8">
        <input type="hidden" name="historiaId" value={estado.historiaId} />
        {seleccionadas.map((id) => (
          <input key={id} type="hidden" name="seleccionada" value={id} />
        ))}
        {libres.map((l) => (
          <input key={`${l.capa}:${l.texto}`} type="hidden" name="libre" value={`${l.capa}|${l.texto}`} />
        ))}

        {ORDEN_CAPAS.map((capa) => {
          const deCapa = propuestas.filter((e) => e.capa === capa);
          const propias = libres.filter((l) => l.capa === capa);
          return (
            <details key={capa} open={deCapa.length > 0 || capa === "oficio"} className="flex flex-col gap-3">
              <summary className="min-h-tap cursor-pointer text-lg font-bold">{nombreCapa[capa]}</summary>
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
                onAgregar={(texto) =>
                  setLibres((x) =>
                    x.some((y) => y.capa === capa && y.texto.toLowerCase() === texto.toLowerCase())
                      ? x
                      : [...x, { capa, texto }],
                  )
                }
              />
            </details>
          );
        })}

        <p className="text-base text-text-muted">
          Lo que escribas con tus palabras lo revisa el equipo antes de que lo vea una empresa.
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
function EscribirOtra({ capa, onAgregar }: { capa: Capa; onAgregar: (texto: string) => void }) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = `otra-${capa}`;

  const agregar = () => {
    const limpio = texto.replace(/\s+/g, " ").trim();
    const problema = problemaEtiquetaLibre(limpio);
    setError(problema);
    if (problema) return;
    onAgregar(limpio);
    setTexto("");
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-bold">
        ¿No está? Escríbelo con tus palabras
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          value={texto}
          maxLength={MAX_ETIQUETA_LIBRE}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => setTexto(e.target.value)}
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
      {error && (
        <p id={`${id}-error`} role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
