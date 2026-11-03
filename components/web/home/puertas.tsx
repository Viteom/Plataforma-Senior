import Image from "next/image";
import Link from "next/link";

// Cierre: dos puertas grandes. La foto arriba y el texto sobre fondo sólido, siempre legible.
const PUERTAS = [
  { href: "/entrar", quien: "Soy talento", titulo: "Crear mi perfil", accion: "Empezar gratis", foto: "/web/home/asesor.webp", fondo: "bg-deep", boton: "bg-accent text-on-accent" },
  { href: "/entrar?para=empresa", quien: "Soy empresa", titulo: "Buscar talento", accion: "Conversemos", foto: "/web/home/gerente.webp", fondo: "bg-tinta", boton: "bg-white text-tinta" },
];

export function Puertas() {
  return (
    <section aria-labelledby="titulo-puertas" className="bg-neutro pt-10 pb-24 font-web text-tinta lg:pb-32">
      <div className="mx-auto max-w-web px-4 md:px-8">
        <h2 id="titulo-puertas" className="text-center text-banner font-medium tracking-[-0.04em]">
          ¿Por dónde <span className="block text-tinta-suave">empezamos?</span>
        </h2>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {PUERTAS.map((p) => (
            <Link key={p.href} href={p.href} className={`group flex flex-col overflow-hidden rounded-lg text-white ${p.fondo}`}>
              <span className="relative block h-60 overflow-hidden md:h-80">
                <Image src={p.foto} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-[1.04]" />
              </span>
              <span className="flex flex-col items-start px-6 pt-7 pb-8 md:px-8">
                <span className="text-lg font-semibold text-accent">{p.quien}</span>
                <span className="mt-1.5 text-3xl font-semibold tracking-tight md:text-display">{p.titulo}</span>
                <span className={`mt-5 inline-flex min-h-action items-center rounded-full px-7 text-lg font-semibold ${p.boton}`}>{p.accion}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
