"use client";

import { useEffect } from "react";

// Safari de iPhone no aplica :active (la respuesta al presionar) si la página no escucha toques.
// Un oyente vacío y pasivo basta: no bloquea el scroll ni cambia nada más.
export function ToqueActivo() {
  useEffect(() => {
    const nada = () => {};
    document.addEventListener("touchstart", nada, { passive: true });
    return () => document.removeEventListener("touchstart", nada);
  }, []);
  return null;
}
