import { ArrowLeft, BadgeCheck, EyeOff, FileText, MapPin, Phone, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EstadoConexion } from "@/components/empresa/estado";
import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Etiqueta } from "@/components/ui/etiqueta";
import { nombreCapaEmpresa, ORDEN_CAPAS } from "@/lib/capas";
import { obtenerMiEmpresa, obtenerPerfil } from "@/lib/datos/consultas";
import { MODO_DEMO } from "@/lib/demo";
import { etiquetaForma, modalidades, pesos } from "@/lib/formas";

import { pedirConexion, quieroConocer } from "../../acciones";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ICONO_EVIDENCIA = { referencia: Phone, archivo: FileText, evaluacion: Star };

export default async function FichaPerfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [datos, empresa] = await Promise.all([obtenerPerfil(id), obtenerMiEmpresa()]);
  if (!datos) notFound();
  const { perfil, evidencias, conexion } = datos;

  const titulo = perfil.identidad_visible && perfil.nombre ? perfil.nombre : (perfil.oficio ?? "Talento con trayectoria");
  const puedePedir = empresa?.verificada && empresa.estado === "activa";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <Pantalla
        titulo={titulo}
        antesDelTitulo={
          <Link
            href="/empresa/explorar"
            className="inline-flex min-h-tap items-center gap-2 self-start font-bold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden className="size-5" />
            Volver a perfiles
          </Link>
        }
        intro={
          perfil.ubicacion || perfil.oficio ? (
            <span className="flex flex-wrap items-center gap-2">
              {perfil.ubicacion && (
                <>
                  <MapPin aria-hidden className="size-5" />
                  {perfil.ubicacion}
                </>
              )}
              {perfil.identidad_visible && perfil.oficio && <span>· {perfil.oficio}</span>}
            </span>
          ) : undefined
        }
      >
        {!perfil.identidad_visible && (
          <div className="flex items-start gap-3 rounded-md bg-surface p-4">
            <EyeOff aria-hidden className="mt-0.5 size-6 shrink-0" />
            <p>
              <span className="font-bold">Perfil reservado.</span> Verá el nombre cuando esta persona acepte conocerle.
            </p>
          </div>
        )}
        {perfil.identidad_visible && perfil.foto_url && (
          // Enlace firmado de Storage que vence en minutos: no pasa por el optimizador de imágenes.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfil.foto_url} alt={`Foto de ${perfil.nombre ?? "esta persona"}`} className="size-36 rounded-full border-2 border-border-subtle object-cover" />
        )}
        {perfil.identidad_visible && perfil.resumen && <p className="max-w-prose text-lg">{perfil.resumen}</p>}

        <section aria-labelledby="huella" className="flex flex-col gap-6">
          <h2 id="huella" className="text-xl">
            Huella de experiencia
          </h2>
          {ORDEN_CAPAS.map((capa) => {
            const etiquetas = perfil.huella.filter((h) => h.capa === capa);
            if (!etiquetas.length) return null;
            return (
              <div key={capa} className="flex flex-col gap-2">
                <h3 className="text-lg">{nombreCapaEmpresa[capa]}</h3>
                <div className="flex flex-wrap gap-2">
                  {etiquetas.map((e) => (
                    <Etiqueta key={e.etiqueta} texto={e.etiqueta} confirmada />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section aria-labelledby="respaldos" className="flex flex-col gap-3">
          <h2 id="respaldos" className="text-xl">
            Respaldos verificados por nuestro equipo
          </h2>
          {evidencias.length ? (
            <ul className="flex flex-col gap-3">
              {evidencias.map((e) => {
                const Icono = ICONO_EVIDENCIA[e.tipo];
                return (
                  <li key={e.id} className="flex items-start gap-3 rounded-md border-2 border-border-subtle p-4">
                    <Icono aria-hidden className="mt-0.5 size-6 shrink-0" />
                    <div>
                      <p className="font-bold">{e.nota_equipo ?? e.descripcion}</p>
                      {e.tipo === "referencia" && <p className="text-base text-text-muted">Llamamos a una persona que conoce su trabajo.</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-text-muted">Todavía sin respaldos verificados.</p>
          )}
        </section>
        {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
      </Pantalla>

      <aside aria-labelledby="contratar" className="flex flex-col gap-5 self-start rounded-lg border-2 border-border-subtle p-5 lg:sticky lg:top-6">
        <h2 id="contratar" className="text-xl">
          Cómo contratar
        </h2>
        <ul className="flex flex-col gap-3">
          {perfil.ofertas.map((o) => (
            <li key={o.tipo}>
              <p className="font-bold">{etiquetaForma(o.tipo)}</p>
              {o.rango_min && o.rango_max ? (
                <p className="text-base text-text-muted">
                  Entre {pesos(o.rango_min)} y {pesos(o.rango_max)}
                </p>
              ) : (
                <p className="text-base text-text-muted">Tarifa a conversar</p>
              )}
            </li>
          ))}
        </ul>
        {perfil.ofertas[0] && (
          <p className="text-base">
            {perfil.ofertas[0].horas_semana ? `${perfil.ofertas[0].horas_semana} h/semana · ` : ""}
            {modalidades.find((m) => m.valor === perfil.ofertas[0].modalidad)?.etiqueta ?? ""}
          </p>
        )}

        {conexion ? (
          <div className="flex flex-col gap-3">
            <EstadoConexion estado={conexion.estado} />
            {conexion.estado === "le_interesa" && (
              <BotonAccion accion={quieroConocer} campos={{ conexion: conexion.id }} texto="Quiero conocer a esta persona" ancho="completo" />
            )}
          </div>
        ) : puedePedir ? (
          <>
            <BotonAccion
              accion={pedirConexion}
              campos={{ talento: perfil.id }}
              texto="Quiero conocer este perfil"
              textoEnviando="Enviando…"
              ancho="completo"
            />
            <p className="text-base text-text-muted">Le contamos a la persona. Si le interesa, les ponemos en contacto.</p>
          </>
        ) : (
          <p className="flex items-start gap-2 rounded-md bg-surface p-4 text-base">
            <BadgeCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
            {empresa
              ? "Podrá pedir conocer este perfil cuando su empresa esté verificada."
              : "Para pedir conocer este perfil, registre primero su empresa."}
          </p>
        )}
      </aside>
    </div>
  );
}
