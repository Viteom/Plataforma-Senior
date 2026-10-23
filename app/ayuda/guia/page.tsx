import type { Metadata } from "next";

import { BotonVolver } from "@/components/layout/boton-volver";
import { Pantalla } from "@/components/layout/pantalla";

export const metadata: Metadata = { title: "Guía paso a paso" };

const pasos = [
  {
    titulo: "Entrar",
    puntos: [
      "Toca «Crear mi perfil» o «Entrar».",
      "Escribe tu número de celular. Te llega un código de 6 números por mensaje de texto.",
      "Escribe el código. No necesitas contraseña.",
    ],
  },
  {
    titulo: "Crear tu perfil",
    puntos: [
      "Son 3 pasos: tus datos, cómo quieres trabajar y quién ve tu perfil.",
      "Con «Reservado», las empresas no ven tu nombre hasta que aceptes conocerlas.",
    ],
  },
  {
    titulo: "Contar tu historia",
    puntos: [
      "Cuenta un reto difícil que resolviste: qué pasó, qué hiciste y cómo terminó.",
      "Puedes escribirla, contarla hablando o pedir que te llamemos.",
      "Después revisa las etiquetas y quita las que no son tuyas.",
    ],
  },
  {
    titulo: "Recibir oportunidades",
    puntos: [
      "Cuando una empresa te busque, te avisamos.",
      "Tú decides: «Me interesa» o «No me interesa».",
      "Si te interesa, alguien del equipo los pone en contacto.",
    ],
  },
  {
    titulo: "Cuidarte de estafas",
    puntos: [
      "Nadie de Kánna ni de una empresa te va a pedir dinero, códigos ni contraseñas.",
      "Nunca pagues por exámenes, cursos ni «aportes» para conseguir un trabajo.",
      "Si alguien lo hace, usa «Reportar esta empresa» o pide que te llamemos.",
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
        <Pantalla titulo="Guía paso a paso" intro="Lo básico para usar Kánna. Si algo no te funciona, pide que te llamemos.">
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
