import { it, expect } from "vitest";
import { resumenCarga } from "@/lib/bienestar/resumen";
import { experienciaHojaVida } from "@/lib/perfil/hoja-vida";
import { leerEmpresa } from "@/lib/empresa/validar";
it("suma varios acuerdos sin convertir una meta de ingresos en una obligación de trabajar más", () => {
  const r = resumenCarga(20, [
    { estado: "en_curso", acuerdo_horas_semana: 15 },
    { estado: "en_curso", acuerdo_horas_semana: 10 },
    { estado: "en_curso" },
    { estado: "cerrada", acuerdo_horas_semana: 40 },
  ]);
  expect(r.horas).toBe(25);
  expect(r.sinHoras).toBe(1);
  expect(r.porcentaje).toBe(100);
  expect(r.mensaje).toMatch(/superan/);
});
it("retira datos sensibles de la experiencia importada", () => {
  const r = experienciaHojaVida(
    "Ana Pérez\nFecha de nacimiento: 14/03/1964\nPensión: sí\nDiagnóstico: información clínica\nCorreo: ana@correo.com\nProducción de alimentos y formación de equipos.",
    "Ana Pérez",
  );
  expect(r).not.toMatch(/1964|Pensión|clínica|ana@correo|Ana Pérez/);
  expect(r).toContain("Producción");
});
it("no acepta registro empresarial sin responsable, contacto y compromiso", () => {
  expect(leerEmpresa(new FormData())).toHaveProperty("error");
  const d = new FormData();
  Object.entries({
    nombre: "Empresa SAS",
    nit: "900123456",
    sector: "Alimentos",
    ciudad: "Pasto",
    contacto: "Ana Pérez",
    correo_contacto: "ana@empresa.com",
    telefono_contacto: "3001234567",
    cargo_contacto: "Directora",
    descripcion: "Empresa de producción de alimentos",
    compromiso_bienestar: "si",
    sitio_web: "javascript:alert(1)",
  }).forEach(([k, v]) => d.set(k, v));
  expect(leerEmpresa(d)).toHaveProperty("error");
  d.set("sitio_web", "https://empresa.com");
  expect(leerEmpresa(d)).toHaveProperty("datos");
});

it("no presenta un acuerdo con inicio futuro como carga actual", () => {
  const r = resumenCarga(
    20,
    [
      {
        estado: "en_curso",
        acuerdo_horas_semana: 10,
        acuerdo_inicio: "2026-10-01",
      },
      {
        estado: "en_curso",
        acuerdo_horas_semana: 40,
        acuerdo_inicio: "2027-01-01",
      },
    ],
    "2026-10-24",
  );
  expect(r.horas).toBe(10);
  expect(r.futuros).toBe(1);
});
