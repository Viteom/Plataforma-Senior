import type { ConexionEmpresa, Oportunidad } from "@/lib/datos/tipos";
import { conexionesEjemplo, oportunidadesEjemplo } from "@/lib/demo";
import type { Lado } from "@/lib/procesos";

// Demostración que avanza: un solo proceso (Alimentos del Oriente ↔ la persona de «Producción de
// alimentos») que se ve desde la organización y desde el talento. Cada paso sigue las mismas reglas
// que avanzar_proceso() en la base y deja los avisos que recibiría la persona. Lógica pura: el
// estado lo guarda una cookie (lib/demo-proceso-cookie.ts).

// Las dos caras del mismo proceso: el id que ve la organización y el que ve el talento.
export const ID_DEMO_EMPRESA = conexionesEjemplo[0].id;
export const ID_DEMO_TALENTO = oportunidadesEjemplo[0].id;
export const esProcesoDemo = (id: string) => id === ID_DEMO_EMPRESA || id === ID_DEMO_TALENTO;

export type AvisoDemo = { momento: string; en: string };

export type ProcesoDemo = {
  estado: string; // vocabulario de la base: enviada_talento, visible_empresa, abierta, conversacion…
  conversacion_en: string | null;
  conversacion_modo: "llamada" | "videollamada" | "presencial" | null;
  conversacion_confirmada: boolean;
  acuerdo_forma: string | null;
  acuerdo_horas_semana: number | null;
  acuerdo_valor: number | null;
  acuerdo_unidad: string | null;
  acuerdo_inicio: string | null;
  acuerdo_nota: string | null;
  acuerdo_aceptado_en: string | null;
  cierre_tipo: "terminado" | "no_sigue" | null;
  cerrada_por: Lado | null;
  motivo_cierre: string | null;
  evaluacion_empresa: number | null;
  evaluacion_talento: number | null;
  avisos: AvisoDemo[];
};

// Empieza con el «Me interesa» ya dado: la organización decide si quiere conocer a la persona.
export const procesoInicial = (ahora = new Date()): ProcesoDemo => ({
  estado: "visible_empresa",
  conversacion_en: null,
  conversacion_modo: null,
  conversacion_confirmada: false,
  acuerdo_forma: null,
  acuerdo_horas_semana: null,
  acuerdo_valor: null,
  acuerdo_unidad: null,
  acuerdo_inicio: null,
  acuerdo_nota: null,
  acuerdo_aceptado_en: null,
  cierre_tipo: null,
  cerrada_por: null,
  motivo_cierre: null,
  evaluacion_empresa: null,
  evaluacion_talento: null,
  avisos: [{ momento: "oportunidad_nueva", en: ahora.toISOString() }],
});

type Datos = Record<string, unknown>;

