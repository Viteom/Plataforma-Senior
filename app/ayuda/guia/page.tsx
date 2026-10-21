import type { Metadata } from "next";

import { BotonVolver } from "@/components/layout/boton-volver";
import { Pantalla } from "@/components/layout/pantalla";

export const metadata: Metadata = { title: "Guía paso a paso" };

const pasos = [
  {
    titulo: "Entrar",
    puntos: [
      "Toque «Crear mi perfil» o «Entrar».",
      "Escriba su número de celular. Le llega un código de 6 números por mensaje de texto.",
      "Escriba el código. No necesita contraseña.",
    ],
  },
  {
    titulo: "Crear su perfil",
    puntos: [
      "Son 3 pasos: sus datos, cómo quiere trabajar y quién ve su perfil.",
      "Con «Reservado», las empresas no ven su nombre hasta que usted acepte conocerlas.",
    ],
  },
  {
    titulo: "Contar su historia",
    puntos: [
      "Cuente un problema difícil que resolvió: qué pasó, qué hizo y cómo terminó.",
      "Puede escribirla, contarla hablando o pedir que le llamemos.",
      "Después revise las etiquetas y quite las que no son suyas.",
    ],
  },
  {
    titulo: "Recibir oportunidades",
    puntos: [
      "Cuando una empresa le busque, le avisamos.",
      "Usted decide: «Me interesa» o «No me interesa».",
      "Si le interesa, alguien del equipo les pone en contacto.",
    ],
  },
  {
    titulo: "Cuidarse de estafas",
    puntos: [
      "Nadie de la plataforma ni de una empresa le va a pedir dinero, códigos ni contraseñas.",
      "Nunca pague por exámenes, cursos ni «aportes» para conseguir un trabajo.",
      "Si alguien lo hace, use «Reportar esta empresa» o pida que le llamemos.",
    ],
  },
];

export default function Guia() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b-2 border-border-subtle bg-bg">
        <div className="mx-auto flex min-h-16 max-w-xl items-center px-4">
          <BotonVolver />
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-xl px-4 py-8">
        <Pantalla titulo="Guía paso a paso" intro="Lo básico para usar la plataforma. Si algo no le funciona, pida que le llamemos.">
          <ol className="flex flex-col gap-6">
            {pasos.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-strong text-lg font-bold">{i + 1}</span>
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl">{p.titulo}</h2>
                  <ul className="flex list-disc flex-col gap-1 pl-5">
                    {p.puntos.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </Pantalla>
      </main>
    </>
  );
}
