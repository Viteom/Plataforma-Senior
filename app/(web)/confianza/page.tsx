import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Afiche } from "@/components/web/afiche";
import { Cierre } from "@/components/web/cierre";
import { Declaracion, ListaGrande } from "@/components/web/piezas";
import { Promesas } from "@/components/web/promesas";
import { RETRATOS } from "@/lib/web/contenido";

export const metadata: Metadata = {
  title: "Confianza",
  description: "Cómo cuidamos tus datos, cómo reconocer un fraude y por qué tu edad nunca se muestra.",
};

export default function PaginaConfianza() {
  return (
    <>
      <Afiche
        titulo="Nadie te va a pedir dinero"
        texto="Así cuidamos tus datos, cómo reconocer un fraude y por qué tu edad nunca se muestra a una organización."
        acciones={
          <Button asChild className="active:scale-[0.97]">
            <Link href="/ayuda">Avisar algo raro</Link>
          </Button>
        }
        retrato={RETRATOS.azul}
        forma="bg-deep"
        formatoRetrato="aspect-[3/2] h-[min(24rem,42svh)]"
        nota="Si ya entregaste dinero, llama también a la línea 123."
      />
      <Promesas enlace={false} />
      <ListaGrande
        id="fraude"
        titulo="Cómo reconocer un fraude"
        texto="Si pasa alguna de estas cosas, no pagues, no compartas el código y avísanos desde Ayuda."
        items={[
          {
            titulo: "Te piden dinero.",
            texto: "Para un examen, un curso, un uniforme o «asegurar el cupo». Ninguna oportunidad real cuesta.",
          },
          {
            titulo: "Te piden el código.",
            texto: "El código de 6 números es solo para ti. Nadie de Kánna te lo va a pedir.",
          },
          {
            titulo: "Te escriben de afán.",
            texto: "Un número desconocido que te apura a decidir hoy. Las organizaciones de Kánna te escriben desde la plataforma.",
          },
          {
            titulo: "Si ya entregaste algo.",
            texto: "Llama a la línea 123 de la Policía, avisa a tu banco y cuéntanos para acompañarte.",
          },
        ]}
      />
      <Declaracion id="datos" titulo="Tus datos son tuyos" retrato={RETRATOS.sombrero}>
        <p>
          Pedimos lo mínimo para conectarte. Tu fecha de nacimiento, tu celular y tu autorización solo los ve el equipo
          de Kánna, nunca una organización.
        </p>
        <p>
          Las referencias que nos das, con nombre y teléfono, se quedan con el equipo. Puedes pedirnos ver, corregir o
          borrar tus datos cuando quieras.
        </p>
        <p>
          <Link href="/privacidad" className="font-bold underline underline-offset-4">
            Leer la política de privacidad
          </Link>
        </p>
      </Declaracion>
      <Declaracion id="edad" titulo="Tu edad no está en la búsqueda" color="bg-primary text-on-primary" retrato={RETRATOS.rojo}>
        <p>
          Las organizaciones buscan por lo que sabes hacer y por los retos que resolviste. La edad, la foto, el año de
          grado y la pensión no deciden quién aparece primero.
        </p>
        <p>Un control automático lo revisa cada vez que cambiamos la plataforma.</p>
      </Declaracion>
      <Cierre
        titulo="¿Viste algo raro?"
        texto="Cuéntanos en el chat de Ayuda. Una persona del equipo lo revisa y, si quieres, te llama."
        accion={{ href: "/ayuda", texto: "Avisar al equipo" }}
        retrato={RETRATOS.cocina}
      />
    </>
  );
}
