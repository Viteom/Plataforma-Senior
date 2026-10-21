"use client";

import { Download, Eye, EyeOff, FileText, Pencil, Phone, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Tarifas } from "@/components/perfil/tarifas";
import { Button } from "@/components/ui/button";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { useAccion } from "@/components/ui/use-accion";
import { etiquetaForma, formasContratar, modalidades, pesos, type FormaContratar, type GuiaTarifa } from "@/lib/formas";

import {
  actualizarDatos,
  actualizarFormas,
  agregarReferencia,
  borrarCuenta,
  borrarEvidencia,
  cambiarAutorizacion,
  descargarDatos,
  subirArchivo,
  type Estado,
} from "./acciones";

export function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b-2 border-border-subtle pb-8">
      <h2 className="text-xl">{titulo}</h2>
      {children}
    </section>
  );
}

function Mensaje({ estado }: { estado: Estado }) {
  if (estado.error) return <p role="alert" className="font-bold text-danger">{estado.error}</p>;
  if (estado.aviso) return <p role="status" className="font-bold text-success">{estado.aviso}</p>;
  return null;
}

// ── Datos ───────────────────────────────────────────────────────────────────

type Datos = { nombre: string; ubicacion: string; oficio: string; resumen: string | null };

export function SeccionDatos({ datos }: { datos: Datos }) {
  const [editando, setEditando] = useState(false);
  const { estado, enviar: guardar, pendiente: guardando, alEnviar } = useAccion<Estado>(async (p, d) => {
    const r = await actualizarDatos(p, d);
    if (!r.error) setEditando(false);
    return r;
  }, {});

  if (!editando) {
    return (
      <Seccion titulo="Mis datos">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato termino="Nombre" valor={datos.nombre} />
          <Dato termino="Ciudad o vereda" valor={datos.ubicacion} />
          <Dato termino="Oficio" valor={datos.oficio} />
          <Dato termino="Resumen" valor={datos.resumen ?? "Sin resumen"} />
        </dl>
        <Mensaje estado={estado} />
        <Button variant="secundario" size="normal" className="self-start" onClick={() => setEditando(true)}>
          <Pencil aria-hidden />
          Cambiar mis datos
        </Button>
      </Seccion>
    );
  }

  return (
    <Seccion titulo="Mis datos">
      <form action={guardar} onSubmit={alEnviar} className="flex flex-col gap-5">
        <Campo id="nombre" etiqueta="Nombre">
          {(p) => <Input {...p} name="nombre" defaultValue={datos.nombre} autoComplete="name" />}
        </Campo>
        <Campo id="ubicacion" etiqueta="Ciudad o vereda">
          {(p) => <Input {...p} name="ubicacion" defaultValue={datos.ubicacion} />}
        </Campo>
        <Campo id="oficio" etiqueta="Oficio">
          {(p) => <Input {...p} name="oficio" defaultValue={datos.oficio} />}
        </Campo>
        <Campo id="resumen" etiqueta="Resumen (opcional)" ayuda="Dos o tres frases sobre lo que sabe hacer. No escriba su edad.">
          {(p) => <Textarea {...p} name="resumen" defaultValue={datos.resumen ?? ""} rows={3} className={`${p.className} min-h-28`} />}
        </Campo>
        <Mensaje estado={estado} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button>
          <Button type="button" variant="enlace" size="normal" onClick={() => setEditando(false)}>Cancelar</Button>
        </div>
      </form>
    </Seccion>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="text-base text-text-muted">{termino}</dt>
      <dd className="font-bold">{valor}</dd>
    </div>
  );
}

// ── Visibilidad ─────────────────────────────────────────────────────────────

export function Visibilidad({ visibilidad }: { visibilidad: "reservado" | "visible" }) {
  const reservado = visibilidad === "reservado";
  return (
    <div className="flex items-start gap-3">
      {reservado ? <EyeOff aria-hidden className="mt-0.5 size-6 shrink-0" /> : <Eye aria-hidden className="mt-0.5 size-6 shrink-0" />}
      <p>
        <span className="font-bold">{reservado ? "Reservado." : "Visible."}</span>{" "}
        {reservado
          ? "Las empresas ven su experiencia, pero no su nombre ni su foto."
          : "Las empresas ven su nombre, su foto y su historia."}
      </p>
    </div>
  );
}

