"use client";

import { Camera, ImageUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

// Foto de perfil: tomarla ya con la cámara (celular o computador) o elegir una guardada.
// La cámara usa getUserMedia: en el computador abre la cámara web, en el celular la frontal.
// Si el navegador no la deja usar, cae al selector del sistema con `capture`, que en el celular
// abre la cámara directamente. La foto termina en el mismo <input name="foto"> del formulario.
export function CampoFoto({ name = "foto", id = "foto" }: { name?: string; id?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const respaldo = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [flujo, setFlujo] = useState<MediaStream | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apagar = () => {
    flujo?.getTracks().forEach((t) => t.stop());
    setFlujo(null);
  };
  useEffect(() => () => flujo?.getTracks().forEach((t) => t.stop()), [flujo]);
  useEffect(() => () => {
    if (vista) URL.revokeObjectURL(vista);
  }, [vista]);
  useEffect(() => {
    if (flujo && video.current) video.current.srcObject = flujo;
  }, [flujo]);

  const usar = (archivo: File) => {
    const dt = new DataTransfer();
    dt.items.add(archivo);
    if (input.current) input.current.files = dt.files;
    setVista(URL.createObjectURL(archivo));
    setError(null);
  };

  const abrirCamara = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      respaldo.current?.click();
      return;
    }
    try {
      setFlujo(await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }));
    } catch {
      setError("No pudimos abrir la cámara. Revisa que le diste permiso al navegador, o elige una foto guardada.");
    }
  };

  const tomar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const lienzo = document.createElement("canvas");
    lienzo.width = v.videoWidth;
    lienzo.height = v.videoHeight;
    lienzo.getContext("2d")?.drawImage(v, 0, 0);
    lienzo.toBlob(
      (blob) => {
        if (!blob) return;
        usar(new File([blob], "foto.jpg", { type: "image/jpeg" }));
        apagar();
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <input ref={input} id={id} name={name} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) setVista(URL.createObjectURL(f));
      }} />
      <input
        ref={respaldo}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) usar(f);
        }}
      />

      {flujo ? (
        <div className="flex flex-col gap-3">
          <video ref={video} autoPlay playsInline muted className="aspect-square w-full max-w-sm rounded-lg bg-surface-strong object-cover" />
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={tomar}>
              <Camera aria-hidden />
              Tomar la foto
            </Button>
            <Button type="button" variant="enlace" size="normal" onClick={apagar}>
              <X aria-hidden />
              Cerrar la cámara
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secundario" size="normal" onClick={abrirCamara}>
            <Camera aria-hidden />
            Tomar una foto ahora
          </Button>
          <Button type="button" variant="secundario" size="normal" onClick={() => input.current?.click()}>
            <ImageUp aria-hidden />
            Elegir una foto guardada
          </Button>
        </div>
      )}

      {vista && !flujo && (
        // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por el optimizador
        <img src={vista} alt="Vista previa de tu foto" className="size-40 rounded-full object-cover" />
      )}
      {error && (
        <p role="alert" className="font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
