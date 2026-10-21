"use client";

import { Mic, PenLine, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { ChipAlternable } from "@/components/huella/chip";
import { Dictado } from "@/components/huella/dictado";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Textarea } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { nombreCapa } from "@/lib/capas";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import { prepararHistoria } from "@/lib/ia/preparar";
import { CAPAS } from "@/lib/ia/tipos";

import { confirmarHuella, guardarHistoria, type EstadoHuella } from "./acciones";

type Modo = "escribir" | "dictar" | "llamada";

const modos = [
  { valor: "escribir" as const, titulo: "Escribirla", descripcion: "A su ritmo, con sus palabras.", icono: PenLine },
  { valor: "dictar" as const, titulo: "Contarla hablando", descripcion: "El celular escribe lo que usted dice.", icono: Mic },
  { valor: "llamada" as const, titulo: "Que me llamen", descripcion: "Una persona del equipo le ayuda por teléfono.", icono: Phone },
];

type Props = { taxonomia: EntradaTaxonomia[]; ia: boolean; nombre: string | null };

export function FormularioHuella({ taxonomia, ia, nombre }: Props) {
  const [estado, guardar, guardando] = useActionState<EstadoHuella, FormData>(guardarHistoria, {});

  if (estado.historiaId) return <Confirmar estado={estado} taxonomia={taxonomia} />;
  return <Contar ia={ia} nombre={nombre} estado={estado} guardar={guardar} guardando={guardando} />;
}

function Contar({
  ia,
  nombre,
  estado,
  guardar,
  guardando,
}: {
  ia: boolean;
  nombre: string | null;
  estado: EstadoHuella;
  guardar: (d: FormData) => void;
  guardando: boolean;
}) {
  const [modo, setModo] = useState<Modo>("escribir");
  const [historia, setHistoria] = useState("");

  // Lo mismo que hará el servidor antes de enviarla al asistente: se lo contamos a la persona.
  const revision = useMemo(() => (ia && historia.length > 20 ? prepararHistoria(historia, nombre) : null), [ia, historia, nombre]);
  const quitados = revision
    ? [
        revision.reemplazos.fechas + revision.reemplazos.tiempos > 0 && "las fechas y edades",
        revision.reemplazos.contacto > 0 && "los datos de contacto",
        revision.reemplazos.documentos > 0 && "los números de documento",
        revision.reemplazos.nombre > 0 && "su nombre",
      ].filter((x): x is string => Boolean(x))
    : [];
  const listaQuitados = new Intl.ListFormat("es", { type: "conjunction" }).format(quitados);

  return (
    <Pantalla
      titulo="Cuéntenos un problema difícil que resolvió"
      intro="¿Qué pasó, qué hizo usted y cómo terminó? Con eso armamos su huella de experiencia: lo que las empresas ven de usted."
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿Cómo prefiere contarla?</legend>
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
            Déjenos su número y la hora en que le queda bien. Nunca le vamos a pedir códigos, contraseñas ni dinero.
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
            etiqueta={modo === "dictar" ? "Lo que dijo (puede corregirlo)" : "Su historia"}
            ayuda="No importa la ortografía. Cuente detalles: dónde era, cuántas personas, qué normas."
            error={estado.error}
          >
            {(p) => (
              <Textarea {...p} name="historia" rows={8} value={historia} onChange={(e) => setHistoria(e.target.value)} />
            )}
          </Campo>

          {revision && (quitados.length > 0 || revision.nombresPosibles.length > 0) && (
            <div className="flex flex-col gap-3 rounded-md bg-surface p-4">
              {quitados.length > 0 && (
                <p className="flex items-start gap-3">
                  <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0" />
                  <span>
                    Antes de enviarla al asistente quitamos {listaQuitados}. Su texto aquí no cambia.
                  </span>
                </p>
              )}
              {revision.nombresPosibles.length > 0 && (
                <p>
                  ¿Estos son nombres de otras personas?{" "}
                  <span className="font-bold">{revision.nombresPosibles.join(", ")}</span>. Si quiere, cámbielos por el
                  cargo, por ejemplo «el jefe de planta».
                </p>
              )}
            </div>
          )}

          {!ia && (
            <p className="text-base text-text-muted">
              Después de guardarla, usted elige de una lista las palabras que describen su experiencia.
            </p>
          )}

          <Button type="submit" ancho="completo" disabled={guardando}>
            {guardando ? (ia ? "Leyendo su historia…" : "Guardando…") : ia ? "Guardar y ver mis etiquetas" : "Guardar mi historia"}
          </Button>
        </form>
      )}

      <Link href="/inicio" className="inline-flex min-h-tap items-center self-start text-base font-bold underline underline-offset-4">
        Hacerlo más tarde
      </Link>
    </Pantalla>
  );
}

