import { ArrowUp } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/marca/logo";
import { MODO_DEMO } from "@/lib/demo";
import { CREDITOS } from "@/lib/web/contenido";

import { MARCO } from "./marco";

const COLUMNAS = [
  {
    titulo: "Para talento",
    enlaces: [
      { href: "/talento", texto: "Cómo funciona" },
      { href: "/entrar", texto: "Crear mi perfil" },
      { href: "/talento#formas", texto: "Formas de trabajar" },
    ],
  },
  {
    titulo: "Para organizaciones",
    enlaces: [
      { href: "/organizaciones", texto: "Encontrar talento" },
      { href: "/entrar?para=empresa", texto: "Contar un reto" },
      { href: "/campo", texto: "Talento del campo" },
    ],
  },
  {
    titulo: "Kánna",
    enlaces: [
      { href: "/confianza", texto: "Confianza y seguridad" },
      { href: "/privacidad", texto: "Privacidad" },
      { href: "/ayuda", texto: "Ayuda" },
    ],
  },
];

const DEMO = [
  { href: "/inicio", texto: "Talento: inicio" },
  { href: "/perfil/nuevo", texto: "Talento: crear perfil" },
  { href: "/empresa/explorar", texto: "Organización" },
  { href: "/equipo", texto: "Equipo de curaduría" },
  { href: "/gestor/registrar", texto: "Gestor territorial" },
  { href: "/demo/mensajes", texto: "Mensajes al celular (diseño)" },
];

const enlace =
  "inline-flex min-h-tap items-center text-lg underline-offset-4 hover:underline";

// El cierre de todas las páginas: la salida humana es el titular («Te llamamos») y debajo, los
// enlaces por público, la firma y los créditos de las fotos.
export function PieWeb() {
  return (
    <footer className="bg-primary text-on-primary">
      <div className={`${MARCO} flex flex-col gap-16 pt-12 pb-10 lg:gap-24`}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex max-w-[40ch] flex-col gap-4">
            <Logo alto={36} negativo />
            <p className="text-lg">
              Conectamos personas con trayectoria con organizaciones que buscan
              talento para nuevos retos. En Colombia.
            </p>
          </div>
          <a
            href="#contenido"
            className="inline-flex min-h-tap items-center gap-2 text-lg font-bold underline underline-offset-4"
          >
            <ArrowUp aria-hidden className="size-5" />
            Volver arriba
          </a>
        </div>

        <nav aria-label="Pie de página" className="grid gap-10 sm:grid-cols-3">
          {COLUMNAS.map((c) => (
            <div key={c.titulo} className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">{c.titulo}</h2>
              <ul>
                {c.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link href={e.href} className={enlace}>
                      {e.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <p className="text-xl">¿Prefieres hablar con una persona?</p>
          <Link
            href="/ayuda"
            className="titular-marca w-fit text-gigante text-accent underline decoration-4 underline-offset-[0.12em] transition-opacity duration-150 hover:opacity-90"
          >
            Te llamamos
          </Link>
          <p className="max-w-[44ch] text-lg">
            Deja tu celular en Ayuda y una persona del equipo te llama en la
            mañana o en la tarde.
          </p>
        </div>

        {MODO_DEMO && (
          <nav
            aria-labelledby="demo"
            className="flex flex-col gap-2 rounded-md bg-primary-hover p-5"
          >
            <h2 id="demo" className="text-lg font-bold">
              Demostración: entra a cada área
            </h2>
            <ul className="flex flex-wrap gap-x-6">
              {DEMO.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className={`${enlace} font-bold underline`}
                  >
                    {d.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="flex flex-col gap-4 text-base lg:flex-row lg:items-end lg:justify-between">
          <p className="font-display text-titular font-extrabold tracking-tight">
            Experiencia{" "}
            <span className="font-editorial font-normal italic">
              que abre posibilidades.
            </span>
          </p>
          <p className="max-w-[60ch]">
            Perfiles de ejemplo y fotografías de referencia de{" "}
            {CREDITOS.map((c, i) => (
              <span key={c.url}>
                {i > 0 && " y "}
                <a href={c.url} className="underline underline-offset-4">
                  «{c.obra}»
                </a>
              </span>
            ))}
            . Fotografías ilustrativas de banco; no representan perfiles
            registrados en Kánna. Consulta las condiciones en Pexels.
          </p>
        </div>
      </div>
    </footer>
  );
}
