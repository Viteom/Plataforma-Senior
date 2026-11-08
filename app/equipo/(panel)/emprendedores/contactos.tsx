"use client";

import { Button } from "@/components/ui/button";
import { useAccion } from "@/components/ui/use-accion";

import { verContactosComunidad, type EstadoContactos } from "../acciones";

// Para compartir una feria u oportunidad: pide el motivo y trae solo los celulares de quienes
// aceptaron. Cada consulta queda registrada por persona.
export function Contactos({ categoria, etiqueta }: { categoria: string | null; etiqueta: string }) {
  const { estado, enviar, pendiente, alEnviar } = useAccion<EstadoContactos>(verContactosComunidad, {});

  return (
    <section aria-labelledby="compartir" className="flex flex-col gap-4 rounded-lg bg-surface p-5">
      <h2 id="compartir" className="text-xl">
        Compartir una feria u oportunidad
      </h2>
      <form action={enviar} onSubmit={alEnviar} className="flex flex-col gap-3">
        <input type="hidden" name="categoria" value={categoria ?? ""} />
        <label htmlFor="motivo" className="font-bold">
          ¿Qué les vas a compartir? ({etiqueta})
        </label>
        <textarea
          id="motivo"
          name="motivo"
          required
          minLength={10}
          maxLength={300}
          rows={2}
          placeholder="Por ejemplo: Feria artesanal de Pasto, 20 de noviembre"
          className="rounded-sm border-2 border-border bg-bg p-3 text-base focus-visible:border-text"
        />
        <p className="text-base text-text-muted">
          Solo salen los celulares de quienes aceptaron recibir oportunidades. Queda registrado quién los consultó y para qué.
        </p>
        {estado.error && (
          <p role="alert" className="font-bold text-danger">
            {estado.error}
          </p>
        )}
        <Button type="submit" size="normal" className="self-start" disabled={pendiente}>
          {pendiente ? "Buscando…" : "Ver contactos"}
        </Button>
      </form>
      {estado.contactos && (
        <div role="status" className="flex flex-col gap-2">
          {estado.aviso && <p className="text-text-muted">{estado.aviso}</p>}
          {estado.contactos.length ? (
            <ul className="flex flex-col gap-1">
              {estado.contactos.map((c) => (
                <li key={c.celular}>
                  {c.nombre} · +{c.celular}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nadie de este grupo aceptó recibir oportunidades todavía.</p>
          )}
        </div>
      )}
    </section>
  );
}
