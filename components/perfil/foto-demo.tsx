"use client";
import { useEffect, useState } from "react";
import { Campo, Input } from "@/components/ui/campo";
export function FotoDemo() {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl">Mi foto</h2>
      <p>
        Tu foto se muestra tal como la subes, sin filtros. En esta demostración
        solo verás una vista previa; no se guarda.
      </p>
      <Campo
        id="foto-demo"
        etiqueta="Subir mi foto (JPG, PNG o WebP, hasta 5 MB)"
      >
        {(p) => (
          <Input
            {...p}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (
                !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
                f.size > 5 * 1024 * 1024
              ) {
                setError("Elige una imagen JPG, PNG o WebP de hasta 5 MB.");
                return;
              }
              setError("");
              setUrl(URL.createObjectURL(f));
            }}
          />
        )}
      </Campo>
      {error && <p role="alert">{error}</p>}
      {url && (
        // La vista previa es un objeto local y nunca se sube en la demostración.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Vista previa de tu foto"
          className="size-36 rounded-md object-cover"
        />
      )}
    </section>
  );
}
