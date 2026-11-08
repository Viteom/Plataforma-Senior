"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// En la demostración no hay cuenta: descarga un PDF de ejemplo para ver cómo queda el de verdad.
export function DescargarDemo() {
  const [preparando, setPreparando] = useState(false);
  async function descargar() {
    setPreparando(true);
    try {
      const { pdfDatos } = await import("@/lib/perfil/pdf-datos");
      const pdf = await pdfDatos({
        descargado_en: new Date().toISOString(),
        cuenta: { celular: "Ejemplo de demostración", correo: null },
        perfil: { nombre: "Gloria", ubicacion: "Pasto, Nariño", oficio: "Confección", visibilidad: "reservado" },
        formas_de_trabajar: [],
        historias: [],
        huella: [],
      });
      const url = URL.createObjectURL(new Blob([pdf as BlobPart], { type: "application/pdf" }));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "mis-datos-kanna-ejemplo.pdf";
      enlace.click();
      URL.revokeObjectURL(url);
    } finally {
      setPreparando(false);
    }
  }
  return (
    <Button variant="suave" size="normal" className="justify-start" onClick={descargar} disabled={preparando}>
      <Download aria-hidden />
      {preparando ? "Preparando…" : "Descargar mis datos (PDF)"}
    </Button>
  );
}
