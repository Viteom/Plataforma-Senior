"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { Opcion } from "@/components/ui/opcion";
import { formasContratar, type FormaContratar } from "@/lib/demo";

type Requisito = "edad" | "experiencia" | "ninguno";
type Visibilidad = "reservado" | "visible";

const titulos = ["Sus datos", "Cómo quiere trabajar", "Quién ve su perfil"];

export default function PerfilNuevo() {
  const router = useRouter();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [paso, setPaso] = useState(1);
  const [requisito, setRequisito] = useState<Requisito | null>(null);
  const [formas, setFormas] = useState<FormaContratar[]>([]);
  const [modalidad, setModalidad] = useState("presencial");
  const [visibilidad, setVisibilidad] = useState<Visibilidad>("reservado");

  // Al cambiar de paso, lleva el foco al título para que el lector de pantalla lo anuncie.
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    tituloRef.current?.focus();
  }, [paso]);

  function irA(n: number) {
    setPaso(n);
  }

  function continuar(e: React.FormEvent) {
    e.preventDefault();
    if (paso < 3) irA(paso + 1);
    else router.push("/huella"); // Hito 3: guarda en talent_profiles y talent_offers.
  }

  function alternarForma(f: FormaContratar) {
    setFormas((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));
  }

  const noCumple = paso === 1 && requisito === "ninguno";

  return (
    <Pantalla
      titulo="Cree su perfil"
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
      <form method="post" onSubmit={continuar} className="flex flex-col gap-8" noValidate>
        <h2 ref={tituloRef} tabIndex={-1} className="text-xl focus-visible:outline-none">
          {titulos[paso - 1]}
        </h2>

        {paso === 1 && (
          <>
            <Campo id="nombre" etiqueta="Su nombre">
              {(p) => <Input {...p} autoComplete="name" />}
            </Campo>
            <Campo id="ubicacion" etiqueta="Ciudad o vereda donde vive">
              {(p) => <Input {...p} autoComplete="address-level2" />}
            </Campo>
            <Campo id="oficio" etiqueta="¿A qué se ha dedicado?" ayuda="Por ejemplo: contabilidad, mantenimiento de máquinas, tejido.">
              {(p) => <Input {...p} />}
            </Campo>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-lg font-bold">¿Cuál de estas describe su caso?</legend>
              <Opcion
                name="requisito"
                value="edad"
                checked={requisito === "edad"}
                onChange={() => setRequisito("edad")}
                titulo="Tengo 45 años o más"
              />
              <Opcion
                name="requisito"
                value="experiencia"
                checked={requisito === "experiencia"}
                onChange={() => setRequisito("experiencia")}
                titulo="Tengo más de 20 años de experiencia u oficio"
              />
              <Opcion
                name="requisito"
                value="ninguno"
                checked={requisito === "ninguno"}
                onChange={() => setRequisito("ninguno")}
                titulo="Ninguna de las dos"
              />
            </fieldset>
            {noCumple && (
              <div role="status" className="flex flex-col gap-2 rounded-md bg-surface p-4">
                <p className="font-bold">Por ahora esta plataforma es para talento con trayectoria.</p>
                <p className="text-text-muted">
                  Le podemos avisar cuando abramos para más personas.{" "}
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
              <legend className="mb-1 text-lg font-bold">¿Cómo le gustaría trabajar?</legend>
              <p className="mb-2 text-text-muted">Puede elegir varias.</p>
              {formasContratar.map(({ valor, etiqueta }) => (
                <Opcion
                  key={valor}
                  tipo="checkbox"
                  name="formas"
                  value={valor}
                  checked={formas.includes(valor)}
                  onChange={() => alternarForma(valor)}
                  titulo={etiqueta}
                />
              ))}
            </fieldset>
            <Campo id="horas" etiqueta="¿Cuántas horas a la semana?">
              {(p) => <Input {...p} type="number" inputMode="numeric" min={1} max={48} className={`${p.className} max-w-40`} />}
            </Campo>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-lg font-bold">¿Dónde?</legend>
              {[
                ["presencial", "Presencial"],
                ["remoto", "Desde mi casa"],
                ["mixto", "Las dos"],
              ].map(([v, t]) => (
                <Opcion key={v} name="modalidad" value={v} checked={modalidad === v} onChange={() => setModalidad(v)} titulo={t} />
              ))}
            </fieldset>
          </>
        )}

        {paso === 3 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="sr-only">Quién ve su perfil</legend>
            <p className="mb-3 text-lg text-text-muted">
              Puede cambiarlo cuando quiera desde Mi perfil.
            </p>
            <Opcion
              name="visibilidad"
              value="reservado"
              checked={visibilidad === "reservado"}
              onChange={() => setVisibilidad("reservado")}
              icono={<EyeOff aria-hidden className="mt-0.5 size-6 shrink-0" />}
              titulo="Reservado"
              descripcion="Las empresas ven su experiencia y su oficio, pero no su nombre ni su foto. Los ven solo cuando usted acepta conocerlas."
            />
            <Opcion
              name="visibilidad"
              value="visible"
              checked={visibilidad === "visible"}
              onChange={() => setVisibilidad("visible")}
              icono={<Eye aria-hidden className="mt-0.5 size-6 shrink-0" />}
              titulo="Visible"
              descripcion="Las empresas ven su nombre, su foto y su historia."
            />
          </fieldset>
        )}

        <div className="flex flex-col gap-3">
          <Button type="submit" ancho="completo" disabled={noCumple}>
            {paso < 3 ? "Continuar" : "Guardar y seguir"}
          </Button>
          {paso > 1 && (
            <Button type="button" variant="enlace" size="normal" onClick={() => irA(paso - 1)}>
              Volver al paso {paso - 1}
            </Button>
          )}
        </div>
      </form>
    </Pantalla>
  );
}