const MENSAJE_MANUAL = {
  apagada: "Elija las palabras que describen su experiencia.",
  cuota: "Hoy ya usó el asistente varias veces. Su historia quedó guardada: elija sus etiquetas de la lista.",
  error: "El asistente no respondió. Su historia quedó guardada: elija sus etiquetas de la lista.",
};

function Confirmar({ estado, taxonomia }: { estado: EstadoHuella; taxonomia: EntradaTaxonomia[] }) {
  const propuestas = estado.etiquetas ?? [];
  const [seleccionadas, setSeleccionadas] = useState<string[]>(propuestas.map((e) => e.id));
  const [agregadas, setAgregadas] = useState<string[]>([]);
  const [resultado, confirmar, confirmando] = useActionState<{ error?: string }, FormData>(confirmarHuella, {});
  const manual = estado.modo === "manual";

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) =>
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

  const yaPropuestas = new Set(propuestas.map((e) => `${e.capa}:${e.etiqueta.toLowerCase()}`));

  return (
    <Pantalla
      titulo={manual ? "Elija sus etiquetas" : "Esto entendimos de su historia"}
      intro={
        manual
          ? MENSAJE_MANUAL[estado.motivoManual ?? "apagada"]
          : "Quite lo que no sea suyo tocando la etiqueta. Puede agregar otras de la lista."
      }
    >
      <form action={confirmar} className="flex flex-col gap-8">
        <input type="hidden" name="historiaId" value={estado.historiaId} />
        {seleccionadas.map((id) => (
          <input key={id} type="hidden" name="seleccionada" value={id} />
        ))}
        {agregadas.map((id) => (
          <input key={id} type="hidden" name="agregada" value={id} />
        ))}

        {CAPAS.map((capa) => {
          const deCapa = propuestas.filter((e) => e.capa === capa);
          const opciones = taxonomia.filter((t) => t.capa === capa && !yaPropuestas.has(`${capa}:${t.etiqueta.toLowerCase()}`));
          if (!deCapa.length && !opciones.length) return null;
          return (
            <section key={capa} aria-labelledby={`capa-${capa}`} className="flex flex-col gap-3">
              <h2 id={`capa-${capa}`} className="text-lg">
                {nombreCapa[capa]}
              </h2>
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
              {opciones.length > 0 && (
                <details open={manual} className="group">
                  <summary className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
                    {manual ? "Opciones" : "Agregar otra"}
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {opciones.map((t) => (
                      <ChipAlternable
                        key={t.id}
                        texto={t.etiqueta}
                        activo={agregadas.includes(t.id)}
                        onAlternar={() => alternar(agregadas, setAgregadas, t.id)}
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          );
        })}

        {estado.dudas && estado.dudas.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md bg-surface p-4">
            <h2 className="text-lg">Para que su historia quede más clara</h2>
            <p className="text-text-muted">Si quiere, cuente esto en otra historia desde Mi perfil:</p>
            <ul className="list-disc pl-6">
              {estado.dudas.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-base text-text-muted">
          Al confirmar, las empresas pueden encontrar su perfil según lo que eligió: reservado o visible.
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
