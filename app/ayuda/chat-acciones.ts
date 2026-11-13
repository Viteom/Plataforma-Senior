"use server";

import { baseDeConocimiento } from "@/lib/ayuda/respuestas";
import { MODO_DEMO } from "@/lib/demo";
import { obtenerProveedor } from "@/lib/ia/entorno";
import { prepararHistoria } from "@/lib/ia/preparar";
import { FalloIA, type TurnoIA } from "@/lib/ia/tipos";
import { crearClienteServidor } from "@/lib/supabase/server";

// Respuesta de la IA para el chat de ayuda. Solo se usa cuando las respuestas sin IA no entendieron
// la pregunta, y solo si: la IA está encendida (IA_PROVEEDOR), la persona tiene sesión y le queda
// cupo del día (tarea «chat» en ia_topes). En cualquier otro caso devuelve null y el chat sigue
// con su respuesta sin IA: nunca hay un costo que nadie decidió.

const MAX_TURNOS = 12;
const MAX_LETRAS = 600;

const SISTEMA = `Eres la ayuda de Kánna, una plataforma colombiana que conecta talento con trayectoria (personas de 45 años o más y talento del campo) con organizaciones.

Respondes dudas sobre cómo usar Kánna. Quien te escribe puede tener poca práctica con la tecnología, así que hablas de tú, en español sencillo de Colombia, con frases cortas y sin tecnicismos. Dos o tres frases suelen bastar. No uses listas ni formato: el chat muestra texto plano.

Usa lo que sabes de Kánna (abajo). Si la pregunta no está ahí o no estás seguro, dilo con sencillez y ofrece que una persona del equipo llame: el botón «Que me llamen» está en el mismo chat. Es mejor reconocer que no sabes que inventar un dato.

Hay cosas que Kánna cuida y que explican varios límites:
- Nadie de Kánna ni de una organización pide dinero, códigos, contraseñas ni el número de cédula por este chat. Si alguien cuenta que se lo pidieron, dile que no lo entregue y que lo reporte.
- La edad nunca se muestra ni se usa para elegir perfiles, así que no preguntes la edad ni opines sobre ella.
- No das consejo legal, médico ni de pensiones: para eso está el equipo, y un error ahí le puede costar a la persona.
- No prometes que alguien va a conseguir trabajo ni cuánto va a ganar.

Lo que sabes de Kánna:

${baseDeConocimiento()}`;

type Entrada = { de: "persona" | "asistente"; texto: string };

export async function responderConIA(mensajes: Entrada[]): Promise<string | null> {
  if (MODO_DEMO || !Array.isArray(mensajes)) return null;
  const proveedor = obtenerProveedor();
  if (!proveedor?.conversar) return null;

  // Lo que llega del navegador no se da por bueno: se recorta y se limpia.
  const turnos: TurnoIA[] = mensajes
    .slice(-MAX_TURNOS)
    .filter((m) => m && (m.de === "persona" || m.de === "asistente") && typeof m.texto === "string" && m.texto.trim())
    .map((m) => ({
      rol: m.de === "persona" ? ("persona" as const) : ("asistente" as const),
      // Antes de salir de Kánna se quitan teléfonos, correos, documentos y fechas.
      texto: m.de === "persona" ? prepararHistoria(m.texto.slice(0, MAX_LETRAS)).texto : m.texto.slice(0, MAX_LETRAS * 2),
    }));
  // La conversación debe empezar y terminar con la persona.
  while (turnos.length && turnos[0].rol !== "persona") turnos.shift();
  if (!turnos.length || turnos[turnos.length - 1].rol !== "persona") return null;

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: uso } = await supabase.rpc("reservar_uso_ia", { tarea: "chat", modelo: proveedor.modelo });
  if (!uso) return null;

  try {
    const texto = await proveedor.conversar(SISTEMA, turnos);
    await supabase.rpc("cerrar_uso_ia", { uso, resultado: "correcto" });
    return texto.slice(0, 1500);
  } catch (error) {
    const rechazo = error instanceof FalloIA && error.motivo === "rechazo";
    await supabase.rpc("cerrar_uso_ia", { uso, resultado: rechazo ? "rechazado" : "error" });
    // En el registro va solo el motivo, nunca lo que escribió la persona.
    console.error("[ayuda] IA:", error instanceof FalloIA ? error.motivo : "desconocido");
    return null;
  }
}
