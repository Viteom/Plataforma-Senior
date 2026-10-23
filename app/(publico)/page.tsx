import { Building2, EyeOff, KeyRound, MessageSquareText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MODO_DEMO } from "@/lib/demo";
import { MARCA } from "@/lib/marca";

const pasos = [
  {
    icono: KeyRound,
    titulo: "Entra con un código",
    texto: "Te llega por mensaje de texto o correo. No necesitas contraseña.",
  },
  {
    icono: MessageSquareText,
    titulo: "Cuenta lo que sabes hacer",
    texto: "Un reto que resolviste, escrito, hablándole al celular o en una llamada con nosotros.",
  },
  {
    icono: EyeOff,
    titulo: "Tú decides quién ve tu nombre",
    texto: "Puedes mostrar solo tu experiencia hasta que aceptes conocer a una empresa.",
  },
];

const demo = [
  { href: "/inicio", etiqueta: "Talento: inicio" },
  { href: "/perfil/nuevo", etiqueta: "Talento: crear perfil" },
  { href: "/empresa/explorar", etiqueta: "Empresa" },
  { href: "/equipo", etiqueta: "Equipo de curaduría" },
  { href: "/gestor/registrar", etiqueta: "Gestor territorial" },
];

export default function Portada() {
  return (
    <div className="flex flex-col gap-12">
      {/* Banda de marca: cobalto con la «cana» lima solo en el remate (brandbook: lima ≤ 10 %). */}
      <section className="flex flex-col overflow-hidden rounded-lg bg-primary text-on-primary">
        <div className="flex flex-col gap-6 p-6">
          <p className="text-base font-bold tracking-wide text-accent">Talento con trayectoria</p>
          <h1 className="font-display text-display font-extrabold tracking-tight">
            Tu experiencia{" "}
            <span className="font-editorial font-normal text-accent italic">abre posibilidades</span>
          </h1>
          <p className="max-w-prose text-lg">
            Cuenta lo que sabes y elige cómo quieres trabajar: por horas, por proyecto, como mentor o
            guiando un taller.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild variant="acento" ancho="completo">
              <Link href="/entrar">Crear mi perfil</Link>
            </Button>
            <p className="text-center text-base">
              ¿Ya tienes perfil?{" "}
              <Link href="/entrar" className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
                Entrar
              </Link>
            </p>
          </div>
        </div>
        <Image
          src="/marca/retrato-portada.webp"
          alt=""
          width={900}
          height={599}
          priority
          className="h-auto w-full border-t-8 border-white"
        />
      </section>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-5">
        <h2 id="como-funciona" className="font-display text-3xl font-extrabold tracking-tight">
          Cómo funciona
        </h2>
        <ol className="flex flex-col gap-5">
          {pasos.map(({ icono: Icono, titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icono aria-hidden className="size-6" />
              </span>
              <div>
                <h3 className="text-lg">
                  <span className="sr-only">Paso {i + 1}: </span>
                  {titulo}
                </h3>
                <p className="text-text-muted">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="empresas" className="flex flex-col gap-3 rounded-lg bg-deep p-6 text-on-deep">
        <Building2 aria-hidden className="size-8 text-accent" />
        <h2 id="empresas" className="font-display text-2xl font-extrabold tracking-tight">
          ¿Eres una organización?
        </h2>
        <p>
          Cuéntanos tu reto y te presentamos hasta 5 personas con la experiencia para aportar a resolverlo.
        </p>
        <Button asChild variant="secundario" ancho="completo">
          <Link href={MODO_DEMO ? "/empresa/explorar" : "/entrar?para=empresa"}>Explorar perfiles</Link>
        </Button>
      </section>

      <p className="text-center font-editorial text-2xl italic">{MARCA.lema}</p>

      {MODO_DEMO && (
        <nav
          aria-labelledby="demo"
          className="flex flex-col gap-3 rounded-md border-2 border-dashed border-border p-5"
        >
          <h2 id="demo" className="text-lg">
            Demostración
          </h2>
          <p className="text-base text-text-muted">
            Mientras no hay inicio de sesión, entra a cada área desde aquí.
          </p>
          <ul className="flex flex-col gap-1">
            {demo.map(({ href, etiqueta }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-tap items-center text-base font-bold underline underline-offset-4"
                >
                  {etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
