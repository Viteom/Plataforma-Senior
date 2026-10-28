import { ArrowLeft, Clock, PhoneOff, ShieldCheck, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotonAyuda } from "@/components/layout/boton-ayuda";
import { Logo } from "@/components/marca/logo";
import { MINUTOS_INACTIVIDAD } from "@/lib/auth/inactividad";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

import { salirEquipo } from "./acciones";
import { FormularioClave, FormularioCodigo } from "./formularios";

export const metadata: Metadata = { title: "Entrada del equipo" };

type Paso = { paso: "clave" } | { paso: "codigo" } | { paso: "activar"; qr: string | null; secreto: string } | { paso: "error" };

// Qué paso le toca a quien llega. El middleware ya mandó a su inicio a quien tiene segundo factor
// y a su área a quien no es del equipo.
async function pasoActual(pasoDemo?: string): Promise<Paso> {
  if (MODO_DEMO) {
    if (pasoDemo === "codigo") return { paso: "codigo" };
    if (pasoDemo === "activar") return { paso: "activar", qr: null, secreto: "K4NN A7QX P2LM 9WRT" };
    return { paso: "clave" };
  }
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { paso: "clave" };

  const { data: factores } = await supabase.auth.mfa.listFactors();
  if (factores?.totp.length) return { paso: "codigo" };

  // Primera vez: se descartan los códigos que quedaron sin activar y se crea uno nuevo.
  for (const f of factores?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data: nuevo, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Kánna",
    issuer: "Kánna",
  });
  if (error || !nuevo) {
    console.error("[equipo] crear segundo factor:", error?.status, error?.code);
    return { paso: "error" };
  }
  return { paso: "activar", qr: nuevo.totp.qr_code, secreto: nuevo.totp.secret.replace(/(.{4})/g, "$1 ").trim() };
}

const GARANTIAS = [
  { Icono: ShieldCheck, texto: "Segundo factor obligatorio para todo el equipo." },
  { Icono: Clock, texto: `La sesión se cierra tras ${MINUTOS_INACTIVIDAD} minutos sin uso.` },
  { Icono: PhoneOff, texto: "Nadie de Kánna te va a pedir tu clave ni tu código, ni por teléfono ni por WhatsApp." },
];

