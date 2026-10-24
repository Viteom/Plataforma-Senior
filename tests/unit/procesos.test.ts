import { describe, expect, it } from "vitest";

import { decidirEnvios, textoNovedad } from "@/lib/avisos/programar";
import { situacion, textoAcuerdo, type DatosProceso, type Lado } from "@/lib/procesos";
import { leerAcuerdo, leerAgenda, leerMotivo, mensajeProceso } from "@/lib/procesos-formularios";

// Procesos: cada lado ve en qué etapa va, a quién le toca y qué sigue, en palabras de Kánna.

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
};
const ahora = new Date("2026-10-29T15:00:00Z"); // 10 a. m. en Colombia

describe("a quién le toca", () => {
  const casos: [DatosProceso, Lado, string, string][] = [
    [{ estado: "enviada_talento" }, "talento", "invitacion", "tuyo"],
    [{ estado: "esperando" }, "empresa", "invitacion", "otro"],
    [{ estado: "visible_empresa" }, "talento", "interes", "otro"],
    [{ estado: "le_interesa", dias_esperando: 3 }, "empresa", "interes", "tuyo"],
    [{ estado: "abierta" }, "talento", "conversacion", "equipo"],
    [{ estado: "abierta" }, "empresa", "conversacion", "tuyo"],
    [{ estado: "conversacion", conversacion_en: ahora.toISOString(), conversacion_confirmada: false }, "talento", "conversacion", "tuyo"],
    [{ estado: "conversacion", conversacion_en: ahora.toISOString(), conversacion_confirmada: true }, "empresa", "conversacion", "tuyo"],
    [{ estado: "acuerdo" }, "talento", "acuerdo", "tuyo"],
    [{ estado: "acuerdo" }, "empresa", "acuerdo", "otro"],
    [{ estado: "en_curso" }, "empresa", "en_curso", "nadie"],
    [{ estado: "cerrada", cierre_tipo: "terminado", evaluacion_propia: null }, "talento", "terminado", "tuyo"],
    [{ estado: "cerrada", cierre_tipo: "terminado", evaluacion_propia: 5 }, "empresa", "terminado", "nadie"],
  ];
  it.each(casos)("%o visto por %s → etapa %s, turno %s", (p, lado, etapa, turno) => {
    expect(situacion(p, lado)).toMatchObject({ etapa, turno });
  });

  it("la organización ve cuántos días le quedan para responder", () => {
    expect(situacion({ estado: "le_interesa", dias_esperando: 9 }, "empresa").detalle).toMatch(/5 días/);
    expect(situacion({ estado: "le_interesa", dias_esperando: 13 }, "empresa").detalle).toMatch(/1 día para/);
  });

  it("nadie se queda esperando: sin respuesta se dice con cuidado a la persona", () => {
    const s = situacion({ estado: "sin_respuesta" }, "talento");
    expect(s).toMatchObject({ etapa: null, grupo: "cerrado", titulo: "La organización no respondió a tiempo" });
  });

  it("el motivo de no seguir solo lo ve la otra parte, y nunca dice «rechazado»", () => {
    const deEmpresa = { estado: "cerrada", cierre_tipo: "no_sigue", cerrada_por: "empresa", motivo_cierre: "Elegimos otro perfil" };
    expect(situacion(deEmpresa, "talento").detalle).toBe("Motivo: Elegimos otro perfil.");
    expect(situacion(deEmpresa, "empresa").titulo).toBe("Decidiste no seguir");
    expect(situacion({ estado: "cerrada", cierre_tipo: "no_sigue", cerrada_por: "talento" }, "empresa").titulo).toBe("La persona decidió no seguir");
    const todos = ["talento", "empresa"].flatMap((lado) =>
      ["enviada_talento", "visible_empresa", "abierta", "acuerdo", "en_curso", "cerrada", "descarta", "sin_respuesta", "pausada"].map((estado) => {
        const s = situacion({ estado, cierre_tipo: "no_sigue", cerrada_por: "empresa" }, lado as Lado);
        return `${s.titulo} ${s.detalle ?? ""}`;
      }),
    );
    expect(todos.join(" ")).not.toMatch(/rechaz|candidat|vacante|aplicar/i);
  });

  it("el acuerdo se lee en una línea", () => {
    const t = textoAcuerdo({ estado: "acuerdo", acuerdo_forma: "proyecto", acuerdo_horas_semana: 15, acuerdo_valor: 3000000, acuerdo_unidad: "proyecto", acuerdo_inicio: "2026-11-03" });
    expect(t).toMatch(/^Por proyecto, 15 horas a la semana · \$\s?3\.000\.000 por proyecto · desde el 3 de noviembre$/);
  });
});

