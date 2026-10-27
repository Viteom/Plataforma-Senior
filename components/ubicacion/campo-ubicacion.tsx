"use client";

import { useId, useState } from "react";
import catalogo from "@/lib/ubicaciones/municipios.json";
import { Campo, Input } from "@/components/ui/campo";

// Catálogo de referencia: no obliga a que un territorio esté incluido para poder registrarse.
export function CampoUbicacion({
  name = "ubicacion",
  value,
  onChange,
  onSectorChange,
  inicial = "",
}: {
  onSectorChange?: (valor: string) => void;
  name?: string;
  value?: string;
  onChange?: (valor: string) => void;
  inicial?: string;
}) {
  const id = useId();
  const [departamento, setDepartamento] = useState("");
  const [interno, setInterno] = useState(inicial);
  const actualizar = (texto: string) => {
    setInterno(texto);
    onChange?.(texto);
  };
  const lugares =
    catalogo.find((d) => d.departamento === departamento)?.municipios ?? [];
  return (
    <div className="flex flex-col gap-3">
      <Campo id={`${id}-departamento`} etiqueta="Departamento (para buscar)">
        {(p) => (
          <select
            {...p}
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className={`${p.className} min-h-action`}
          >
            <option value="">Elige un departamento</option>
            {catalogo.map((d) => (
              <option key={d.departamento}>{d.departamento}</option>
            ))}
          </select>
        )}
      </Campo>
      <Campo
        id={`${id}-municipio`}
        etiqueta="Ciudad o municipio"
        ayuda="Busca o escribe el nombre si no aparece en la lista."
      >
        {(p) => (
          <Input
            {...p}
            name={name}
            list={`${id}-lista`}
            value={value ?? interno}
            maxLength={80}
            autoComplete="address-level2"
            onChange={(e) => actualizar(e.target.value)}
            required
          />
        )}
      </Campo>
      <datalist id={`${id}-lista`}>
        {lugares.map((m) => (
          <option key={m} value={`${m}, ${departamento}`} />
        ))}
      </datalist>
      <Campo
        id={`${id}-sector`}
        etiqueta="Barrio, corregimiento o vereda (opcional)"
        ayuda="Puedes escribirlo aunque no esté en ningún catálogo. No pongas la dirección exacta."
      >
        {(p) => (
          <Input
            {...p}
            onChange={(e) => onSectorChange?.(e.target.value)}
            name={`${name}_sector`}
            maxLength={100}
            autoComplete="off"
          />
        )}
      </Campo>
    </div>
  );
}
