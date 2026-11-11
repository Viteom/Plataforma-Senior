"use client";

import { Check, Eye, EyeOff, House, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { ImportarHojaVida } from "@/components/perfil/importar-hoja-vida";
import { CampoUbicacion } from "@/components/ubicacion/campo-ubicacion";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { Tarifas } from "@/components/perfil/tarifas";
import { PreguntaIngresos } from "@/components/talento/pregunta-ingresos";
import { formasContratar, modalidades, type FormaContratar, type GuiaTarifa } from "@/lib/formas";
import { MARCA } from "@/lib/marca";
import { esOficioPresencial, FORMAS_A_DISTANCIA } from "@/lib/oficios-presenciales";
import {
  borradorVacio,
  erroresDelPaso,
  HORAS_RAPIDAS,
  MOVILIDADES,
  PAISES,
  POSTURAS,
  SEXOS,
  type BorradorPerfil,
  type Errores,
} from "@/lib/perfil/validar";
import { cn } from "@/lib/utils";

import { guardarPerfil, type EstadoPerfil } from "./acciones";

const titulos = ["Tus datos", "Cómo quieres trabajar", "Quién ve tu perfil"];

export function FormularioPerfil({ guias, presenciales }: { guias: GuiaTarifa[]; presenciales: string[] }) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [b, setB] = useState<BorradorPerfil>(borradorVacio);
  const [historiaCv, setHistoriaCv] = useState("");
  const [zona, setZona] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  // Horas: una de las respuestas rápidas, «otro número» (abre el campo) o «todavía no sé».
  const [eleccionHoras, setEleccionHoras] = useState("");
  const [estado, guardar, guardando] = useActionState<EstadoPerfil, FormData>(guardarPerfil, {});

  const cambiar = <K extends keyof BorradorPerfil>(campo: K, valor: BorradorPerfil[K]) =>
    setB((x) => ({ ...x, [campo]: valor }));

  // Al cambiar de paso, lleva el foco al título para que el lector de pantalla lo anuncie.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [paso]);

  // Si el servidor rechaza algo, vuelve al paso que tiene el error.
  useEffect(() => {
    if (estado.errores) {
      setErrores(estado.errores);
      if (estado.paso) setPaso(estado.paso);
    }
  }, [estado]);

  function continuar(e: React.FormEvent) {
    // «Entrar ya y completar después» envía con lo que hay: solo revisa lo de este paso.
    const despues = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.name === "despues";
    const encontrados = erroresDelPaso({ ...b, despues }, paso);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) {
      e.preventDefault();
      // Lleva el foco al primer campo con problema, para no tener que buscarlo.
      setTimeout(() => {
        const primero = document.querySelector<HTMLElement>('[aria-invalid="true"], fieldset [role="alert"]');
        const objetivo = primero?.matches("[aria-invalid]")
          ? primero
          : primero?.closest("fieldset")?.querySelector<HTMLElement>("input");
        objetivo?.focus();
      }, 0);
      return;
    }
    // Pasos 1 y 2 avanzan en el navegador; el 3 envía todo al servidor (POST).
    if (paso < 3 && !despues) {
      e.preventDefault();
      setPaso((paso + 1) as 2 | 3);
    }
  }

  function alternarForma(f: FormaContratar) {
    cambiar("formas", b.formas.includes(f) ? b.formas.filter((x) => x !== f) : [...b.formas, f]);
  }

  const noCumple = paso === 1 && b.requisito === "ninguno";
  // Cuidado, aseo, cocina, obra, campo, conducción, taller…: siempre en persona.
  const presencial = esOficioPresencial(b.oficio, presenciales);
  const daMentoriaOTaller = b.formas.some((f) => FORMAS_A_DISTANCIA.includes(f as FormaContratar));
  const sale = presencial || b.modalidad !== "remoto";

  function elegirHoras(valor: string) {
    setEleccionHoras(valor);
    if (valor === "otro") cambiar("horas", HORAS_RAPIDAS.some((h) => h.valor === b.horas) ? "" : b.horas);
    else cambiar("horas", valor === "nose" ? "" : valor);
  }

  return (
    <Pantalla
      titulo="Crea tu perfil"
      antesDelTitulo={
        <div className="flex flex-col gap-2">
          <p className="text-base font-bold">
            Paso {paso} de 3<span className="sr-only">: {titulos[paso - 1]}</span>
          </p>
          <div className="grid grid-cols-3 gap-2" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={n <= paso ? "h-2 rounded-full bg-primary" : "h-2 rounded-full bg-surface-strong"}
              />
            ))}
          </div>
        </div>
      }
    >
      <form action={guardar} onSubmit={continuar} className="flex flex-col gap-8" noValidate>
        <input type="hidden" name="borrador" value={JSON.stringify(b)} />
        <h2 ref={tituloRef} tabIndex={-1} className="text-xl focus-visible:outline-none">
          {titulos[paso - 1]}
        </h2>

        {errores.general && (
          <p role="alert" className="rounded-md border-2 border-danger p-4 font-bold text-danger">
            {errores.general}
          </p>
        )}

        <input type="hidden" name="historia_cv" value={historiaCv} />
        <input type="hidden" name="zona_local" value={zona} />
        {paso === 1 && (
          <>
            <ImportarHojaVida
              onConfirmar={(d) => {
                setB((x) => ({
                  ...x,
                  nombre: d.nombre || x.nombre,
                  oficio: d.oficio || x.oficio,
                }));
                setHistoriaCv(d.historia);
              }}
            />
            {historiaCv && (
              <p role="status">
                Importamos tu experiencia. Revisa los datos y completa las condiciones de trabajo; después podrás armar
                tu huella con ese texto.
              </p>
            )}
            <Campo id="nombre" etiqueta="Tu nombre" error={errores.nombre}>
              {(p) => (
                <Input
                  {...p}
                  value={b.nombre}
                  onChange={(e) => cambiar("nombre", e.target.value)}
                  autoComplete="name"
                />
              )}
            </Campo>
            <Campo id="pais" etiqueta="País donde vives" error={errores.pais}>
              {(p) => (
                <select
                  {...p}
                  value={b.pais}
                  onChange={(e) => cambiar("pais", e.target.value)}
                  className={`${p.className} min-h-action`}
                >
                  {PAISES.map((pais) => (
                    <option key={pais} value={pais}>
                      {pais}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            {b.pais === "Colombia" ? (
              <CampoUbicacion
                inicial={b.ubicacion}
                value={b.ubicacion}
                onChange={(v) => cambiar("ubicacion", v)}
                onSectorChange={setZona}
              />
            ) : (
              <Campo id="ubicacion" etiqueta="Ciudad donde vives" error={errores.ubicacion}>
                {(p) => <Input {...p} value={b.ubicacion} onChange={(e) => cambiar("ubicacion", e.target.value)} />}
              </Campo>
            )}
            <Campo
              id="oficio"
              etiqueta="¿A qué te has dedicado?"
              ayuda="Por ejemplo: contabilidad, mantenimiento de máquinas, tejido."
              error={errores.oficio}
            >
              {(p) => <Input {...p} value={b.oficio} onChange={(e) => cambiar("oficio", e.target.value)} />}
            </Campo>
            <fieldset
              className="flex flex-col gap-3"
              aria-describedby={errores.requisito ? "requisito-error" : undefined}
            >
              <legend className="mb-3 text-lg font-bold">¿Cuál de estas describe tu caso?</legend>
              {(
                [
                  ["edad", "Tengo 45 años o más"],
                  ["experiencia", "Tengo más de 20 años de experiencia u oficio"],
                  ["ninguno", "Ninguna de las dos"],
                ] as const
              ).map(([valor, titulo]) => (
                <Opcion
                  key={valor}
                  name="requisito"
                  value={valor}
                  checked={b.requisito === valor}
                  onChange={() => cambiar("requisito", valor)}
                  titulo={titulo}
                />
              ))}
              {errores.requisito && b.requisito !== "ninguno" && (
                <p id="requisito-error" role="alert" className="font-bold text-danger">
                  {errores.requisito}
                </p>
              )}
            </fieldset>
            {noCumple && (
              <div role="status" className="flex flex-col gap-2 rounded-md bg-surface p-4">
                <p className="font-bold">Por ahora Kánna es para talento con trayectoria.</p>
                <p className="text-text-muted">
                  Te podemos avisar cuando abramos para más personas.{" "}
                  <Link href="/ayuda" className="font-bold text-text underline underline-offset-4">
                    Hablar con alguien del equipo
                  </Link>
                </p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Opcion
                tipo="checkbox"
                name="autorizo"
                value="si"
                checked={b.autorizo}
                onChange={() => cambiar("autorizo", !b.autorizo)}
                titulo={`Autorizo a ${MARCA.nombre} a usar mis datos para crear mi perfil y conectarme con empresas.`}
                descripcion="Nunca le mostramos tu edad a una empresa. Puedes descargar o borrar tus datos cuando quieras."
              />
              <Link
                href="/privacidad"
                className="inline-flex min-h-tap items-center self-start font-bold underline underline-offset-4"
              >
                Cómo cuidamos tus datos
              </Link>
              {errores.autorizo && (
                <p role="alert" className="font-bold text-danger">
                  {errores.autorizo}
                </p>
              )}
            </div>
          </>
        )}

        {paso === 2 && (
          <>
            <Pregunta numero={1} titulo="¿Cuántas horas a la semana puedes trabajar?">
              <Chips
                nombre="horas_rapidas"
                opciones={[...HORAS_RAPIDAS, { valor: "otro", etiqueta: "Otro número" }, { valor: "nose", etiqueta: "Todavía no sé" }]}
                elegida={eleccionHoras}
                onElegir={elegirHoras}
              />
              {eleccionHoras === "otro" && (
                <Campo id="horas" etiqueta="¿Cuántas horas?" ayuda="Entre 1 y 48 horas a la semana." error={errores.horas}>
                  {(p) => (
                    <div className="flex items-center gap-3">
                      <Input
                        {...p}
                        value={b.horas}
                        onChange={(e) => cambiar("horas", e.target.value.replace(/\D/g, "").slice(0, 2))}
                        inputMode="numeric"
                        autoComplete="off"
                        className={`${p.className} w-32 text-center text-xl`}
                      />
                      <span className="text-lg">horas a la semana</span>
                    </div>
                  )}
                </Campo>
              )}
            </Pregunta>

            <Pregunta numero={2} titulo="¿De qué forma te gustaría trabajar?" ayuda="Puedes elegir varias.">
              {formasContratar.map(({ valor, etiqueta, descripcion }) => (
                <Opcion
                  key={valor}
                  tipo="checkbox"
                  name="formas"
                  value={valor}
                  checked={b.formas.includes(valor)}
                  onChange={() => alternarForma(valor)}
                  titulo={etiqueta}
                  descripcion={descripcion}
                />
              ))}
              {errores.formas && (
                <p role="alert" className="font-bold text-danger">
                  {errores.formas}
                </p>
              )}
              {b.formas.length > 0 && (
                <Tarifas
                  formas={b.formas as FormaContratar[]}
                  guias={guias}
                  tarifas={b.tarifas}
                  onTarifa={(f, v) => cambiar("tarifas", { ...b.tarifas, [f]: v })}
                  orientacion={b.orientacion}
                  onOrientacion={(v) => cambiar("orientacion", v)}
                  error={errores.tarifas}
                />
              )}
            </Pregunta>

            <Pregunta numero={3} titulo="¿Dónde quieres trabajar?">
              {presencial ? (
                <div className="flex flex-col gap-3">
                  <p className="flex items-start gap-3 rounded-md bg-surface p-4">
                    <House aria-hidden className="mt-0.5 size-6 shrink-0" />
                    <span>
                      Tu oficio se hace en persona, así que te mostraremos trabajos presenciales.
                      {daMentoriaOTaller ? "" : " Si das mentorías o talleres, esos sí pueden ser desde tu casa."}
                    </span>
                  </p>
                  {daMentoriaOTaller && (
                    <Opcion
                      tipo="checkbox"
                      name="distancia"
                      value="si"
                      checked={b.distancia}
                      onChange={() => cambiar("distancia", !b.distancia)}
                      titulo="Las mentorías y los talleres también los puedo dar desde mi casa"
                    />
                  )}
                </div>
              ) : (
                modalidades.map(({ valor, etiqueta }) => (
                  <Opcion
                    key={valor}
                    name="modalidad"
                    value={valor}
                    checked={b.modalidad === valor}
                    onChange={() => cambiar("modalidad", valor)}
                    titulo={etiqueta}
                  />
                ))
              )}
              {sale && (
                <>
                  <Campo
                    id="ciudad-trabajo"
                    etiqueta="¿En qué ciudad o municipio? (opcional)"
                    ayuda={b.ubicacion ? `Si lo dejas en blanco, buscamos cerca de ${b.ubicacion}.` : undefined}
                    error={errores.ciudadTrabajo}
                  >
                    {(p) => (
                      <Input {...p} value={b.ciudadTrabajo} onChange={(e) => cambiar("ciudadTrabajo", e.target.value)} />
                    )}
                  </Campo>
                  <fieldset className="flex flex-col gap-3">
                    <legend className="mb-1 text-lg font-bold">¿Hasta dónde te puedes mover? (opcional)</legend>
                    <Chips
                      nombre="movilidad"
                      opciones={MOVILIDADES}
                      elegida={b.movilidad}
                      onElegir={(v) => cambiar("movilidad", b.movilidad === v ? "" : (v as BorradorPerfil["movilidad"]))}
                    />
                  </fieldset>
                </>
              )}
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-lg font-bold">¿Cómo te gusta trabajar? (opcional)</legend>
                <Chips
                  nombre="postura"
                  opciones={POSTURAS}
                  elegida={b.postura}
                  onElegir={(v) => cambiar("postura", b.postura === v ? "" : (v as BorradorPerfil["postura"]))}
                />
              </fieldset>
            </Pregunta>
          </>
        )}

        {paso === 3 && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="sr-only">Quién ve tu perfil</legend>
              <p className="mb-3 text-lg text-text-muted">Puedes cambiarlo cuando quieras desde Mi perfil.</p>
              <Opcion
                name="visibilidad"
                value="reservado"
                checked={b.visibilidad === "reservado"}
                onChange={() => cambiar("visibilidad", "reservado")}
                icono={<EyeOff aria-hidden className="mt-0.5 size-6 shrink-0" />}
                titulo="Reservado"
                descripcion="Las empresas ven tu experiencia y tu oficio, pero no tu nombre ni tu foto. Los ven solo cuando aceptas conocerlas."
              />
              <Opcion
                name="visibilidad"
                value="visible"
                checked={b.visibilidad === "visible"}
                onChange={() => cambiar("visibilidad", "visible")}
                icono={<Eye aria-hidden className="mt-0.5 size-6 shrink-0" />}
                titulo="Visible"
                descripcion="Las empresas ven tu nombre, tu foto y tu historia."
              />
            </fieldset>

            <section aria-labelledby="privados" className="flex flex-col gap-5 rounded-lg bg-surface p-5">
              <div className="flex flex-col gap-2">
                <h3 id="privados" className="flex items-center gap-2 text-lg">
                  <ShieldCheck aria-hidden className="size-6 shrink-0" />
                  Datos privados (opcionales)
                </h3>
                <p className="text-base">
                  Ninguna empresa los ve y no cambian qué oportunidades te llegan. Puedes dejarlos en blanco.
                </p>
              </div>
              <Campo
                id="cedula"
                etiqueta="Número de cédula"
                ayuda="La necesitas para firmar un acuerdo. Escríbela como quieras, con o sin puntos."
                error={errores.cedula}
              >
                {(p) => (
                  <Input
                    {...p}
                    value={b.cedula}
                    onChange={(e) => cambiar("cedula", e.target.value.slice(0, 20))}
                    autoComplete="off"
                    className={`${p.className} bg-raised`}
                  />
                )}
              </Campo>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-1 text-lg font-bold">Sexo</legend>
                <Chips
                  nombre="sexo"
                  opciones={SEXOS}
                  elegida={b.sexo}
                  onElegir={(v) => cambiar("sexo", b.sexo === v ? "" : (v as BorradorPerfil["sexo"]))}
                />
              </fieldset>
              <PreguntaIngresos
                situacion={b.ingresos}
                hogar={b.hogar}
                onSituacion={(v) => cambiar("ingresos", v)}
                onHogar={(v) => cambiar("hogar", v)}
              />
            </section>

          </>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" ancho="completo" disabled={noCumple || guardando}>
            {guardando ? "Guardando…" : paso < 3 ? "Continuar" : "Guardar y seguir"}
          </Button>
          {paso < 3 && !noCumple && (
            <div className="flex flex-col gap-1">
              <Button type="submit" name="despues" value="si" variant="secundario" ancho="completo" disabled={guardando}>
                Entrar ya y completar después
              </Button>
              <p className="text-center text-base text-text-muted">
                Guardamos lo que llevas. Lo demás lo llenas cuando quieras desde el inicio.
              </p>
            </div>
          )}
          {paso > 1 && (
            <Button type="button" variant="enlace" size="normal" onClick={() => setPaso((paso - 1) as 1 | 2)}>
              Volver al paso {paso - 1}
            </Button>
          )}
        </div>
      </form>
    </Pantalla>
  );
}

// Una de las tres preguntas del paso 2, con su número para que se sienta corto.
function Pregunta({ numero, titulo, ayuda, children }: { numero: number; titulo: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 flex flex-col items-start gap-3">
        <span aria-hidden className="grid size-11 place-items-center rounded-md bg-accent font-display text-xl font-extrabold text-on-accent">
          {numero}
        </span>
        <span className="font-display text-2xl leading-tight font-extrabold">
          <span className="sr-only">Pregunta {numero} de 3: </span>
          {titulo}
        </span>
      </legend>
      {ayuda && <p className="mb-2 text-text-muted">{ayuda}</p>}
      {children}
    </fieldset>
  );
}

// Respuestas cortas en botones grandes. Es un grupo de radios de verdad: se ve elegido con borde,
// negrita y una marca, no solo con color. Tocar de nuevo la elegida la quita (las opcionales).
function Chips({
  nombre,
  opciones,
  elegida,
  onElegir,
}: {
  nombre: string;
  opciones: { valor: string; etiqueta: string }[];
  elegida: string;
  onElegir: (valor: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const activa = elegida === o.valor;
        return (
          <label
            key={o.valor}
            className={cn(
              "inline-flex min-h-action cursor-pointer items-center gap-2 rounded-full border-2 px-5 text-lg transition-[background-color,transform] duration-100 active:scale-[0.98] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus",
              activa ? "border-primary bg-primary font-bold text-on-primary" : "border-border bg-bg hover:bg-surface",
            )}
          >
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={activa}
              onChange={() => onElegir(o.valor)}
              onClick={() => activa && onElegir(o.valor)}
              className="sr-only"
            />
            {activa && <Check aria-hidden className="size-5 shrink-0" />}
            {o.etiqueta}
          </label>
        );
      })}
    </div>
  );
}
