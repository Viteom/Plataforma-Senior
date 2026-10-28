import { ClipboardList, FileCheck2, Handshake, Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { TEXTO_TIPO } from "@/components/experiencias/textos";
import { Button } from "@/components/ui/button";
import { Afiche } from "@/components/web/afiche";
import { Cierre } from "@/components/web/cierre";
import { MARCO, retraso } from "@/components/web/marco";
import { Pasos } from "@/components/web/pasos";
import { DosPuertas } from "@/components/web/piezas";
import { Preguntas } from "@/components/web/preguntas";
import { listarExperiencias } from "@/lib/datos/experiencias";
import { MODO_DEMO } from "@/lib/demo";
import { pesos } from "@/lib/formas";

export const metadata: Metadata = {
  title: "Talento del campo",
  description:
    "Talleres para equipos y oficios por encargo con personas del territorio que no usan tecnología. Kánna los arma con ellas.",
};

const ENTRAR = MODO_DEMO ? "/empresa/campo" : "/entrar?para=empresa";

const FOTO_CAMPO = {
  src: "/web/campo-sandona.webp",
  ancho: 1440,
  alto: 960,
  alt: "Fotografía de una artesana de Sandoná, Nariño, tejiendo paja toquilla",
};

const TEJIDO_CAMPO = {
  src: "/web/campo-tejido.webp",
  ancho: 800,
  alto: 1600,
  alt: "Fotografía de una artesana tejiendo paja toquilla en su casa, en Sandoná, Nariño",
};

const DETALLE_CAMPO = {
  src: "/web/detalle-sandona.webp",
  ancho: 560,
  alto: 560,
  alt: "Fotografía de unas manos tejiendo paja toquilla",
};

export default async function PaginaCampo() {
  // Solo lo publicado: nada sale sin la aprobación de quien lo hace.
  const catalogo = (await listarExperiencias()).filter((e) => e.estado === "publicada");

  return (
    <>
      <Afiche
        titulo={
          <>
            Talento{" "}
            <span className="font-editorial font-normal tracking-normal text-primary italic">del campo</span>
          </>
        }
        texto="Talleres y oficios por encargo con personas del territorio que no usan tecnología. Kánna los arma con ellas, y nada se publica sin su aprobación."
        acciones={
          <Button asChild className="active:scale-[0.97]">
            <Link href={ENTRAR}>Pedir una cotización</Link>
          </Button>
        }
        retrato={FOTO_CAMPO}
        forma="bg-deep"
        formatoRetrato="aspect-[3/2] h-[min(24rem,42svh)]"
        nota="Cada ficha la aprueba quien hace el taller o el oficio."
      />
      <DosPuertas
        id="dos-formas"
        titulo="Dos formas de traer el campo a tu organización"
        puertas={[
          {
            titulo: TEXTO_TIPO.experiencia.plural,
            texto:
              "Una sabedora o un sabedor guía a tu equipo en una práctica de su territorio: el tejido, la cocina, la siembra. En tu sede o allá.",
            href: `${ENTRAR}${MODO_DEMO ? "?tipo=experiencia" : ""}`,
            accion: "Ver talleres",
            color: "bg-deep text-on-deep",
            imagen: DETALLE_CAMPO,
          },
          {
            titulo: TEXTO_TIPO.oficio.plural,
            texto:
              "Piezas hechas a mano para regalos o para vestir un espacio, restauraciones y trabajos en el territorio. Cada pieza lleva el nombre de quien la hizo.",
            href: `${ENTRAR}${MODO_DEMO ? "?tipo=oficio" : ""}`,
            accion: "Ver oficios",
            color: "bg-primary text-on-primary",
            imagen: TEJIDO_CAMPO,
          },
        ]}
      />

      <section aria-labelledby="catalogo" className="bg-bg py-24 lg:py-36">
        <div className={MARCO}>
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="catalogo" data-aparecer className="titular-marca text-afiche lg:col-span-7">
              Lo que puedes pedir hoy
            </h2>
            <p data-aparecer style={retraso(1)} className="max-w-[40ch] text-xl lg:col-span-4 lg:col-start-9 lg:self-end">
              El catálogo crece a medida que cada persona aprueba su ficha.
            </p>
          </div>
          {catalogo.length === 0 ? (
            <p className="mt-16 text-xl">Estamos armando las primeras fichas con las personas del territorio. Escríbenos y te contamos.</p>
          ) : (
            <ul className="mt-16 flex flex-col gap-2">
              {catalogo.map((e, i) => {
                const t = TEXTO_TIPO[e.tipo];
                const datos = [
                  e.sabedora_pueblo && `${t.quien}: ${[e.sabedora_nombre, e.sabedora_pueblo].filter(Boolean).join(", ")}`,
                  e.duracion && `${t.duracion}: ${e.duracion}`,
                  e.grupo_min && e.grupo_max && `${t.grupo}: de ${e.grupo_min} a ${e.grupo_max} ${t.unidad}`,
                  e.precio_desde && `Desde ${pesos(e.precio_desde)}`,
                ].filter(Boolean) as string[];
                return (
                  <li
                    key={e.id}
                    data-aparecer
                    style={retraso(i)}
                    className="grid gap-6 rounded-lg bg-surface p-6 sm:p-10 lg:grid-cols-12"
                  >
                    <div className="flex flex-col gap-3 lg:col-span-5">
                      <p className="text-lg font-bold text-deep">{t.nombre}</p>
                      <h3 className="titular-marca text-titular">{e.nombre}</h3>
                    </div>
                    <div className="flex flex-col gap-5 lg:col-span-6 lg:col-start-7">
                      <p className="text-xl">{e.proposito}</p>
                      {datos.length > 0 && (
                        <ul className="flex flex-col gap-1 text-lg">
                          {datos.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      )}
                      <Link
                        href={MODO_DEMO ? `/empresa/campo/${e.slug}` : ENTRAR}
                        className="inline-flex min-h-tap w-fit items-center text-lg font-bold underline underline-offset-4"
                      >
                        Pedir una cotización
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <Pasos
        id="cotizar"
        titulo="Cómo se pide"
        texto="Del pedido al reporte final, Kánna acompaña cada paso."
        pasos={[
          { titulo: "Pides una cotización", texto: "Eliges el taller u oficio, cuántas personas o piezas y en qué mes." },
          { titulo: "Te enviamos el valor", texto: "El equipo de Kánna habla con quien lo hace y te manda la cotización." },
          { titulo: "Confirmas", texto: "Acordamos la fecha, el lugar o la entrega. Kánna acompaña todo el proceso." },
          {
            titulo: "Recibes el reporte",
            texto: "Cuántas personas participaron, cuántas horas y cuánto recibió quien lo hizo.",
          },
        ]}
        iconos={[ClipboardList, Send, Handshake, FileCheck2]}
      />
      <Preguntas
        preguntas={[
          {
            pregunta: "¿Quién hace los talleres y los oficios?",
            respuesta:
              "Personas del territorio con un saber propio: tejedoras, sabedoras, carpinteros. Kánna las acompaña porque muchas no usan tecnología.",
          },
          {
            pregunta: "¿Se publica algo sin su permiso?",
            respuesta: "No. Cada taller u oficio se publica solo cuando quien lo hace aprueba su ficha.",
          },
          {
            pregunta: "¿Cómo sé qué recibe quien lo hace?",
            respuesta: "En la cotización te contamos qué parte del pago le llega, y el reporte final lo confirma.",
          },
          {
            pregunta: "¿Pueden venir a nuestra sede?",
            respuesta:
              "Muchos talleres se pueden hacer en tu sede o en el territorio. La ficha de cada uno dice qué formatos tiene.",
          },
        ]}
      />
      <Cierre
        titulo="Lleva el campo a tu equipo"
        texto="Cuéntanos qué buscas y te ayudamos a elegir entre talleres y oficios."
        accion={{ href: ENTRAR, texto: "Pedir una cotización" }}
        retrato={TEJIDO_CAMPO}
      />
    </>
  );
}
