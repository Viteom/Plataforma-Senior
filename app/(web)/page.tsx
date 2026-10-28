import { Briefcase, KeyRound, MessagesSquare, Mic } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Afiche } from "@/components/web/afiche";
import { BandaOficios } from "@/components/web/banda";
import { Cierre } from "@/components/web/cierre";
import { Enunciado } from "@/components/web/enunciado";
import { GaleriaOficios } from "@/components/web/galeria";
import { HuellaViva } from "@/components/web/huella-viva";
import { Mosaico } from "@/components/web/mosaico";
import { Pasos } from "@/components/web/pasos";
import { Preguntas } from "@/components/web/preguntas";
import { Promesas } from "@/components/web/promesas";
import { PASOS_TALENTO, PREGUNTAS_TALENTO, RETRATOS } from "@/lib/web/contenido";

// Portada. El mensaje principal es provisional (sale del brandbook): el concepto se explora después.
export default function Portada() {
  return (
    <>
      <Afiche
        titulo={
          <>
            <span className="block">Tu experiencia</span>
            <span className="block font-editorial font-normal tracking-normal text-primary italic">abre posibilidades</span>
          </>
        }
        texto="Kánna conecta a personas con trayectoria con organizaciones que buscan talento para sus retos. Oficios y profesiones, al mismo nivel."
        acciones={
          <>
            <Button asChild className="active:scale-[0.97]">
              <Link href="/entrar">Crear mi perfil</Link>
            </Button>
            <Button asChild variant="secundario" className="active:scale-[0.97]">
              <Link href="/organizaciones">Busco talento</Link>
            </Button>
          </>
        }
        retrato={RETRATOS.libro}
        nota="Para el talento es gratis. Nadie te va a pedir dinero."
      />
      <Enunciado />
      <HuellaViva />
      <Pasos
        id="como-funciona"
        titulo="Así funciona"
        texto="Cuatro pasos, a tu ritmo. Puedes hacerlos solo, con alguien de tu familia o con nuestro equipo por teléfono."
        pasos={PASOS_TALENTO}
        iconos={[KeyRound, Mic, Briefcase, MessagesSquare]}
      />
      <GaleriaOficios />
      <BandaOficios />
      <Mosaico
        id="campo"
        imagen="/web/campo-sandona.webp"
        imagenCelular="/web/campo-tejido.webp"
        descripcion="Fotografía de una artesana de Sandoná, Nariño, tejiendo paja toquilla."
        celdas={[
          { tipo: "titulo", texto: "Talento del campo", color: "bg-text text-bg" },
          { tipo: "dato", texto: "Talleres para equipos con sabedoras y sabedores", corto: "Talleres para equipos", color: "bg-bg text-text" },
          { tipo: "dato", texto: "Oficios por encargo: tejidos, muebles, restauración", corto: "Oficios por encargo", color: "bg-bg text-text" },
          { tipo: "dato", texto: "Kánna los arma con personas que no usan tecnología", corto: "Hecho con Kánna", color: "bg-bg text-text" },
          { tipo: "accion", texto: "Conocer Talento del campo", corto: "Conocerlo", href: "/campo", color: "bg-primary text-on-primary" },
        ]}
        posiciones={[0, 8, 13, 18, 5]}
        posicionesCelular={[0, 5, 9, 13, 15]}
      />
      <Promesas />
      <Preguntas preguntas={PREGUNTAS_TALENTO} />
      <Cierre
        titulo="Cuéntanos qué sabes hacer"
        texto="Tu trayectoria es solo el comienzo. No necesitas resumir toda tu vida en tu último cargo."
        accion={{ href: "/entrar", texto: "Crear mi perfil" }}
        secundaria={{ href: "/organizaciones", texto: "¿Buscas talento? Explora perfiles" }}
        retrato={RETRATOS.azul}
      />
    </>
  );
}
