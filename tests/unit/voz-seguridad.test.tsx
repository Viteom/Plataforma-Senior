// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { textoDe, useVoz } from "@/lib/voz";

afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });

describe("lectura voluntaria y privada", () => {
  it("S05: omite contenido oculto, detalles cerrados y valores de formularios", () => {
    document.body.innerHTML = `<main id="contenido"><h1>Tu perfil</h1>
      <p hidden>CELULAR OCULTO</p><p style="display:none">DATO CSS</p>
      <details><summary>Ver más</summary>HISTORIA CERRADA</details>
      <textarea>DATOS DEL FORMULARIO</textarea><select><option>OPCIÓN NO VISIBLE</option></select>
      <p data-no-leer>NO LEER</p><p aria-hidden="true">ICONO</p><p>Información visible</p></main>`;
    const texto=textoDe(document.getElementById("contenido"));
    expect(texto).toContain("Información visible");
    expect(texto).toContain("Ver más");
    expect(texto).not.toMatch(/OCULTO|DATO CSS|CERRADA|FORMULARIO|OPCIÓN|NO LEER|ICONO/);
  });

  it("S05: tampoco lee una zona completa marcada como privada", () => {
    document.body.innerHTML='<main data-no-leer>Dato privado</main>';
    expect(textoDe(document.querySelector("main"))).toBe("");
  });

  it("S06: elige una voz local y nunca envía la pantalla a la primera voz remota disponible", async () => {
    const remota={lang:"es-CO",localService:false,name:"Remota"};
    const local={lang:"es-CO",localService:true,name:"Local"};
    const speak=vi.fn();
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel:vi.fn(),speak,getVoices:()=>[remota,local],addEventListener:vi.fn(),removeEventListener:vi.fn()}});
    vi.stubGlobal("SpeechSynthesisUtterance",class { constructor(public text:string) {} });
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT",true);
    function Prueba() { const voz=useVoz(); return createElement("button",{disabled:!voz.disponible,onClick:()=>voz.alternar("pantalla","Mi información personal")},"Escuchar"); }
    const raiz=document.createElement("div"); document.body.append(raiz); const root=createRoot(raiz);
    try {
      await act(async()=>root.render(createElement(Prueba)));
      await act(async()=>raiz.querySelector("button")!.click());
      expect(speak).toHaveBeenCalledOnce();
      expect(speak.mock.calls[0][0].voice).toBe(local);
    } finally { await act(async()=>root.unmount()); }
  });
});
