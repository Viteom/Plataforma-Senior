import Image from "next/image";
import Link from "next/link";

// Talento del campo, dentro de la ruta de talento y con su propia línea: verde tierra, semitono y
// letra con serifa. Le habla a quien tiene un saber del campo; las empresas tienen un enlace aparte.
export function Campo() {
  return (
    <section id="campo" aria-labelledby="titulo-campo" className="scroll-mt-20 bg-campo-claro text-campo">
      <div className="grid xl:min-h-[92svh] xl:grid-cols-2">
        <div className="relative h-[360px] xl:h-auto">
          <Image src="/web/campo-tejido.webp" alt="Manos tejiendo paja toquilla en Sandoná, Nariño" fill sizes="(min-width: 1280px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="semitono relative flex flex-col justify-center overflow-hidden bg-campo px-6 py-16 text-campo-claro md:px-12 xl:px-16 xl:py-20">
          <div className="relative">
            <span className="text-sm tracking-[0.14em] text-campo-acento uppercase">Soy talento · del campo</span>
            <h2 id="titulo-campo" className="mt-4 font-editorial text-afiche">
              Saberes que se <br />
              hacen <em className="text-campo-acento">a mano.</em>
            </h2>
            <p className="mt-6 max-w-[42ch] text-lg sm:text-xl">
              Si tu saber viene del campo —tejer, cultivar café, la carpintería o la cocina tradicional— también tiene lugar en
              Kánna. No necesitas usar la app: una persona del equipo te acompaña a crear tu perfil y a ofrecer tus talleres u
              oficios por encargo.
            </p>
            <div className="mt-8 grid max-w-[32rem] gap-3 font-web sm:grid-cols-2">
              {[
                { t: "Te acompañamos", d: "Un gestor va a tu territorio y registra contigo lo que sabes hacer." },
                { t: "Talleres y encargos", d: "Enseñas tu oficio a equipos o haces piezas por encargo, con pago justo." },
              ].map((o) => (
                <div key={o.t} className="rounded-md px-4 py-4 ring-1 ring-campo-claro/30 ring-inset">
                  <b className="block font-editorial text-2xl font-normal">{o.t}</b>
                  <span className="text-base">{o.d}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-col items-start gap-4 font-web">
              <Link href="/ayuda#llameme" className="inline-flex min-h-action items-center rounded-full bg-campo-claro px-7 text-lg font-semibold text-campo active:scale-[0.97]">
                Quiero que me acompañen
              </Link>
              <Link href="/campo" className="inline-flex min-h-tap items-center text-base text-campo-acento underline underline-offset-4">
                ¿Eres empresa? Mira los talleres para equipos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