// Aplica un paso. Devuelve el proceso nuevo o el motivo por el que no se puede.
export function avanzarDemo(p: ProcesoDemo, lado: Lado, accion: string, datos: Datos = {}, ahora = new Date()): ProcesoDemo | { error: string } {
  const e = p.estado;
  const aviso = (momento: string) => [...p.avisos, { momento, en: ahora.toISOString() }].slice(-12);
  const noSePuede = { error: "Este paso no está disponible ahora. Recarga para ver cómo va." };

  if (lado === "talento") {
    if (accion === "me_interesa" && e === "enviada_talento") return { ...p, estado: "visible_empresa" };
    if (accion === "no_me_interesa" && e === "enviada_talento") return { ...p, estado: "descarta" };
    if (accion === "confirmar_fecha" && e === "conversacion") return { ...p, conversacion_confirmada: true };
    if (accion === "otra_fecha" && e === "conversacion") {
      return { ...p, estado: "abierta", conversacion_en: null, conversacion_modo: null, conversacion_confirmada: false };
    }
    if (accion === "aceptar_acuerdo" && e === "acuerdo") return { ...p, estado: "en_curso", acuerdo_aceptado_en: ahora.toISOString() };
    if (accion === "ajustar_acuerdo" && e === "acuerdo") return { ...p, estado: "conversacion" };
  } else {
    if (accion === "quiero_conocer" && e === "visible_empresa") return { ...p, estado: "abierta", avisos: aviso("conexion_abierta") };
    if (accion === "agendar" && (e === "abierta" || e === "conversacion")) {
      return {
        ...p,
        estado: "conversacion",
        conversacion_en: String(datos.fecha),
        conversacion_modo: datos.modo as ProcesoDemo["conversacion_modo"],
        conversacion_confirmada: false,
        avisos: aviso("conversacion_agendada"),
      };
    }
    if (accion === "proponer_acuerdo" && (e === "conversacion" || e === "acuerdo")) {
      return {
        ...p,
        estado: "acuerdo",
        acuerdo_forma: String(datos.forma),
        acuerdo_horas_semana: (datos.horas as number | null) ?? null,
        acuerdo_valor: Number(datos.valor),
        acuerdo_unidad: String(datos.unidad),
        acuerdo_inicio: (datos.inicio as string | null) ?? null,
        acuerdo_nota: (datos.nota as string | null) ?? null,
        acuerdo_aceptado_en: null,
        avisos: aviso("acuerdo_propuesto"),
      };
    }
  }

  if (accion === "terminar" && e === "en_curso") {
    const nota = Number(datos.evaluacion);
    return {
      ...p,
      estado: "cerrada",
      cierre_tipo: "terminado",
      cerrada_por: lado,
      ...(lado === "empresa" ? { evaluacion_empresa: nota } : { evaluacion_talento: nota }),
      // Si terminó la organización, a la persona le llega la invitación a calificar.
      avisos: lado === "empresa" ? aviso("calificar") : p.avisos,
    };
  }
  if (accion === "calificar" && e === "cerrada" && p.cierre_tipo === "terminado") {
    const nota = Number(datos.evaluacion);
    if (lado === "empresa" && p.evaluacion_empresa === null) return { ...p, evaluacion_empresa: nota };
    if (lado === "talento" && p.evaluacion_talento === null) return { ...p, evaluacion_talento: nota };
  }
  if (accion === "no_seguir") {
    const puede = lado === "talento" ? ["abierta", "conversacion", "acuerdo", "en_curso"] : ["visible_empresa", "abierta", "conversacion", "acuerdo", "en_curso"];
    if (puede.includes(e)) {
      return {
        ...p,
        estado: "cerrada",
        cierre_tipo: "no_sigue",
        cerrada_por: lado,
        motivo_cierre: String(datos.motivo),
        avisos: lado === "empresa" ? aviso("proceso_cerrado") : p.avisos,
      };
    }
  }
  return noSePuede;
}

const datosEtapas = (p: ProcesoDemo) => ({
  conversacion_en: p.conversacion_en,
  conversacion_modo: p.conversacion_modo,
  conversacion_confirmada: p.conversacion_confirmada,
  acuerdo_forma: p.acuerdo_forma as Oportunidad["acuerdo_forma"],
  acuerdo_horas_semana: p.acuerdo_horas_semana,
  acuerdo_valor: p.acuerdo_valor,
  acuerdo_unidad: p.acuerdo_unidad,
  acuerdo_inicio: p.acuerdo_inicio,
  acuerdo_nota: p.acuerdo_nota,
  acuerdo_aceptado_en: p.acuerdo_aceptado_en,
  cierre_tipo: p.cierre_tipo,
  cerrada_por: p.cerrada_por,
  acuerdo_version: 0,
  conversacion_version: 0,
});

// Lo que ve la persona: igual que talent_opportunities_view.
export function vistaTalentoDemo(p: ProcesoDemo): Oportunidad {
  return {
    ...oportunidadesEjemplo[0],
    estado: p.estado,
    evaluacion_talento: p.evaluacion_talento,
    ...datosEtapas(p),
    motivo_cierre: p.cerrada_por === "empresa" ? p.motivo_cierre : null,
  };
}

// Lo que ve la organización: igual que company_connections_view. En una búsqueda por reto, la
// organización no ve a la persona mientras no responda, ni si dijo que no.
export function vistaEmpresaDemo(p: ProcesoDemo): ConexionEmpresa | null {
  if (p.estado === "enviada_talento" || p.estado === "descarta") return null;
  return {
    ...conexionesEjemplo[0],
    estado: (p.estado === "visible_empresa" ? "le_interesa" : p.estado) as ConexionEmpresa["estado"],
    dias_esperando: p.estado === "visible_empresa" ? 0 : null,
    evaluacion_empresa: p.evaluacion_empresa,
    ...datosEtapas(p),
    motivo_cierre: p.cerrada_por === "empresa" ? p.motivo_cierre : null,
  };
}
