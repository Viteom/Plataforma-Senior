"use client";
import { useState } from "react";
import { leerHojaVida } from "@/app/(registro)/perfil/nuevo/importar";
import { Campo, Input, Textarea } from "@/components/ui/campo";
import { Button } from "@/components/ui/button";
export function ImportarHojaVida({
  onConfirmar,
}: {
  onConfirmar: (d: { nombre: string; oficio: string; historia: string }) => void;
}) {
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("");
  const [oficio, setOficio] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [demo, setDemo] = useState(false);
  async function leer(f: File) {
    setOcupado(true);
    setError("");
    try {
      const d = new FormData();
      d.set("hoja_vida", f);
      const r = await leerHojaVida(d);
      if (r.error) setError(r.error);
      else if (r.texto) {
        setDemo(Boolean(r.demo));
        setTexto(r.texto);
        const lineas = r.texto
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean);
        const candidata = lineas.find(
          (l) =>
            /^([A-ZÁÉÍÓÚÑ][\p{L}'-]+\s+){1,4}[A-ZÁÉÍÓÚÑ][\p{L}'-]+$/u.test(l) &&
            !/(curriculum|hoja de vida|perfil profesional)/i.test(l),
        );
        setNombre(candidata ?? "");
        const cargo = r.texto.match(/(?:profesi[oó]n|oficio|cargo actual)\s*:\s*([^\n]{2,120})/i);
        setOficio(cargo?.[1] ?? "");
      }
    } catch {
      setError("No pudimos leer el documento. Puedes continuar escribiendo.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <details className="rounded-md border-2 border-border-subtle p-4">
      <summary className="min-h-tap cursor-pointer font-bold">Crear mi perfil desde PDF o Word</summary>
      <div className="mt-4 flex flex-col gap-4">
        <p>
          Extraemos el texto aquí, sin enviarlo a una IA. Tú lo corriges antes de usarlo. No publicamos ni conservamos
          el archivo original.
        </p>
        <Campo id="archivo-cv" etiqueta="Tu hoja de vida (PDF o Word, hasta 5 MB)">
          {(p) => (
            <Input
              {...p}
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={ocupado}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void leer(f);
              }}
            />
          )}
        </Campo>
        {ocupado && <p role="status">Leyendo tu documento…</p>}
        {error && <p role="alert">{error}</p>}
        {demo && texto && (
          <p role="status" className="rounded-md bg-surface p-4">
            Esto es una demostración: no leímos tu archivo. Te mostramos una hoja de vida de ejemplo.
          </p>
        )}
        {texto && (
          <>
            <Campo id="cv-nombre" etiqueta="Tu nombre (revísalo)">
              {(p) => <Input {...p} value={nombre} maxLength={80} onChange={(e) => setNombre(e.target.value)} />}
            </Campo>
            <Campo id="cv-oficio" etiqueta="Tu oficio o profesión (revísalo)">
              {(p) => <Input {...p} value={oficio} maxLength={120} onChange={(e) => setOficio(e.target.value)} />}
            </Campo>
            <Campo
              id="cv-experiencia"
              etiqueta="Experiencia que quieres usar"
              ayuda="Deja solo lo que sabes hacer. Quita datos de salud, documentos, referencias y datos de contacto. Máximo 6.000 letras."
            >
              {(p) => <Textarea {...p} rows={6} value={texto} onChange={(e) => setTexto(e.target.value)} />}
            </Campo>
            <Button
              type="button"
              onClick={() => {
                if (texto.trim().length < 40 || texto.length > 6000) {
                  setError("Deja entre 40 y 6.000 letras de experiencia antes de continuar.");
                  return;
                }
                onConfirmar({ nombre, oficio, historia: texto });
                setTexto("");
              }}
            >
              Usar estos datos en mi perfil
            </Button>
          </>
        )}
      </div>
    </details>
  );
}
