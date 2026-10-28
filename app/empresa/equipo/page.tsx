import { Clock, Eye, Mail, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Pantalla } from "@/components/layout/pantalla";
import { BotonAccion } from "@/components/ui/boton-accion";
import { Campo, Input } from "@/components/ui/campo";
import { obtenerMiEmpresa } from "@/lib/datos/consultas";
import { equipoOrganizacion, nombreRol, ROLES_ORGANIZACION } from "@/lib/datos/organizacion";
import { MODO_DEMO } from "@/lib/demo";

import { cambiarRol, cancelarInvitacion, invitarPersona, quitarPersona } from "./acciones";

export const metadata: Metadata = { title: "Equipo de la organización" };

const iniciales = (texto: string) =>
  texto
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

const diasHasta = (iso: string) => Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

export default async function EquipoOrganizacion() {
  const empresa = await obtenerMiEmpresa();
  if (!empresa) redirect("/empresa/datos");
  const { miembros, invitaciones } = await equipoOrganizacion();
  const esAdmin = empresa.rol === "admin";

  return (
    <Pantalla
      titulo={`Equipo de ${empresa.nombre}`}
      intro="Las personas de tu organización que usan Kánna. Cada una entra con su propio correo: nadie comparte claves y la cuenta sigue aunque alguien se vaya."
    >
      <div className="grid items-start gap-6 lg:grid-cols-[7fr_5fr]">
        <section aria-labelledby="t-personas" className="flex flex-col rounded-lg border-2 border-border-subtle bg-raised p-5">
          <h2 id="t-personas" className="pb-2 text-xl">
            {miembros.length} {miembros.length === 1 ? "persona" : "personas"}
          </h2>
          <ul>
            {miembros.map((m) => {
              const nombre = m.nombre ?? m.correo ?? "Persona del equipo";
              return (
                <li key={m.user_id} className="flex flex-col gap-3 border-t border-border-subtle py-4 first:border-t-0">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-strong font-bold">
                      {iniciales(nombre)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-bold">
                        {nombre}
                        {m.soy_yo && " (tú)"}
                      </span>
                      {m.nombre && m.correo && <span className="text-base break-all text-text-muted">{m.correo}</span>}
                    </span>
                    <span
                      className={
                        m.rol === "admin"
                          ? "inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-on-primary"
                          : "rounded-full px-3 py-0.5 text-sm font-bold ring-2 ring-border ring-inset"
                      }
                    >
                      {m.rol === "admin" && <ShieldCheck aria-hidden className="size-4" />}
                      {nombreRol(m.rol)}
                    </span>
                  </div>
                  {esAdmin && !m.soy_yo && (
                    <details className="pl-15">
                      <summary className="min-h-tap cursor-pointer content-center text-base font-bold underline underline-offset-4">
                        Cambiar rol o quitar acceso
                      </summary>
                      <div className="flex flex-col gap-4 pt-3">
                        <BotonAccion
                          accion={cambiarRol}
                          campos={{ usuario: m.user_id }}
                          texto="Guardar rol"
                          variant="secundario"
                          size="normal"
                          repetible
                        >
                          <label className="flex flex-col gap-2 font-bold">
                            Rol
                            <select name="rol" defaultValue={m.rol} className="min-h-action rounded-sm border-2 border-border bg-bg px-3 font-normal">
                              {ROLES_ORGANIZACION.map((r) => (
                                <option key={r.valor} value={r.valor}>
                                  {r.nombre}
                                </option>
                              ))}
                            </select>
                          </label>
                        </BotonAccion>
                        <BotonAccion
                          accion={quitarPersona}
                          campos={{ usuario: m.user_id }}
                          texto={`Quitar el acceso de ${m.nombre ?? "esta persona"}`}
                          variant="secundario"
                          size="normal"
                        >
                          <p className="text-base text-text-muted">
                            Deja de ver los retos y procesos de la organización. Lo que hizo se conserva.
                          </p>
                        </BotonAccion>
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
            {esAdmin &&
              invitaciones.map((i) => (
                <li key={i.id} className="flex flex-col gap-3 border-t border-border-subtle py-4">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-strong">
                      <Mail className="size-5" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-bold break-all">{i.correo}</span>
                      <span className="text-base text-text-muted">
                        {nombreRol(i.rol)} · la invitación vence en {diasHasta(i.vence_en)}{" "}
                        {diasHasta(i.vence_en) === 1 ? "día" : "días"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-0.5 text-sm font-bold whitespace-nowrap text-on-accent">
                      <Clock aria-hidden className="size-4" />
                      Por entrar
                    </span>
                  </div>
                  <BotonAccion
                    accion={cancelarInvitacion}
                    campos={{ invitacion: i.id }}
                    texto="Cancelar invitación"
                    variant="enlace"
                    size="normal"
                    className="items-start pl-15"
                  />
                </li>
              ))}
          </ul>
        </section>

        {esAdmin ? (
          <section aria-labelledby="t-invitar" className="flex flex-col gap-4 rounded-lg border-2 border-border-subtle bg-raised p-5">
            <h2 id="t-invitar" className="text-xl">
              Invitar a alguien
            </h2>
            <BotonAccion accion={invitarPersona} campos={{}} texto="Invitar" ancho="completo" repetible>
              <Campo id="correo-invitado" etiqueta="Correo de la persona">
                {(p) => <Input {...p} name="correo" type="email" inputMode="email" autoComplete="off" required />}
              </Campo>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-lg font-bold">¿Qué puede hacer?</legend>
                {ROLES_ORGANIZACION.map((r) => (
                  <label
                    key={r.valor}
                    className="flex cursor-pointer gap-3 rounded-md border-2 border-border-subtle p-4 has-[:checked]:border-text has-[:checked]:bg-surface has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                  >
                    <input type="radio" name="rol" value={r.valor} defaultChecked={r.valor === "procesos"} className="mt-1 size-6 shrink-0 accent-primary" />
                    <span className="flex flex-col">
                      <span className="font-bold">{r.nombre}</span>
                      <span className="text-base text-text-muted">{r.descripcion}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <p className="text-base text-text-muted">
                Kánna todavía no envía el correo de invitación. Avísale a la persona que entre a Kánna con ese correo: al
                entrar queda en el equipo. La invitación vence en 7 días.
              </p>
            </BotonAccion>
          </section>
        ) : (
          <p className="rounded-md bg-surface p-5">
            Tu rol es <b>{nombreRol(empresa.rol)}</b>. Para invitar personas o cambiar roles, pídeselo a alguien con
            administración.
          </p>
        )}
      </div>

      <p className="flex gap-3 rounded-md bg-surface p-4">
        <Eye aria-hidden className="mt-1 size-5 shrink-0" />
        Todas las personas de tu equipo ven el talento con las mismas reglas: la huella y el oficio, sin nombre ni foto
        hasta que la persona acepte conocerlos. Siempre queda al menos una persona con administración.
      </p>
      {MODO_DEMO && <p className="text-base text-text-muted">Datos de ejemplo.</p>}
    </Pantalla>
  );
}