describe("formularios del proceso", () => {
  it("la conversación pide día, hora y modo, y debe ser futura", () => {
    expect(leerAgenda(form({ dia: "2026-10-30", hora: "10:00", modo: "videollamada" }), ahora)).toEqual({
      datos: { fecha: "2026-10-30T15:00:00.000Z", modo: "videollamada" },
    });
    expect(leerAgenda(form({ dia: "2026-10-29", hora: "09:00", modo: "llamada" }), ahora)).toMatchObject({ error: expect.stringMatching(/pasado/) });
    expect(leerAgenda(form({ dia: "2026-10-30", hora: "10:00", modo: "chat" }), ahora)).toMatchObject({ error: expect.stringMatching(/llamada/) });
  });

  it("el acuerdo siempre lleva valor y no deja escribir teléfonos", () => {
    const base = { forma: "proyecto", valor: "$ 3.000.000", unidad: "proyecto" };
    expect(leerAcuerdo(form(base), ahora)).toMatchObject({ datos: { valor: 3000000, horas: null, inicio: null } });
    expect(leerAcuerdo(form({ ...base, valor: "" }), ahora)).toMatchObject({ error: expect.stringMatching(/se paga/) });
    expect(leerAcuerdo(form({ ...base, nota: "Llámame al 300 123 4567" }), ahora)).toMatchObject({ error: expect.stringMatching(/teléfonos/) });
    expect(leerAcuerdo(form({ ...base, inicio: "2026-10-01" }), ahora)).toMatchObject({ error: expect.stringMatching(/pasada/) });
    expect(leerAcuerdo(form({ ...base, horas: "80" }), ahora)).toMatchObject({ error: expect.stringMatching(/1 a 60/) });
  });

  it("si la organización cambió el acuerdo o la fecha mientras la persona miraba, se le pide revisar", () => {
    expect(mensajeProceso({ message: "el acuerdo cambió: revísalo de nuevo" })).toMatch(/cambió el acuerdo.*Recarga/);
    expect(mensajeProceso({ message: "la fecha cambió: revísala de nuevo" })).toMatch(/cambió la fecha.*Recarga/);
  });

  it("el motivo sale de la lista de cada lado", () => {
    expect(leerMotivo(form({ motivo: "Elegimos otro perfil" }), "empresa")).toEqual({ datos: "Elegimos otro perfil" });
    expect(leerMotivo(form({ motivo: "Elegimos otro perfil" }), "talento")).toHaveProperty("error");
  });
});

describe("avisos de novedades", () => {
  it("el SMS de novedades no dice la empresa, recuerda que nadie pide dinero y es GSM-7", () => {
    const t = textoNovedad("https://kanna.co/o");
    expect(t).toContain("Nadie te va a pedir dinero");
    expect(t.length).toBeLessThanOrEqual(160);
    expect(t).toMatch(/^[\x20-\x7E¡¿ñÑéèùìòÇüÜäöÄÖà]*$/);
  });

  it("si en el mismo día hay una oportunidad nueva y una novedad, va un solo SMS de oportunidad", () => {
    const enHorario = new Date("2026-10-21T15:00:00Z");
    const a = { id: "a", userId: "u1", creadoEn: enHorario, plantilla: "acuerdo_propuesto" };
    expect(decidirEnvios([a], enHorario, new Set(), "x").enviar[0].texto).toMatch(/novedades/);
    const d = decidirEnvios([a, { ...a, id: "b", plantilla: "oportunidad_nueva" }], enHorario, new Set(), "x");
    expect(d.enviar).toHaveLength(1);
    expect(d.enviar[0].texto).toMatch(/oportunidad nueva/);
  });
});
