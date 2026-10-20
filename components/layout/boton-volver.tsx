"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Vuelve a la pantalla anterior; si se llegó directo (sin historial), va a la portada.
export function BotonVolver() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="-ml-1 inline-flex min-h-tap items-center gap-2 px-1 text-base font-bold underline-offset-4 hover:underline"
    >
      <ArrowLeft aria-hidden className="size-6" />
      Volver
    </button>
  );
}
