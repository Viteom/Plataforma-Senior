import { Pause, Pencil, Play, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BotonSalir } from "@/components/layout/boton-salir";
import { Pantalla } from "@/components/layout/pantalla";
import { Button } from "@/components/ui/button";
import { nombreCapa, ORDEN_CAPAS } from "@/lib/capas";
import { listarOportunidades } from "@/lib/datos/consultas";
import { MODO_DEMO } from "@/lib/demo";
import type { GuiaTarifa } from "@/lib/formas";
import { crearClienteServidor } from "@/lib/supabase/server";

import { cambiarEstado, cambiarVisibilidad, quitarEtiqueta } from "./acciones";
import { MiPerfilDemo } from "./demo";
import {
  Seccion,
  SeccionDatos,
  SeccionEvidencias,
  SeccionFormas,
  SeccionFoto,
  SeccionMisDatos,
  Visibilidad,
} from "./secciones";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function MiPerfil() {
  if (MODO_DEMO) return <MiPerfilDemo />;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("talent_profiles")
    .select("id, nombre, ubicacion, oficio, resumen, visibilidad, estado, foto_path, zona_local")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil) redirect("/perfil/nuevo");

  const [{ data: ofertas }, { data: etiquetas }, { data: evidencias }, { data: guias }] = await Promise.all([
    supabase
      .from("talent_offers")
      .select("tipo, horas_semana, modalidad, tarifa_esperada, quiere_orientacion")
      .eq("talent_id", perfil.id),
    supabase
      .from("footprint_tags")
      .select("id, capa, etiqueta, taxonomy_id, aprobada_en")
      .eq("talent_id", perfil.id)
      .eq("confirmada", true)
      .order("etiqueta"),
    supabase
      .from("evidence")
      .select("id, tipo, descripcion, referencia_nombre, estado, autorizada_empresas")
      .eq("talent_id", perfil.id)
      .order("creado_en"),
    supabase.from("rate_guides").select("tipo, unidad, minimo, maximo"),
  ]);

  const reservado = perfil.visibilidad === "reservado";
  // Enlace firmado por 10 minutos: el bucket es privado y solo la persona y el equipo lo leen.
  const fotoUrl = perfil.foto_path
    ? ((await supabase.storage.from("fotos").createSignedUrl(perfil.foto_path, 600)).data?.signedUrl ?? null)
    : null;
  const buscaron = (await listarOportunidades()).filter(
    (o) => o.estado !== "enviada_talento" && o.estado !== "descarta",
  );

  return (
    <Pantalla titulo="Mi perfil">
      <Link
        href="/bienestar"
        className="inline-flex min-h-action items-center rounded-md bg-surface p-4 font-bold underline"
      >
        Mi ritmo, mis metas y mi bienestar
      </Link>
      <Link
        href="/mi-perfil/pagos"
        className="inline-flex min-h-action items-center rounded-md bg-surface p-4 font-bold underline"
      >
        Cómo recibir mis pagos
      </Link>
      <Seccion titulo="Quién ve mi perfil">
        <Visibilidad visibilidad={perfil.visibilidad} />
        <form action={cambiarVisibilidad}>
          <input type="hidden" name="visibilidad" value={reservado ? "visible" : "reservado"} />
          <Button type="submit" variant="secundario" size="normal">
            {reservado ? "Cambiar a visible" : "Cambiar a reservado"}
          </Button>
        </form>
        {perfil.estado === "borrador" ? (
          <p className="rounded-md bg-surface p-4">
            Las empresas todavía no ven tu perfil: falta confirmar tu huella de experiencia.{" "}
            <Link href="/huella" className="font-bold underline underline-offset-4">
              Contar mi historia
            </Link>
          </p>
        ) : (
          <form action={cambiarEstado} className="flex flex-col gap-2">
            <p>
              {perfil.estado === "pausado"
                ? "Tu perfil está en pausa: ninguna empresa lo ve."
                : "Tu perfil está disponible para las empresas."}
            </p>
            <input type="hidden" name="estado" value={perfil.estado === "pausado" ? "publicado" : "pausado"} />
            <Button type="submit" variant="suave" size="normal" className="self-start">
              {perfil.estado === "pausado" ? <Play aria-hidden /> : <Pause aria-hidden />}
              {perfil.estado === "pausado" ? "Volver a mostrar mi perfil" : "Pausar mi perfil"}
            </Button>
          </form>
        )}
      </Seccion>

      <SeccionFoto fotoUrl={fotoUrl} reservado={reservado} />

      <SeccionDatos
        datos={{
          nombre: perfil.nombre,
          ubicacion: perfil.ubicacion ?? "",
          oficio: perfil.oficio ?? "",
          resumen: perfil.resumen,
          zona_local: perfil.zona_local,
        }}
      />

      <Seccion titulo="Mi huella de experiencia">
        {etiquetas?.length ? (
          ORDEN_CAPAS.map((capa) => {
            const deCapa = (etiquetas ?? []).filter((e) => e.capa === capa);
            if (!deCapa.length) return null;
            return (
              <div key={capa} className="flex flex-col gap-2">
                <h3 className="text-lg">{nombreCapa[capa]}</h3>
                <ul className="flex flex-wrap gap-2">
                  {deCapa.map((e) => (
                    <li key={e.id}>
                      <form
                        action={quitarEtiqueta}
                        className="inline-flex min-h-tap items-center gap-1 rounded-sm border-2 border-text pl-3"
                      >
                        <span className="font-bold">{e.etiqueta}</span>
                        {!e.taxonomy_id && !e.aprobada_en && (
                          <span className="text-sm text-text-muted">(la revisa el equipo)</span>
                        )}
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          aria-label={`Quitar ${e.etiqueta}`}
                          className="flex size-tap items-center justify-center hover:bg-surface"
                        >
                          <X aria-hidden className="size-5" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        ) : (
          <p className="text-text-muted">Todavía no tienes etiquetas confirmadas.</p>
        )}
        <Link
          href="/huella"
          className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline underline-offset-4"
        >
          <Pencil aria-hidden className="size-5" />
          Contar otra historia
        </Link>
      </Seccion>

      <SeccionFormas ofertas={ofertas ?? []} guias={(guias ?? []) as GuiaTarifa[]} />

      <SeccionEvidencias evidencias={evidencias ?? []} />

      <Seccion titulo="Empresas que me buscaron">
        {buscaron.length ? (
          <ul className="flex flex-col gap-2">
            {buscaron.map((o) => (
              <li key={o.id} className="rounded-md bg-surface px-4 py-3 font-bold">
                {o.empresa}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted">Todavía ninguna. Aquí verás las empresas que quisieron conocerte.</p>
        )}
      </Seccion>

      <SeccionMisDatos />

      <BotonSalir />
    </Pantalla>
  );
}
