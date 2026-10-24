import { BadgeCheck, MessagesSquare, PenLine, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Afiche } from "@/components/web/afiche";
import { Cierre } from "@/components/web/cierre";
import { Mosaico } from "@/components/web/mosaico";
import { Pasos } from "@/components/web/pasos";
import { Declaracion, DosPuertas, ListaGrande } from "@/components/web/piezas";
import { Preguntas } from "@/components/web/preguntas";
import { MODO_DEMO } from "@/lib/demo";
import { PASOS_ORGANIZACION, PREGUNTAS_ORGANIZACION, RETRATOS } from "@/lib/web/contenido";

export const metadata: Metadata = {
  title: "Para organizaciones",
  description: "Encuentra nuevas perspectivas para los retos de tu organización, con talento con trayectoria.",
};

const ENTRAR = MODO_DEMO ? "/empresa/explorar" : "/entrar?para=empresa";

export default function PaginaOrganizaciones() {
  return (
    <>
      <Afiche
        titulo={
          <>
            Otra mirada{" "}
            <span className="font-editorial font-normal tracking-normal text-primary italic">para tu reto</span>
          </>
        }
        texto="Conecta con personas que aportan conocimientos, capacidades y experiencias diversas. Verificamos tu organización y te acompañamos en cada conversación."
        acciones={
          <>
            <Button asChild className="active:scale-[0.97]">
              <Link href={ENTRAR}>Encontrar talento</Link>
            </Button>
            <Button asChild variant="secundario" className="active:scale-[0.97]">
              <Link href="/campo">Talento del campo</Link>
            </Button>
          </>
        }
        retrato={RETRATOS.rojo}
        formatoRetrato="aspect-square h-[min(32rem,56svh)]"
        nota="Solo las organizaciones verificadas pueden invitar a conversar."
      />
      <Declaracion id="perspectivas" titulo="Un reto, otras miradas">
        <p>
          Un reto no siempre necesita a alguien con la respuesta preparada. A veces necesita conocimientos
          complementarios, mejores preguntas y otra manera de mirar.
        </p>
        <p>
          En Kánna encuentras personas por lo que saben hacer y por los retos que ya han resuelto: la apertura de una
          planta, una crisis de caja, la formación de un equipo nuevo.
        </p>
      </Declaracion>
      <DosPuertas
        id="caminos"
        titulo="Dos caminos para empezar"
        puertas={[
          {
            titulo: "Explora perfiles",
            texto:
              "Busca por capacidades y por retos resueltos. Ves la experiencia; el nombre aparece cuando la persona acepta conversar.",
            href: ENTRAR,
            accion: "Explorar perfiles",
            color: "bg-primary text-on-primary",
            imagen: RETRATOS.sombrero,
          },
          {
            titulo: "Cuéntanos tu reto",
            texto:
              "Escribe qué está pasando y el equipo te propone hasta 5 personas que pueden aportar, cada una con el porqué.",
            href: ENTRAR,
            accion: "Contar un reto",
            color: "bg-deep text-on-deep",
            imagen: RETRATOS.azul,
          },
        ]}
      />
      <Pasos
        id="como-funciona"
        titulo="Así funciona"
        texto="De la verificación a la primera conversación. Una hora basta para saber si sigue un proyecto."
        pasos={PASOS_ORGANIZACION}
        iconos={[BadgeCheck, PenLine, Users, MessagesSquare]}
      />
      <ListaGrande
        id="reglas"
        titulo="Reglas que cuidan a las dos partes"
        color="bg-text text-bg"
        items={[
          { titulo: "Verificamos tu NIT.", texto: "Solo las organizaciones verificadas pueden invitar a conversar." },
          {
            titulo: "La edad no entra en la búsqueda.",
            texto: "Buscas por capacidades. Ni la edad ni la foto ordenan los perfiles.",
          },
          { titulo: "La persona decide.", texto: "Cada invitación se acepta o no. Su nombre aparece cuando acepta." },
          { titulo: "Nadie pide dinero.", texto: "Ninguna organización le cobra a una persona por una oportunidad." },
        ]}
      />
      <Mosaico
        id="campo"
        imagen="/web/campo-sandona.webp"
        imagenCelular="/web/campo-tejido.webp"
        descripcion="Grabado de una artesana de Sandoná, Nariño, tejiendo paja toquilla."
        celdas={[
          { tipo: "titulo", texto: "Talento del campo", color: "bg-text text-bg" },
          {
            tipo: "dato",
            texto: "Talleres para tu equipo, en tu sede o en el territorio",
            corto: "Talleres para equipos",
            color: "bg-bg text-text",
          },
          { tipo: "dato", texto: "Regalos y piezas por encargo, hechos a mano", corto: "Piezas por encargo", color: "bg-bg text-text" },
          { tipo: "dato", texto: "Un reporte de impacto al terminar", corto: "Reporte de impacto", color: "bg-bg text-text" },
          {
            tipo: "accion",
            texto: "Conocer Talento del campo",
            corto: "Conocerlo",
            href: "/campo",
            color: "bg-primary text-on-primary",
          },
        ]}
        posiciones={[0, 8, 13, 18, 5]}
        posicionesCelular={[0, 5, 9, 13, 15]}
      />
      <Preguntas preguntas={PREGUNTAS_ORGANIZACION} />
      <Cierre
        titulo="Cuéntanos tu reto"
        texto="Verificamos tu organización y empiezas a explorar perfiles."
        accion={{ href: ENTRAR, texto: "Encontrar talento" }}
        retrato={RETRATOS.libro}
      />
    </>
  );
}
