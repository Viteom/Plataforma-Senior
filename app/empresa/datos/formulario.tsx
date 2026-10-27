"use client";

import { Button } from "@/components/ui/button";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { CampoUbicacion } from "@/components/ubicacion/campo-ubicacion";
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
      <CampoUbicacion name="ciudad" />
      <Campo id="contacto" etiqueta="Persona de contacto">
        {(p) => <Input {...p} name="contacto" autoComplete="name" />}
      </Campo>

      <Campo id="cargo-contacto" etiqueta="Cargo de la persona responsable">
        {(p) => <Input {...p} name="cargo_contacto" maxLength={100} required />}
      </Campo>
      <Campo id="correo-contacto" etiqueta="Correo de contacto">
        {(p) => <Input {...p} name="correo_contacto" type="email" maxLength={254} autoComplete="email" required />}
      </Campo>
      <Campo id="telefono-contacto" etiqueta="Teléfono de contacto">
        {(p) => <Input {...p} name="telefono_contacto" type="tel" maxLength={20} autoComplete="tel" required />}
      </Campo>
      <Campo
        id="descripcion-empresa"
        etiqueta="¿Qué hace tu organización?"
        ayuda="Cuéntanos su actividad y cómo acompañará a las personas que trabajen con ella."
      >
        {(p) => <Textarea {...p} name="descripcion" minLength={20} maxLength={1000} required />}
      </Campo>
      <Campo id="web-empresa" etiqueta="Sitio web (opcional)">
        {(p) => <Input {...p} name="sitio_web" type="url" placeholder="https://" maxLength={500} />}
      </Campo>
      <Campo
        id="marca-empresa"
        etiqueta="Enlace al manual de marca (opcional)"
        ayuda="Un enlace de consulta. No compartas contraseñas ni documentos internos."
      >
        {(p) => <Input {...p} name="brandbook_url" type="url" placeholder="https://" maxLength={500} />}
      </Campo>
      <label className="flex min-h-tap items-start gap-3">
        <input type="checkbox" name="compromiso_bienestar" value="si" required className="mt-1 size-6 shrink-0" />
        Me comprometo a ofrecer trabajo remunerado, trato digno, condiciones claras y acompañamiento. Kánna revisará
        cada reto antes de enviarlo.
      </label>
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
