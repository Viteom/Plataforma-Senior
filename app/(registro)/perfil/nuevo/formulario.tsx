"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { ImportarHojaVida } from "@/components/perfil/importar-hoja-vida";
import { CampoUbicacion } from "@/components/ubicacion/campo-ubicacion";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { Tarifas } from "@/components/perfil/tarifas";
import { formasContratar, modalidades, type FormaContratar, type GuiaTarifa } from "@/lib/formas";
import { MARCA } from "@/lib/marca";
import { borradorVacio, erroresDelPaso, type BorradorPerfil, type Errores } from "@/lib/perfil/validar";

import { guardarPerfil, type EstadoPerfil } from "./acciones";

const titulos = ["Tus datos", "Cómo quieres trabajar", "Quién ve tu perfil"];

export function FormularioPerfil({ guias }: { guias: GuiaTarifa[] }) {
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [b, setB] = useState<BorradorPerfil>(borradorVacio);
  const [historiaCv, setHistoriaCv] = useState("");
  const [zona, setZona] = useState("");
  const [errores, setErrores] = useState<Errores>({});
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
    const encontrados = erroresDelPaso(b, paso);
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
    if (paso < 3) {
      e.preventDefault();
      setPaso((paso + 1) as 2 | 3);
    }
  }

  function alternarForma(f: FormaContratar) {
    cambiar("formas", b.formas.includes(f) ? b.formas.filter((x) => x !== f) : [...b.formas, f]);
  }

  const noCumple = paso === 1 && b.requisito === "ninguno";

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
            <CampoUbicacion value={b.ubicacion} onChange={(v) => cambiar("ubicacion", v)} onSectorChange={setZona} />
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
          </>
        )}

        {paso === 2 && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-lg font-bold">¿Cómo te gustaría trabajar?</legend>
              <p className="mb-2 text-text-muted">Puedes elegir varias.</p>
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
            </fieldset>

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

            <Campo id="horas" etiqueta="¿Cuántas horas a la semana? (opcional)" error={errores.horas}>
              {(p) => (
                <Input
                  {...p}
                  value={b.horas}
                  onChange={(e) => cambiar("horas", e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={2}
                  className={`${p.className} max-w-40`}
                />
              )}
            </Campo>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-lg font-bold">¿Dónde?</legend>
              {modalidades.map(({ valor, etiqueta }) => (
                <Opcion
                  key={valor}
                  name="modalidad"
                  value={valor}
                  checked={b.modalidad === valor}
                  onChange={() => cambiar("modalidad", valor)}
                  titulo={etiqueta}
                />
              ))}
            </fieldset>
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

        <div className="flex flex-col gap-3">
          <Button type="submit" ancho="completo" disabled={noCumple || guardando}>
            {guardando ? "Guardando…" : paso < 3 ? "Continuar" : "Guardar y seguir"}
          </Button>
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
