import type { Metadata } from "next";

import { AvisoEmpresa } from "@/components/empresa/estado";
import { Pantalla } from "@/components/layout/pantalla";
import { obtenerMiEmpresa } from "@/lib/datos/consultas";
import { MODO_DEMO, taxonomiaEjemplo } from "@/lib/demo";
import type { EntradaTaxonomia } from "@/lib/ia/huella";
import { crearClienteServidor } from "@/lib/supabase/server";

import { FormularioProblema } from "./formulario";

export const metadata: Metadata = { title: "Buscar por un problema" };

export default async function ProblemaNuevo() {
  const empresa = await obtenerMiEmpresa();
  let taxonomia: EntradaTaxonomia[] = taxonomiaEjemplo;
  if (!MODO_DEMO) {
    const supabase = await crearClienteServidor();
    const { data } = await supabase.from("taxonomy").select("id, capa, etiqueta, sinonimos").order("etiqueta");
    taxonomia = (data ?? []) as EntradaTaxonomia[];
  }

  return (
    <div className="max-w-3xl">
      <Pantalla
        titulo="Buscar por un problema"
        intro="Cuéntanos qué necesitas resolver y qué debe saber la persona. Nuestro equipo revisa y te propone hasta 5 perfiles; solo verás los que digan que les interesa."
      >
        <AvisoEmpresa empresa={empresa} />
        <FormularioProblema taxonomia={taxonomia} />
      </Pantalla>
    </div>
  );
}
