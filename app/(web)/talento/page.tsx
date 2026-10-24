import { Briefcase, KeyRound, MessagesSquare, Mic } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Afiche } from "@/components/web/afiche";
import { Cierre } from "@/components/web/cierre";
import { GaleriaOficios } from "@/components/web/galeria";
import { HuellaViva } from "@/components/web/huella-viva";
import { Pasos } from "@/components/web/pasos";
import { Declaracion, ListaGrande } from "@/components/web/piezas";
import { Preguntas } from "@/components/web/preguntas";
import { Promesas } from "@/components/web/promesas";
import { formasContratar } from "@/lib/formas";
import { PASOS_TALENTO, PREGUNTAS_TALENTO, RETRATOS } from "@/lib/web/contenido";

export const metadata: Metadata = {
  title: "Para talento",
  description:
    "Cuenta lo que sabes hacer y elige cómo quieres trabajar: por horas, por proyecto, como mentor o guiando un taller.",
};

export default function PaginaTalento() {
  return (
    <>
      <Afiche
        titulo={
          <>
            Lo que sabes{" "}
            <span className="font-editorial font-normal tracking-normal text-primary italic">importa</span>
          </>
        }
        texto="Cuenta lo que sabes hacer, qué has aprendido y en qué te gustaría participar. No necesitas resumir toda tu vida en tu último cargo."
        acciones={
          <>
            <Button asChild className="active:scale-[0.97]">
              <Link href="/entrar">Crear mi perfil</Link>
            </Button>
            <Button asChild variant="secundario" className="active:scale-[0.97]">
              <Link href="/ayuda">Prefiero que me llamen</Link>
            </Button>
          </>
        }
        retrato={RETRATOS.cocina}
        forma="bg-deep"
        nota="Para el talento es gratis. Nadie te va a pedir dinero."
      />
      <Pasos
        id="como-funciona"
        titulo="Así funciona"
        texto="Cuatro pasos, a tu ritmo. Puedes hacerlos solo, con alguien de tu familia o con nuestro equipo por teléfono."
        pasos={PASOS_TALENTO}
        iconos={[KeyRound, Mic, Briefcase, MessagesSquare]}
      />
      <ListaGrande
        id="formas"
        titulo="Tú eliges cómo trabajar"
        texto="Puedes ofrecer una o varias formas, y cambiarlas cuando quieras. Tú pones tu tarifa."
        items={formasContratar.map((f) => ({ titulo: f.etiqueta, texto: f.descripcion }))}
      />
      <HuellaViva />
      <div className="pt-24 lg:pt-36">
        <GaleriaOficios />
      </div>
      <Declaracion id="registro" titulo="Entra como te quede más fácil">
        <p>
          <strong>Desde tu celular.</strong> Escribes tu número o tu correo y te llega un código de 6 números. No hay
          contraseñas que recordar.
        </p>
        <p>
          <strong>Por teléfono.</strong> Si prefieres, una persona del equipo te llama y arma tu perfil contigo.
        </p>
        <p>
          <strong>Con alguien en tu territorio.</strong> En algunas regiones, un gestor de Kánna te visita y te
          registra. Después entras con tu celular y el perfil ya es tuyo.
        </p>
      </Declaracion>
      <ListaGrande
        id="aprende"
        titulo="Aprende y emprende"
        color="bg-surface text-text"
        acento="text-deep"
        items={[
          {
            titulo: "Aprende",
            texto: "Cursos gratuitos de entidades públicas y aliadas, elegidos para lo que quieres hacer ahora.",
          },
          {
            titulo: "Emprende",
            texto: "Si tienes o quieres un negocio propio, un diagnóstico corto te dice por dónde empezar.",
          },
        ]}
      />
      <Promesas />
      <Preguntas preguntas={PREGUNTAS_TALENTO} />
      <Cierre
        titulo="Tu trayectoria es el comienzo"
        texto="Cuéntanos qué sabes hacer y en qué te gustaría participar. Te toma unos minutos."
        accion={{ href: "/entrar", texto: "Crear mi perfil" }}
        secundaria={{ href: "/ayuda", texto: "Prefiero que me llamen" }}
        retrato={RETRATOS.sombrero}
      />
    </>
  );
}
