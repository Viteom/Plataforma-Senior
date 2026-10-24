import { describe, expect, it } from "vitest";

import { fechaSms, momentos } from "@/lib/avisos/mensajes";
import { avanzarDemo, procesoInicial, vistaEmpresaDemo, vistaTalentoDemo, type ProcesoDemo } from "@/lib/demo-proceso";
import { componerReto, problemaRequisitoLibre, sugerirRequisitos } from "@/lib/reto";
import { taxonomiaDemo } from "@/lib/taxonomia-demo";

// La demostración que avanza, los mensajes al celular (diseño) y las ayudas para contar un reto.

const GSM7 = /^[\x20-\x7E¡¿ñÑéèùìòÇüÜäöÄÖà\n]*$/;

function paso(p: ProcesoDemo, lado: "talento" | "empresa", accion: string, datos: Record<string, unknown> = {}) {
  const r = avanzarDemo(p, lado, accion, datos);
  if ("error" in r) throw new Error(`${lado} ${accion}: ${r.error}`);
  return r;
}

describe("demostración que avanza", () => {
  it("recorre todo el proceso desde los dos lados y deja los avisos de cada paso", () => {
    // La demostración arranca con el «Me interesa» dado; aquí se prueba desde la invitación.
    expect(procesoInicial().estado).toBe("visible_empresa");
    let p: ProcesoDemo = { ...procesoInicial(), estado: "enviada_talento" };
    // Por reto: la organización no ve a la persona hasta que dice que le interesa.
    expect(vistaEmpresaDemo(p)).toBeNull();
    expect(vistaTalentoDemo(p).estado).toBe("enviada_talento");

    p = paso(p, "talento", "me_interesa");
    expect(vistaEmpresaDemo(p)?.estado).toBe("le_interesa");
    p = paso(p, "empresa", "quiero_conocer");
    p = paso(p, "empresa", "agendar", { fecha: "2026-11-06T15:00:00.000Z", modo: "videollamada" });
    expect(vistaTalentoDemo(p)).toMatchObject({ estado: "conversacion", conversacion_confirmada: false });
    p = paso(p, "talento", "confirmar_fecha");
    p = paso(p, "empresa", "proponer_acuerdo", { forma: "proyecto", horas: 15, valor: 3000000, unidad: "proyecto", inicio: null, nota: "Planta 2" });
    expect(vistaTalentoDemo(p)).toMatchObject({ estado: "acuerdo", acuerdo_valor: 3000000 });
    p = paso(p, "talento", "aceptar_acuerdo");
    p = paso(p, "empresa", "terminar", { evaluacion: 5 });
    p = paso(p, "talento", "calificar", { evaluacion: 4 });

    expect(p).toMatchObject({ estado: "cerrada", cierre_tipo: "terminado", evaluacion_empresa: 5, evaluacion_talento: 4 });
    expect(p.avisos.map((a) => a.momento)).toEqual(["oportunidad_nueva", "conexion_abierta", "conversacion_agendada", "acuerdo_propuesto", "calificar"]);
  });

  it("cada lado da solo sus pasos y en orden", () => {
    const p: ProcesoDemo = { ...procesoInicial(), estado: "enviada_talento" };
    expect(avanzarDemo(p, "empresa", "quiero_conocer")).toHaveProperty("error");
    expect(avanzarDemo(paso(p, "talento", "me_interesa"), "talento", "quiero_conocer")).toHaveProperty("error");
  });

  it("si la organización no sigue, la persona ve el motivo y recibe el aviso; si no sigue la persona, la organización no ve el motivo", () => {
    let p = procesoInicial();
    const cerrado = paso(p, "empresa", "no_seguir", { motivo: "Elegimos otro perfil" });
    expect(vistaTalentoDemo(cerrado).motivo_cierre).toBe("Elegimos otro perfil");
    expect(cerrado.avisos.at(-1)?.momento).toBe("proceso_cerrado");

    p = paso(paso(p, "empresa", "quiero_conocer"), "talento", "no_seguir", { motivo: "Ya no tengo tiempo" });
    expect(vistaEmpresaDemo(p)).toMatchObject({ estado: "cerrada", cerrada_por: "talento", motivo_cierre: null });
  });
});

describe("mensajes al celular (diseño)", () => {
  const lista = momentos({ enlace: "kanna.co/o", conversacion_en: "2026-11-06T15:00:00.000Z", conversacion_modo: "videollamada" });

  it.each(lista.map((m) => [m.id, m.sms]))("el SMS de «%s» cabe en 160 caracteres GSM-7 y no nombra a la organización", (_id, sms) => {
    expect(sms.length).toBeLessThanOrEqual(160);
    expect(sms).toMatch(GSM7);
    expect(sms.startsWith("Kanna:")).toBe(true);
    expect(sms).not.toMatch(/SAS|Ltda|Alimentos/);
  });

  it("cuando hay algo que hacer, el mensaje recuerda que nadie pide dinero", () => {
    for (const id of ["oportunidad_nueva", "conversacion_agendada", "acuerdo_propuesto"]) {
      const m = lista.find((x) => x.id === id)!;
      expect(m.sms).toContain("Nadie te va a pedir dinero");
      expect(m.whatsapp.texto).toContain("Nadie te va a pedir dinero");
    }
  });

  it("WhatsApp lleva máximo 3 botones", () => {
    for (const m of lista) expect(m.whatsapp.botones.length).toBeLessThanOrEqual(3);
  });

  it("la fecha del SMS es corta y sin tildes", () => {
    const f = fechaSms("2026-11-04T15:00:00.000Z"); // miércoles 4 de noviembre, 10 a. m. en Colombia
    expect(f).toMatch(GSM7);
    expect(f).toBe("mie 4 nov, 10:00 am");
  });
});

describe("contar un reto", () => {
  it("sugiere requisitos a partir del texto del reto", () => {
    const s = sugerirRequisitos("Vamos a abrir una segunda planta y necesitamos cumplir con INVIMA en 6 meses.", taxonomiaDemo).map((t) => t.etiqueta);
    expect(s[0]).toBe("INVIMA");
    expect(s).toEqual(expect.arrayContaining(["Apertura de una planta nueva", "Certificación sanitaria"]));
    expect(sugerirRequisitos("hola", taxonomiaDemo)).toEqual([]);
  });

  it("lo que escribe la organización no puede pedir edad", () => {
    expect(problemaRequisitoLibre("Manejo de cámaras de frío")).toBeNull();
    for (const t of ["Menor de 40", "Persona joven", "15 años de experiencia", "Nuevas generaciones"]) {
      expect(problemaRequisitoLibre(t)).not.toBeNull();
    }
  });

  it("lo intentado y el plazo quedan en el texto del reto", () => {
    expect(componerReto("Abrir la planta 2", "Contratamos un consultor", "meses")).toBe(
      "Abrir la planta 2\n\nLo que hemos intentado: Contratamos un consultor\n\nPara cuándo: En 1 a 3 meses.",
    );
    expect(componerReto("Abrir la planta 2", "", "")).toBe("Abrir la planta 2");
  });
});
