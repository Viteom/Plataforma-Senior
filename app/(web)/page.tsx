import { Banner } from "@/components/web/home/banner";
import { Campo } from "@/components/web/home/campo";
import { ComoFunciona } from "@/components/web/home/como-funciona";
import { Confianza } from "@/components/web/home/confianza";
import { Empresas } from "@/components/web/home/empresas";
import { Importa } from "@/components/web/home/importa";
import { Oficios } from "@/components/web/home/oficios";
import { PreguntasHome } from "@/components/web/home/preguntas-home";
import { Puertas } from "@/components/web/home/puertas";

// Home (maqueta aprobada el 1 de noviembre de 2026): banner a pantalla completa con oficios y
// profesiones, cómo funciona para cada público, empresas, campo, confianza, preguntas y cierre.
export default function Portada() {
  return (
    <>
      <Banner />
      <Importa />
      <ComoFunciona />
      <Empresas />
      <Campo />
      <Oficios />
      <Confianza />
      <PreguntasHome />
      <Puertas />
    </>
  );
}