// ── Formas de trabajar ──────────────────────────────────────────────────────

type Oferta = { tipo: FormaContratar; horas_semana: number | null; modalidad: string | null; tarifa_esperada: number | null; quiere_orientacion: boolean };

export function SeccionFormas({ ofertas, guias }: { ofertas: Oferta[]; guias: GuiaTarifa[] }) {
  const [editando, setEditando] = useState(false);
  const [formas, setFormas] = useState<FormaContratar[]>(ofertas.map((o) => o.tipo));
  const [tarifas, setTarifas] = useState<Record<string, string>>(
    Object.fromEntries(ofertas.map((o) => [o.tipo, o.tarifa_esperada ? String(o.tarifa_esperada) : ""])),
  );
  const [orientacion, setOrientacion] = useState(ofertas.some((o) => o.quiere_orientacion));
  const { estado, enviar: guardar, pendiente: guardando, alEnviar } = useAccion<Estado>(async (p, d) => {
    const r = await actualizarFormas(p, d);
    if (!r.error) setEditando(false);
    return r;
  }, {});
  const primera = ofertas[0];

  if (!editando) {
    return (
      <Seccion titulo="Cómo me pueden contratar">
        {ofertas.length ? (
          <ul className="flex flex-col gap-2">
            {ofertas.map((o) => (
              <li key={o.tipo} className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-surface px-4 py-3">
                <span className="font-bold">{etiquetaForma(o.tipo)}</span>
                <span className="text-base text-text-muted">{o.tarifa_esperada ? pesos(o.tarifa_esperada) : "Sin tarifa"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">Aún no ha elegido formas de trabajar.</p>
        )}
        {primera && (
          <p className="text-base text-text-muted">
            {primera.horas_semana ? `${primera.horas_semana} horas a la semana · ` : ""}
            {modalidades.find((m) => m.valor === primera.modalidad)?.etiqueta ?? ""}
          </p>
        )}
        <Mensaje estado={estado} />
        <Button variant="secundario" size="normal" className="self-start" onClick={() => setEditando(true)}>
          <Pencil aria-hidden />
          Cambiar
        </Button>
      </Seccion>
    );
  }

  return (
    <Seccion titulo="Cómo me pueden contratar">
      <form action={guardar} onSubmit={alEnviar} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-lg font-bold">¿Cómo le gustaría trabajar?</legend>
          {formasContratar.map(({ valor, etiqueta, descripcion }) => (
            <Opcion
              key={valor}
              tipo="checkbox"
              name="formas"
              value={valor}
              checked={formas.includes(valor)}
              onChange={() => setFormas((a) => (a.includes(valor) ? a.filter((x) => x !== valor) : [...a, valor]))}
              titulo={etiqueta}
              descripcion={descripcion}
            />
          ))}
        </fieldset>
        {formas.length > 0 && (
          <Tarifas
            formas={formas}
            guias={guias}
            tarifas={tarifas}
            onTarifa={(f, v) => setTarifas((t) => ({ ...t, [f]: v }))}
            orientacion={orientacion}
            onOrientacion={setOrientacion}
          />
        )}
        {/* Los campos de Tarifas son controlados; aquí van con nombre para el envío. */}
        {formas.map((f) => (
          <input key={f} type="hidden" name={`tarifa-${f}`} value={tarifas[f] ?? ""} />
        ))}
        <input type="hidden" name="orientacion" value={orientacion ? "si" : "no"} />
        <Campo id="horas-editar" etiqueta="¿Cuántas horas a la semana? (opcional)">
          {(p) => (
            <Input {...p} name="horas" defaultValue={primera?.horas_semana ?? ""} inputMode="numeric" maxLength={2} className={`${p.className} max-w-40`} />
          )}
        </Campo>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-bold">¿Dónde?</legend>
          {modalidades.map(({ valor, etiqueta }) => (
            <label key={valor} className="flex min-h-tap items-center gap-3 text-lg">
              <input type="radio" name="modalidad" value={valor} defaultChecked={(primera?.modalidad ?? "presencial") === valor} className="size-6 accent-[var(--color-primary)]" />
              {etiqueta}
            </label>
          ))}
        </fieldset>
        <Mensaje estado={estado} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button>
          <Button type="button" variant="enlace" size="normal" onClick={() => setEditando(false)}>Cancelar</Button>
        </div>
      </form>
    </Seccion>
  );
}

// ── Evidencias (A3) ─────────────────────────────────────────────────────────

type Evidencia = {
  id: string;
  tipo: "referencia" | "archivo" | "evaluacion";
  descripcion: string | null;
  referencia_nombre: string | null;
  estado: "pendiente" | "verificada" | "rechazada";
  autorizada_empresas: boolean;
};

const ESTADO_EVIDENCIA = {
  pendiente: "El equipo la está revisando",
  verificada: "Verificada",
  rechazada: "No se pudo verificar",
};

export function SeccionEvidencias({ evidencias }: { evidencias: Evidencia[] }) {
  const [agregando, setAgregando] = useState<null | "referencia" | "archivo">(null);
  const { estado: estadoRef, enviar: guardarRef, pendiente: guardandoRef, alEnviar: alEnviarRef } = useAccion<Estado>(async (p, d) => {
    const r = await agregarReferencia(p, d);
    if (!r.error) setAgregando(null);
    return r;
  }, {});
  const { estado: estadoArch, enviar: guardarArch, pendiente: guardandoArch, alEnviar: alEnviarArch } = useAccion<Estado>(async (p, d) => {
    const r = await subirArchivo(p, d);
    if (!r.error) setAgregando(null);
    return r;
  }, {});

  return (
    <Seccion titulo="Lo que respalda mi experiencia">
      <p className="text-text-muted">
        Una persona que conozca su trabajo, o una foto o documento. El equipo lo revisa antes de que una empresa lo vea, y
        usted decide si lo muestra.
      </p>

      {evidencias.length > 0 && (
        <ul className="flex flex-col gap-3">
          {evidencias.map((e) => (
            <li key={e.id} className="flex flex-col gap-3 rounded-md border-2 border-border-subtle p-4">
              <div className="flex items-start gap-3">
                {e.tipo === "referencia" ? <Phone aria-hidden className="mt-0.5 size-6 shrink-0" /> : <FileText aria-hidden className="mt-0.5 size-6 shrink-0" />}
                <div className="flex-1">
                  <p className="font-bold">{e.tipo === "referencia" ? e.referencia_nombre : e.descripcion}</p>
                  {e.tipo === "referencia" && <p className="text-text-muted">{e.descripcion}</p>}
                  <p className="text-base">{ESTADO_EVIDENCIA[e.estado]}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {e.tipo !== "referencia" && (
                  <form action={cambiarAutorizacion}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="autorizada" value={e.autorizada_empresas ? "no" : "si"} />
                    <Button type="submit" variant="suave" size="normal">
                      {e.autorizada_empresas ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                      {e.autorizada_empresas ? "No mostrar a empresas" : "Mostrar a empresas"}
                    </Button>
                  </form>
                )}
                <form action={borrarEvidencia}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button type="submit" variant="suave" size="normal">
                    <X aria-hidden />
                    Quitar
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Mensaje estado={agregando === null ? (estadoRef.aviso ? estadoRef : estadoArch) : {}} />

      {agregando === null && (
        <div className="flex flex-wrap gap-3">
          <Button variant="secundario" size="normal" onClick={() => setAgregando("referencia")}>
            <Phone aria-hidden />
            Agregar una referencia
          </Button>
          <Button variant="secundario" size="normal" onClick={() => setAgregando("archivo")}>
            <FileText aria-hidden />
            Agregar foto o documento
          </Button>
        </div>
      )}

      {agregando === "referencia" && (
        <form action={guardarRef} onSubmit={alEnviarRef} className="flex flex-col gap-5 rounded-lg bg-surface p-5">
          <h3 className="text-lg">Una persona que conozca su trabajo</h3>
          <p className="text-base text-text-muted">Solo el equipo ve su nombre y su teléfono. Nunca se los damos a una empresa.</p>
          <Campo id="ref-nombre" etiqueta="Nombre">
            {(p) => <Input {...p} name="nombre" />}
          </Campo>
          <Campo id="ref-telefono" etiqueta="Celular">
            {(p) => <Input {...p} name="telefono" type="tel" inputMode="numeric" />}
          </Campo>
          <Campo id="ref-descripcion" etiqueta="¿De dónde le conoce?" ayuda="Por ejemplo: fue mi jefe en la planta.">
            {(p) => <Input {...p} name="descripcion" />}
          </Campo>
          <Mensaje estado={estadoRef} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={guardandoRef}>{guardandoRef ? "Guardando…" : "Guardar referencia"}</Button>
            <Button type="button" variant="enlace" size="normal" onClick={() => setAgregando(null)}>Cancelar</Button>
          </div>
        </form>
      )}

      {agregando === "archivo" && (
        <form action={guardarArch} onSubmit={alEnviarArch} className="flex flex-col gap-5 rounded-lg bg-surface p-5">
          <h3 className="text-lg">Una foto o un documento</h3>
          <p className="text-base text-text-muted">
            Por ejemplo, un certificado o una foto de su trabajo. Que no se vean fechas de nacimiento ni documentos de identidad.
          </p>
          <Campo id="archivo" etiqueta="Archivo (foto o PDF, hasta 10 MB)">
            {(p) => (
              <input
                {...p}
                name="archivo"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className={`${p.className} min-h-action py-3 file:mr-3 file:min-h-tap file:rounded-sm file:border-0 file:bg-surface-strong file:px-3 file:font-bold`}
              />
            )}
          </Campo>
          <Campo id="archivo-descripcion" etiqueta="¿Qué muestra?">
            {(p) => <Input {...p} name="descripcion" />}
          </Campo>
          <Mensaje estado={estadoArch} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={guardandoArch}>{guardandoArch ? "Subiendo…" : "Subir"}</Button>
            <Button type="button" variant="enlace" size="normal" onClick={() => setAgregando(null)}>Cancelar</Button>
          </div>
        </form>
      )}
    </Seccion>
  );
}

// ── Mis datos personales: descargar y borrar ─────────────────────────────────

export function SeccionMisDatos() {
  const [descargando, setDescargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const { estado, enviar: borrar, pendiente: borrando } = useAccion<Estado>(borrarCuenta, {});

  async function descargar() {
    setDescargando(true);
    try {
      const json = await descargarDatos();
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "mis-datos.json";
      enlace.click();
      URL.revokeObjectURL(url);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Seccion titulo="Mis datos personales">
      <div className="flex flex-col gap-2">
        <Button variant="suave" size="normal" className="justify-start" onClick={descargar} disabled={descargando}>
          <Download aria-hidden />
          {descargando ? "Preparando…" : "Descargar mis datos"}
        </Button>
        {!confirmando ? (
          <Button variant="suave" size="normal" className="justify-start" onClick={() => setConfirmando(true)}>
            <Trash2 aria-hidden />
            Borrar mi cuenta
          </Button>
        ) : (
          <form action={borrar} className="flex flex-col gap-4 rounded-lg border-2 border-danger p-5">
            <p className="font-bold">¿Seguro? Se borran su perfil, sus historias, su huella y sus evidencias. No se puede deshacer.</p>
            <Mensaje estado={estado} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" className="bg-danger hover:bg-danger" disabled={borrando}>
                {borrando ? "Borrando…" : "Sí, borrar todo"}
              </Button>
              <Button type="button" variant="secundario" onClick={() => setConfirmando(false)}>No, volver</Button>
            </div>
          </form>
        )}
      </div>
    </Seccion>
  );
}
