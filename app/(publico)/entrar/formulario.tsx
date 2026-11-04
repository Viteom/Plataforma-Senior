"use client";

import { Mail, Smartphone } from "lucide-react";
import { useActionState, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { CasillasCodigo, LlegadaCodigo, PasosEntrada, type MedioCodigo } from "@/components/ui/entrada-codigo";
import { cn } from "@/lib/utils";

import { codigoDemo, entrarDemo, enviarCodigo, reenviarCodigo, verificarCodigo, type EstadoEntrar } from "./acciones";

const ESPERA_REENVIO = 45;

const medios = [
  { valor: "celular" as const, etiqueta: "Celular", icono: Smartphone },
  { valor: "correo" as const, etiqueta: "Correo", icono: Mail },
];

type Enviado = NonNullable<EstadoEntrar["enviado"]>;

type Props = {
  para: "talento" | "empresa";
  demo: boolean;
  /** Si ya se pidió un código en los últimos 10 minutos, se abre directo en el paso 2. */
  enviadoAntes: Enviado | null;
  /** Hay proveedor de SMS: el talento empieza por celular. Si no, por correo. */
  smsActivo: boolean;
};

// Entrada sin contraseña en una sola tarjeta: 1) a dónde enviar el código, 2) escribirlo.
// Todo va por acciones de servidor (POST): el celular y el correo nunca viajan en la URL.
export function FormularioEntrar({ para, demo, enviadoAntes, smsActivo }: Props) {
  // Las empresas suelen entrar con correo; el talento, con celular (brief), si hay SMS.
  const [medio, setMedio] = useState<MedioCodigo>(enviadoAntes?.medio ?? (para === "talento" && smsActivo ? "celular" : "correo"));
  const [paso, setPaso] = useState<1 | 2>(enviadoAntes ? 2 : 1);
  const [enviado, setEnviado] = useState<Enviado | null>(enviadoAntes);
  // Controlados aquí arriba: React 19 vacía el formulario después de cada envío, y ni un error ni
  // volver a «Cambiar» deberían obligar a escribir todo de nuevo.
  const [celular, setCelular] = useState("");
  const [correo, setCorreo] = useState("");
  const [envio, enviar, enviando] = useActionState<EstadoEntrar, FormData>(demo ? entrarDemo : enviarCodigo, {});

  // Un envío que salió bien lleva al paso 2.
  useEffect(() => {
    if (!envio.enviado) return;
    setEnviado(envio.enviado);
    setPaso(2);
  }, [envio]);

  const tarjeta = useRef<HTMLDivElement>(null);
  const moverFoco = useRef(false);
  const cambiarPaso = (siguiente: 1 | 2) => {
    moverFoco.current = true;
    setPaso(siguiente);
  };
  // Al cambiar de paso, el foco va al primer campo (si la persona estaba usando la tarjeta).
  useLayoutEffect(() => {
    if (!moverFoco.current && !(paso === 2 && envio.enviado)) return;
    moverFoco.current = false;
    tarjeta.current?.querySelector<HTMLInputElement>("input:not([type=hidden]):not([type=radio]), input[type=radio]:checked")?.focus();
  }, [paso, envio.enviado]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl lg:text-3xl">{para === "empresa" ? "Entrar como empresa" : "Entrar"}</h1>

      <div ref={tarjeta} className="flex max-w-xl flex-col gap-8 rounded-lg border border-border-subtle bg-raised p-5 shadow-tarjeta sm:p-8">
        <PasosEntrada paso={paso} medio={medio} />

        {paso === 1 ? (
          <PasoDestino
            para={para}
            medio={medio}
            setMedio={setMedio}
            enviar={enviar}
            enviando={enviando}
            estado={envio}
            celular={celular}
            setCelular={setCelular}
            correo={correo}
            setCorreo={setCorreo}
          />
        ) : (
          <PasoCodigo
            demo={demo}
            enviado={enviado}
            medio={enviado?.medio ?? medio}
            onCambiar={() => cambiarPaso(1)}
          />
        )}
      </div>
    </div>
  );
}

function PasoDestino({
  para,
  medio,
  setMedio,
  enviar,
  enviando,
  estado,
  celular,
  setCelular,
  correo,
  setCorreo,
}: {
  celular: string;
  setCelular: (v: string) => void;
  correo: string;
  setCorreo: (v: string) => void;
  para: "talento" | "empresa";
  medio: MedioCodigo;
  setMedio: (m: MedioCodigo) => void;
  enviar: (datos: FormData) => void;
  enviando: boolean;
  estado: EstadoEntrar;
}) {
  // El error del envío anterior se oculta si la persona cambia de medio.
  const [medioDelError, setMedioDelError] = useState<MedioCodigo | null>(null);
  useEffect(() => {
    if (estado.error) setMedioDelError(medio);
    // Solo cuando llega una respuesta nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);
  const error = medioDelError === medio ? estado.error : undefined;

  return (
    <form action={enviar} className="flex flex-col gap-8" noValidate aria-busy={enviando}>
      <p className="text-lg text-text-muted">Te enviamos un código de 6 números. No necesitas contraseña.</p>
      <input type="hidden" name="para" value={para} />
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-bold">¿Dónde quieres recibir el código?</legend>
        <div className="grid grid-cols-2 gap-3">
          {medios.map(({ valor, etiqueta, icono: Icono }) => (
            <label
              key={valor}
              className={cn(
                "flex min-h-action items-center justify-center gap-2 rounded-md border-2 px-3 text-lg transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus",
                medio === valor ? "border-text bg-surface-strong font-bold" : "border-border hover:bg-surface",
              )}
            >
              <input
                type="radio"
                name="medio"
                value={valor}
                checked={medio === valor}
                onChange={() => setMedio(valor)}
                className="sr-only"
              />
              <Icono aria-hidden className="size-6" />
              {etiqueta}
              {valor === "celular" && <span className="sr-only">(mensaje de texto)</span>}
            </label>
          ))}
        </div>
      </fieldset>

      {medio === "celular" ? (
        <Campo
          id="celular"
          etiqueta="Número de celular"
          ayuda="Solo los 10 números, sin el +57. Te llega un mensaje de texto."
          error={error}
        >
          {(p) => (
            <div className="flex items-stretch gap-2">
              <span className="flex min-h-action items-center rounded-sm bg-surface-strong px-4 text-lg font-bold">+57</span>
              <Input
                {...p}
                name="celular"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="300 123 4567"
                maxLength={16}
              />
            </div>
          )}
        </Campo>
      ) : (
        <Campo id="correo" etiqueta="Correo electrónico" error={error}>
          {(p) => (
            <Input
              {...p}
              name="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="nombre@correo.com"
            />
          )}
        </Campo>
      )}

      {estado.sinSms && medio === "celular" && (
        <Button type="button" variant="secundario" ancho="completo" onClick={() => setMedio("correo")}>
          <Mail aria-hidden />
          Recibirlo en mi correo
        </Button>
      )}

      <Button type="submit" ancho="completo" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar código"}
      </Button>
    </form>
  );
}

function PasoCodigo({
  demo,
  enviado,
  medio,
  onCambiar,
}: {
  demo: boolean;
  enviado: Enviado | null;
  medio: MedioCodigo;
  onCambiar: () => void;
}) {
  const ids = useId();
  const [codigo, setCodigo] = useState("");
  const [verificacion, verificar, verificando] = useActionState<EstadoEntrar, FormData>(
    demo ? codigoDemo : verificarCodigo,
    {},
  );
  const [reenvio, reenviar, reenviando] = useActionState<EstadoEntrar>(reenviarCodigo, {});
  const formulario = useRef<HTMLFormElement>(null);
  const [segundos, setSegundos] = useState(ESPERA_REENVIO);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  // Un reenvío que salió bien reinicia la espera y limpia las casillas.
  useEffect(() => {
    if (!reenvio.aviso) return;
    setSegundos(ESPERA_REENVIO);
    setCodigo("");
  }, [reenvio]);

  const error = verificacion.error;
  const errorId = `${ids}-error`;
  const ayudaId = `${ids}-ayuda`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <LlegadaCodigo medio={medio} />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">{medio === "celular" ? "Revisa tus mensajes" : "Revisa tu correo"}</h2>
          <p className="text-lg text-text-muted">
            Te enviamos el código {medio === "celular" ? "por mensaje de texto" : "por correo"}
            {enviado && (
              <>
                {" "}
                al <span className="font-bold text-text">{enviado.a}</span>
              </>
            )}
            . Sirve durante 10 minutos.
          </p>
          {medio === "correo" && (
            <p className="text-base text-text-muted">Si no lo ves, busca en la carpeta de correo no deseado.</p>
          )}
        </div>
      </div>

      <form ref={formulario} action={verificar} className="flex flex-col gap-4" noValidate aria-busy={verificando}>
        <p id={`${ids}-etiqueta`} className="text-lg font-bold">
          Código de 6 números
        </p>
        <p id={ayudaId} className="-mt-3 text-base text-text-muted">
          Al escribir el último número, entras solo.
        </p>
        <CasillasCodigo
          valor={codigo}
          onCambio={setCodigo}
          onCompleto={() => queueMicrotask(() => formulario.current?.requestSubmit())}
          deshabilitado={verificando}
          invalido={Boolean(error)}
          etiquetaId={`${ids}-etiqueta`}
          describedBy={[ayudaId, error ? errorId : null].filter(Boolean).join(" ")}
        />
        <p aria-live="polite" className="min-h-7 text-base font-bold">
          {verificando ? (
            "Revisando el código…"
          ) : error ? (
            <span id={errorId} role="alert" className="text-danger">
              {error}
            </span>
          ) : null}
        </p>
        <Button type="submit" ancho="completo" disabled={verificando || codigo.length !== 6}>
          {verificando ? "Revisando…" : "Entrar"}
        </Button>
      </form>

      <div className="flex flex-col gap-3 border-t border-border-subtle pt-6">
        <form action={demo ? undefined : reenviar} className="flex flex-col gap-2">
          <p className="text-base text-text-muted">
            {segundos > 0 ? `Puedes pedir otro código en ${segundos} segundos.` : "¿No te llegó? Puedes pedir otro código."}
          </p>
          {/* Solo se anuncia cuando ya se puede reenviar o cuando cambia el resultado, no cada segundo */}
          <p aria-live="polite" className="text-base font-bold">
            {segundos === 0 && !reenvio.error && !reenvio.aviso ? <span className="sr-only">Ya puedes pedir otro código.</span> : null}
            {reenvio.aviso}
            {reenvio.error && <span className="text-danger">{reenvio.error}</span>}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type={demo ? "button" : "submit"}
              variant="secundario"
              size="normal"
              disabled={segundos > 0 || reenviando}
              onClick={demo ? () => setSegundos(ESPERA_REENVIO) : undefined}
            >
              {reenviando ? "Enviando…" : "Enviar otro código"}
            </Button>
            <Button type="button" variant="enlace" size="normal" onClick={onCambiar}>
              {medio === "celular" ? "Cambiar número o usar correo" : "Cambiar correo o usar celular"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
