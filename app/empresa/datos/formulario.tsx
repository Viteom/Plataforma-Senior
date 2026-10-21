"use client";

import { Button } from "@/components/ui/button";
import { Campo, Input } from "@/components/ui/campo";
import { useAccion } from "@/components/ui/use-accion";

import { registrarEmpresa, type Estado } from "../acciones";

const TAMANOS = ["1 a 10 personas", "11 a 50 personas", "51 a 200 personas", "Más de 200 personas"];

export function FormularioEmpresa() {
  const { estado, enviar: guardar, pendiente: guardando, alEnviar } = useAccion<Estado>(registrarEmpresa, {});

  return (
    <form action={guardar} onSubmit={alEnviar} className="flex flex-col gap-6">
      <Campo id="nombre" etiqueta="Nombre de la empresa">
        {(p) => <Input {...p} name="nombre" autoComplete="organization" />}
      </Campo>
      <Campo id="nit" etiqueta="NIT" ayuda="Sin el dígito de verificación.">
        {(p) => <Input {...p} name="nit" inputMode="numeric" className={`${p.className} max-w-64`} />}
      </Campo>
      <Campo id="sector" etiqueta="Sector" ayuda="Por ejemplo: alimentos, salud, servicios.">
        {(p) => <Input {...p} name="sector" />}
      </Campo>
      <Campo id="tamano" etiqueta="Tamaño">
        {(p) => (
          <select {...p} name="tamano" className={`${p.className} min-h-action`}>
            {TAMANOS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
      </Campo>
      <Campo id="ciudad" etiqueta="Ciudad">
        {(p) => <Input {...p} name="ciudad" autoComplete="address-level2" />}
      </Campo>
      <Campo id="contacto" etiqueta="Persona de contacto">
        {(p) => <Input {...p} name="contacto" autoComplete="name" />}
      </Campo>
      {estado.error && (
        <p role="alert" className="font-bold text-danger">
          {estado.error}
        </p>
      )}
      {estado.aviso && (
        <p role="status" className="font-bold text-success">
          {estado.aviso}
        </p>
      )}
      <Button type="submit" disabled={guardando} className="self-start">
        {guardando ? "Guardando…" : "Registrar empresa"}
      </Button>
    </form>
  );
}