export default async function EntradaEquipo({
  searchParams,
}: {
  searchParams: Promise<{ paso?: string; motivo?: string }>;
}) {
  const { paso: pasoDemo, motivo } = await searchParams;
  const estado = await pasoActual(pasoDemo);
  const numero = estado.paso === "clave" ? 1 : 2;
  const etiquetaPaso = { clave: "Tu cuenta", codigo: "Código de verificación", activar: "Primera vez", error: "Segundo factor" }[
    estado.paso
  ];

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[5fr_7fr]">
      <aside className="flex flex-col gap-4 bg-deep px-4 pt-5 pb-6 text-on-deep lg:gap-10 lg:px-14 lg:py-12">
        <Logo negativo alto={30} />
        <div className="flex flex-col gap-2 lg:mt-auto lg:gap-5">
          <p className="font-display text-display lg:text-display-lg">
            Equipo <span className="text-accent">Kánna</span>
          </p>
          <p className="max-w-[30ch] lg:text-lg">
            Aquí cuidas los datos de personas que confiaron en Kánna. Cada lectura y cada decisión quedan registradas.
          </p>
        </div>
        <ul className="hidden flex-col gap-3 border-t border-on-deep/25 pt-7 lg:flex">
          {GARANTIAS.map(({ Icono, texto }) => (
            <li key={texto} className="flex items-start gap-3">
              <Icono aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
              {texto}
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col px-4 py-4 lg:px-14 lg:py-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-tap items-center gap-2 font-bold underline underline-offset-4">
            <ArrowLeft aria-hidden className="size-5" />
            Ir a la página de Kánna
          </Link>
          <BotonAyuda />
        </div>

        <main id="contenido" className="my-auto flex w-full max-w-md flex-col gap-6 self-center py-8 lg:py-10">
          <p className="flex items-center gap-3 text-base font-bold text-text-muted">
            <span aria-hidden className="flex gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-primary" />
              <span className={`h-1.5 w-8 rounded-full ${numero === 2 ? "bg-primary" : "bg-surface-strong"}`} />
            </span>
            Paso {numero} de 2 · {etiquetaPaso}
          </p>

          {motivo === "inactividad" && estado.paso === "clave" && (
            <p role="status" className="flex gap-3 rounded-md bg-surface p-4">
              <Clock aria-hidden className="mt-1 size-5 shrink-0" />
              Cerramos tu sesión porque pasaron {MINUTOS_INACTIVIDAD} minutos sin uso. Entra de nuevo.
            </p>
          )}

          {estado.paso === "clave" && (
            <>
              <h1 className="text-3xl">Entra al panel del equipo</h1>
              <FormularioClave demo={MODO_DEMO} />
              <details className="text-base">
                <summary className="min-h-tap cursor-pointer content-center font-bold text-text-muted underline underline-offset-4">
                  Olvidé mi clave
                </summary>
                <p className="pt-2">
                  Pídele a administración del equipo que te asigne una clave nueva. Por seguridad, no se recupera por
                  SMS ni por WhatsApp.
                </p>
              </details>
              <p className="border-t-2 border-border-subtle pt-5 text-base">
                ¿Eres talento o una organización?{" "}
                <Link href="/entrar" className="font-bold underline underline-offset-4">
                  Entra por aquí
                </Link>
              </p>
            </>
          )}

          {estado.paso === "codigo" && (
            <>
              <h1 className="text-3xl">Escribe el código de tu app</h1>
              <p>
                Abre tu app de verificación (por ejemplo Google Authenticator o Microsoft Authenticator) y escribe los 6
                números que ves para Kánna.
              </p>
              <FormularioCodigo demo={MODO_DEMO} texto="Entrar al panel" />
              <p className="flex gap-3 rounded-md bg-surface p-4 text-base">
                <Smartphone aria-hidden className="mt-1 size-5 shrink-0" />
                ¿Perdiste o cambiaste de celular? Pide a administración que restablezca tu segundo factor. Lo hace en
                persona o por videollamada.
              </p>
              <OtraCuenta />
            </>
          )}

          {estado.paso === "activar" && (
            <>
              <h1 className="text-3xl">Activa tu segundo factor</h1>
              <ol className="flex list-decimal flex-col gap-1 pl-6">
                <li>Instala una app de verificación en tu celular.</li>
                <li>En la app, toca «Agregar» y escanea este código.</li>
                <li>Escribe aquí los 6 números que aparecen.</li>
              </ol>
              <div className="flex flex-col items-center gap-4 rounded-md border-2 border-border-subtle bg-raised p-4 text-center sm:flex-row sm:text-left">
                {estado.qr ? (
                  // El código lo genera Supabase como imagen SVG en línea; no sale a ningún otro sitio.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={estado.qr} alt="Código QR para agregar Kánna a tu app de verificación" width={168} height={168} />
                ) : (
                  <p className="flex size-42 shrink-0 items-center justify-center rounded-sm bg-surface p-3 text-base">
                    En la demostración no se crea un código real.
                  </p>
                )}
                <p className="text-base">
                  <span className="text-text-muted">¿No puedes escanear? Escribe esta clave en la app:</span>
                  <code className="mt-2 block rounded-sm bg-surface px-2 py-1 font-bold tracking-wider break-all">
                    {estado.secreto}
                  </code>
                </p>
              </div>
              <FormularioCodigo demo={MODO_DEMO} texto="Activar y entrar" />
              <OtraCuenta />
            </>
          )}

          {estado.paso === "error" && (
            <>
              <h1 className="text-3xl">No pudimos preparar tu segundo factor</h1>
              <p>Intenta de nuevo en un momento. Si sigue pasando, pide ayuda a administración del equipo.</p>
              <OtraCuenta />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function OtraCuenta() {
  if (MODO_DEMO) return null;
  return (
    <form action={salirEquipo}>
      <button type="submit" className="min-h-tap font-bold underline underline-offset-4">
        Entrar con otra cuenta
      </button>
    </form>
  );
}
