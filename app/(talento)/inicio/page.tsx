import { ArrowRight, BookOpen, Handshake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AvisoBienestar } from "@/components/bienestar/aviso";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { Tarjeta } from "@/components/ui/tarjeta";
import { listarOportunidades } from "@/lib/datos/consultas";

export const metadata: Metadata = { title: "Inicio" };

export default async function Inicio() {
  const nuevas = (await listarOportunidades()).filter((o) => o.estado === "enviada_talento").length;

  return (
    <Pantalla titulo="Hola">
      <AvisoBienestar />
      {nuevas > 0 ? (
        <section aria-labelledby="siguiente" className="flex flex-col gap-4 rounded-lg bg-surface p-5">
          <p className="text-base font-bold text-text-muted">Tu siguiente paso</p>
          <h2 id="siguiente" className="text-xl">
            {nuevas === 1 ? "Tienes una oportunidad nueva" : `Tienes ${nuevas} oportunidades nuevas`}
          </h2>
          <p>Una organización busca a alguien con una experiencia como la tuya. Tú decides si te interesa.</p>
          <Button asChild ancho="completo">
            <Link href="/oportunidades">Ver oportunidades</Link>
          </Button>
        </section>
      ) : (
        <section aria-labelledby="siguiente" className="flex flex-col gap-4 rounded-lg bg-surface p-5">
          <p className="text-base font-bold text-text-muted">Tu siguiente paso</p>
          <h2 id="siguiente" className="text-xl">
            Cuenta un reto que resolviste
          </h2>
          <p>Es lo que las empresas miran primero. Toma unos 10 minutos.</p>
          <Button asChild ancho="completo">
            <Link href="/huella">Contar mi historia</Link>
          </Button>
        </section>
      )}

      <section aria-labelledby="oportunidades" className="flex flex-col gap-3">
        <h2 id="oportunidades" className="text-xl">
          Oportunidades
        </h2>
        <Tarjeta>
          <Handshake aria-hidden className="size-8" />
          <p>Cuando una empresa necesite a alguien como tú, te lo contamos aquí y tú decides si te interesa.</p>
          <EnlaceFlecha href="/oportunidades">Ver oportunidades</EnlaceFlecha>
        </Tarjeta>
      </section>

      <section aria-labelledby="aprende" className="flex flex-col gap-3">
        <h2 id="aprende" className="text-xl">
          Aprende
        </h2>
        <Tarjeta>
          <BookOpen aria-hidden className="size-8" />
          <p>Cursos gratuitos para ponerte al día y para empezar tu propio negocio.</p>
          <EnlaceFlecha href="/aprende">Ver cursos</EnlaceFlecha>
        </Tarjeta>
      </section>
    </Pantalla>
  );
}

function EnlaceFlecha({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4"
    >
      {children}
      <ArrowRight aria-hidden className="size-5" />
    </Link>
  );
}
