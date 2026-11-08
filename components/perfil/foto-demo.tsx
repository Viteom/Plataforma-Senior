"use client";

import { CampoFoto } from "./campo-foto";

// En la demostración la foto solo se ve en vista previa: no hay formulario que la envíe.
export function FotoDemo() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl">Mi foto</h2>
      <p>
        Tu foto se muestra tal como la tomas o la subes, sin filtros. En esta demostración solo verás una vista previa;
        no se guarda.
      </p>
      <CampoFoto id="foto-demo" name="foto-demo" />
    </section>
  );
}
