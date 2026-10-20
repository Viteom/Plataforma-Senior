import { Building2, EyeOff, KeyRound, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MODO_DEMO } from "@/lib/demo";

const pasos = [
  {
    icono: KeyRound,
    titulo: "Entre con un código",
    texto: "Le llega por mensaje de texto o correo. No necesita contraseña.",
  },
  {
    icono: MessageSquareText,
    titulo: "Cuente un problema que resolvió",
    texto: "Escribiéndolo, hablándole al celular o en una llamada con nosotros.",
  },
  {
    icono: EyeOff,
    titulo: "Usted decide quién ve su nombre",
    texto: "Puede mostrar solo su experiencia hasta que acepte conocer a una empresa.",
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
      <section className="flex flex-col gap-6">
        <p className="text-lg font-bold text-text-muted">Talento con trayectoria</p>
        <h1 className="text-3xl">Lo que usted ya resolvió es lo que una empresa necesita hoy</h1>
        <p className="max-w-prose text-lg text-text-muted">
          Cuente su experiencia y elija cómo quiere trabajar: por horas, por proyecto, como mentor
          o guiando un taller.
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild ancho="completo">
            <Link href="/entrar">Crear mi perfil</Link>
          </Button>
          <p className="text-center text-base">
            ¿Ya tiene perfil?{" "}
            <Link href="/entrar" className="inline-flex min-h-tap items-center font-bold underline underline-offset-4">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="flex flex-col gap-5">
        <h2 id="como-funciona" className="text-xl">
          Cómo funciona
        </h2>
        <ol className="flex flex-col gap-5">
          {pasos.map(({ icono: Icono, titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-strong">
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

      <section
        aria-labelledby="empresas"
        className="flex flex-col gap-3 rounded-lg bg-surface p-5"
      >
        <Building2 aria-hidden className="size-8" />
        <h2 id="empresas" className="text-xl">
          ¿Es una empresa?
        </h2>
        <p className="text-text-muted">
          Busque por el problema que necesita resolver y conozca a quien ya lo resolvió antes.
        </p>
        <Button asChild variant="secundario" ancho="completo">
          <Link href={MODO_DEMO ? "/empresa/explorar" : "/entrar?para=empresa"}>Explorar perfiles</Link>
        </Button>
      </section>

      {MODO_DEMO && (
        <nav
          aria-labelledby="demo"
          className="flex flex-col gap-3 rounded-md border-2 border-dashed border-border p-5"
        >
          <h2 id="demo" className="text-lg">
            Demostración del hito 1
          </h2>
          <p className="text-base text-text-muted">
            Mientras no hay inicio de sesión, entre a cada área desde aquí.
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
