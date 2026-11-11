import { FileText, Scale, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Pantalla } from "@/components/layout/pantalla";

export const metadata: Metadata = { title: "Beneficios y preguntas" };

// Beneficios en impuestos por contratar talento con trayectoria y preguntas frecuentes de las
// organizaciones. BORRADOR: el texto legal lo debe revisar el abogado laboral antes de darlo por
// definitivo. Kánna nunca muestra la edad ni la pensión de una persona (regla 1): lo que la ley
// pide sobre pensión se conversa directamente con la persona cuando ya hay acuerdo.

const BENEFICIOS = [
  {
    ley: "Ley 2040 de 2020",
    titulo: "Deducción del 120 % en el impuesto de renta",
    para: "Por contratar personas que ya cumplieron la edad de pensión y no reciben una pensión.",
    puntos: [
      "Puedes deducir el 120 % de los salarios y prestaciones que les pagas.",
      "Deben ser al menos el 2,5 % de tu nómina si tienes menos de 100 personas empleadas. El porcentaje sube 0,5 puntos por cada 100 personas más, hasta el 5 %.",
      "La persona debe estar vinculada por lo menos un año con contrato de trabajo.",
      "El Ministerio del Trabajo certifica que cumples. La misma ley crea el sello «Amigable» para las organizaciones que contratan a estas personas.",
    ],
  },
  {
    ley: "Ley 1429 de 2010, artículo 11",
    titulo: "Descuento por emplear mujeres de 40 años o más",
    para: "Por vincular mujeres de 40 años o más que llevaban al menos 12 meses sin contrato de trabajo.",
    puntos: [
      "Los aportes parafiscales de esos empleos nuevos se pueden tomar como descuento en el impuesto de renta.",
      "El beneficio dura máximo dos años por persona y exige que el empleo sea nuevo en tu nómina.",
      "Desde la Ley 1607 de 2012 muchas organizaciones ya no pagan parte de esos aportes. Revisa con tu contador cuánto te sirve hoy.",
    ],
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Kánna me dice si una persona recibe pensión?",
    respuesta:
      "No. Kánna nunca muestra la edad de una persona ni si recibe pensión, y esos datos no cambian qué perfiles ves. Si necesitas saberlo para un beneficio de impuestos, lo conversas con la persona cuando ya tienen un acuerdo. Ella decide si te lo cuenta.",
  },
  {
    pregunta: "¿Qué necesito para pedir la deducción de la Ley 2040?",
    respuesta:
      "Que la persona te entregue una declaración firmada bajo juramento en la que dice que no recibe pensión de vejez, familiar ni de sustitución. Con eso y el contrato de trabajo pides la certificación al Ministerio del Trabajo. Tu contador te confirma los requisitos del año.",
  },
  {
    pregunta: "¿Puedo contratar a una persona que ya recibe pensión?",
    respuesta:
      "Sí. Una persona con pensión de vejez puede trabajar. En ese caso no aporta a pensión, pero sí a salud y a riesgos laborales. Si tu organización es pública, no puede recibir otro salario del Estado, aunque sí un contrato de prestación de servicios.",
  },
  {
    pregunta: "¿Cuánto cuesta usar Kánna?",
    respuesta:
      "Explorar perfiles y contar un reto no tiene costo. Nadie de Kánna le pide dinero a una persona por conectarla contigo, y tú tampoco debes pedírselo.",
  },
  {
    pregunta: "¿Por qué no veo el nombre ni la foto de algunos perfiles?",
    respuesta:
      "Porque la persona eligió un perfil reservado. Ves su experiencia y su oficio. El nombre y la foto aparecen cuando las dos partes aceptan conocerse.",
  },
  {
    pregunta: "¿Qué formas de trabajo puedo proponer?",
    respuesta:
      "Una conversación de una hora, trabajo por horas, por proyecto, mentoría, un cargo fraccional, medio tiempo o un taller. Kánna revisa que cada acuerdo tenga pago justo, tareas claras y descansos.",
  },
  {
    pregunta: "¿Por qué Kánna revisa mi reto antes de enviarlo?",
    respuesta:
      "Para cuidar a las dos partes. Revisamos que el reto sea claro, que el pago no esté por debajo de lo justo y que tu organización esté verificada con su NIT.",
  },
];

export default function Beneficios() {
  return (
    <Pantalla
      titulo="Beneficios y preguntas"
      intro="Lo que la ley te reconoce por contratar talento con trayectoria, y las dudas más comunes de las organizaciones."
    >
      <p className="flex items-start gap-3 rounded-md bg-surface p-4">
        <Scale aria-hidden className="mt-0.5 size-6 shrink-0" />
        <span>
          Esta página es una guía. Antes de usar un beneficio, confirma los requisitos de este año con tu contador o tu
          abogado.
        </span>
      </p>

      <section aria-labelledby="beneficios" className="flex flex-col gap-4">
        <h2 id="beneficios" className="text-xl">
          Beneficios en impuestos
        </h2>
        <ul className="grid gap-4 lg:grid-cols-2">
          {BENEFICIOS.map((b) => (
            <li key={b.ley} className="flex flex-col gap-3 rounded-lg border-2 border-border-subtle bg-raised p-5">
              <p className="inline-flex items-center gap-2 self-start rounded-full bg-surface px-3 py-0.5 text-base font-bold">
                <FileText aria-hidden className="size-5" />
                {b.ley}
              </p>
              <h3 className="text-lg font-bold">{b.titulo}</h3>
              <p>{b.para}</p>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
                {b.puntos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-3 rounded-md border-2 border-text p-4">
          <ShieldCheck aria-hidden className="mt-0.5 size-6 shrink-0" />
          <span>
            <span className="font-bold">Kánna no usa la edad para elegir perfiles.</span> Los beneficios dependen de datos
            que solo la persona puede darte. Nunca los pidas antes de tener un acuerdo ni como condición para conversar.
          </span>
        </p>
      </section>

      <section aria-labelledby="preguntas" className="flex flex-col gap-3">
        <h2 id="preguntas" className="text-xl">
          Preguntas frecuentes
        </h2>
        <div className="flex flex-col gap-2">
          {PREGUNTAS.map((p) => (
            <details key={p.pregunta} name="preguntas-empresa" className="group rounded-md bg-surface open:bg-raised open:ring-2 open:ring-text open:ring-inset">
              <summary className="flex min-h-action cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-lg font-bold [&::-webkit-details-marker]:hidden">
                {p.pregunta}
                <span aria-hidden className="shrink-0 text-2xl leading-none group-open:hidden">
                  +
                </span>
                <span aria-hidden className="hidden shrink-0 text-2xl leading-none group-open:inline">
                  −
                </span>
              </summary>
              <p className="max-w-[65ch] px-4 pb-4">{p.respuesta}</p>
            </details>
          ))}
        </div>
        <p>
          ¿No encuentras tu duda?{" "}
          <Link href="/ayuda" className="font-bold underline underline-offset-4">
            Habla con el equipo de Kánna
          </Link>
        </p>
      </section>
    </Pantalla>
  );
}
