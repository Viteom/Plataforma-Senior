"use server";

import { normalizarCelular } from "@/lib/auth/destino";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Estado = { error?: string; aviso?: string };

// "Llámeme": funciona también sin cuenta. Quien no logra entrar es quien más lo necesita.
export async function pedirLlamada(_p: Estado, datos: FormData): Promise<Estado> {
  const celular = normalizarCelular(String(datos.get("celular") ?? ""));
  const franja = datos.get("franja") === "tarde" ? "tarde" : "manana";
  const motivo = String(datos.get("motivo") ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!celular) return { error: "Escriba los 10 números del celular. Empieza por 3." };
  if (MODO_DEMO) return { aviso: "En la demostración no se guarda nada." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("pedir_llamada", { telefono: celular, franja, motivo });
  if (error) {
    if (/ya pidió/.test(error.message)) return { error: "Ya tenemos su pedido de hoy. Le llamamos pronto." };
    // Tope global de pedidos sin cuenta (migración de seguridad): la salida humana sigue abierta.
    if (/muchos pedidos/.test(error.message)) {
      return { error: "Ahora mismo tenemos muchos pedidos. Escríbanos por WhatsApp o intente de nuevo en una hora." };
    }
    return { error: "No pudimos guardar su pedido. Intente de nuevo en un momento." };
  }
  return { aviso: `Listo. Le llamamos en la ${franja === "tarde" ? "tarde (2 a 6)" : "mañana (8 a 12)"} desde el número de la plataforma.` };
}

// El chat detectó un tema que atiende una persona. Con sesión, se crea la solicitud; sin sesión,
// la pantalla pide el celular (Llámeme).
export async function escalarChat(categoria: string, mensaje: string): Promise<{ creada: boolean }> {
  if (MODO_DEMO) return { creada: false };
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { creada: false };
  const { error } = await supabase.from("help_requests").insert({
    user_id: user.id,
    canal: "chat",
    // Contexto corto para el equipo; el chat ya le pidió no escribir datos personales.
    motivo: `Chat (${categoria.slice(0, 20)}): ${mensaje.replace(/\s+/g, " ").trim().slice(0, 300)}`,
  });
  return { creada: !error };
}
