import Link from "next/link";

// «Tu experiencia vale más»: el titular y la puerta a cómo funciona. Los retratos pasaron al
// banner, justo encima, así que aquí ya no se repiten.
export function Importa() {
  return (
    <section aria-labelledby="titulo-importa" className="bg-neutro py-24 font-web text-tinta lg:py-32">
      <div className="mx-auto max-w-web px-4 text-center md:px-8">
        <h2 id="titulo-importa" className="text-seccion font-medium tracking-[-0.035em] text-balance">
          Tu <span className="resaltado">experiencia</span> vale más <span className="block text-tinta-suave">que un diploma.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-lg sm:text-xl">
          Kánna convierte tu historia en una huella de capacidades que las organizaciones entienden. La cuentas con tu voz o
          por escrito; nosotros la ordenamos contigo.
        </p>
        <Link
          href="#como-funciona"
          className="mt-8 inline-flex min-h-action items-center gap-2 rounded-full bg-primary px-7 text-lg font-semibold text-on-primary active:scale-[0.97]"
        >
          Así funciona
        </Link>
      </div>
    </section>
  );
}
