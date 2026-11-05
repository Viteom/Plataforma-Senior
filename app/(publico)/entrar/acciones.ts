"use server";

import { redirect } from "next/navigation";

import { enmascarar, hashDestino, normalizarCelular, normalizarCorreo } from "@/lib/auth/destino";
import { borrarPendiente, guardarPendiente, leerPendiente, type Para, type Pendiente } from "@/lib/auth/pendiente";
import { inicioDe, type Rol } from "@/lib/auth/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

// Entrada sin contraseña (brief, "Registro sin contraseña").

export type EstadoEntrar = {
  error?: string;
  aviso?: string;
  /** El código salió: a dónde (enmascarado) y por qué medio. La pantalla pasa al paso 2. */
  enviado?: { medio: "celular" | "correo"; a: string };
  /** Supabase no tiene SMS activo: se ofrece recibirlo por correo. */
  sinSms?: boolean;
};

const ERROR_GENERAL = "No pudimos enviar el código. Intenta de nuevo en un momento o pide ayuda.";

async function pedirCodigo(p: Pendiente): Promise<EstadoEntrar | null> {
  const supabase = await crearClienteServidor();

  // Máximo 5 códigos por hora por número o correo. Se cuenta un hash, no el dato.
  const hash = await hashDestino(p.valor, process.env.OTP_PEPPER ?? "");
  const { data: permitido, error: errorLimite } = await supabase.rpc("registrar_intento_codigo", {
    destino_hash: hash,
  });
  // En los registros va solo el motivo técnico, nunca el correo ni el celular.
  if (errorLimite) {
    console.error("[entrar] límite de códigos:", errorLimite.code, errorLimite.message);
    return { error: ERROR_GENERAL };
  }
  if (!permitido) {
    return {
      error:
        "Ya pediste 5 códigos en la última hora. Espera un rato o pide ayuda y te colaboramos.",
    };
  }

  // Solo "talento" o "empresa" pueden venir del registro; el trigger de la base lo garantiza.
  const opciones = { shouldCreateUser: true, data: { rol: p.para } };
  const { error } =
    p.tipo === "celular"
      ? await supabase.auth.signInWithOtp({ phone: p.valor, options: opciones })
      : await supabase.auth.signInWithOtp({ email: p.valor, options: opciones });

  if (error) {
    if (error.status === 429) {
      return { error: "Debes esperar un minuto antes de pedir otro código." };
    }
    // Mientras no haya proveedor de SMS (Twilio), el código solo puede llegar por correo.
    if (p.tipo === "celular" && (error.code === "phone_provider_disabled" || error.code === "sms_send_failed")) {
      return {
        error: "Por ahora no podemos enviar mensajes de texto. Recibe el código en tu correo.",
        sinSms: true,
      };
    }
    console.error("[entrar] envío del código:", error.status, error.code, error.message);
    return { error: ERROR_GENERAL };
  }
  return null;
}

export async function enviarCodigo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const medio = datos.get("medio") === "correo" ? "correo" : "celular";
  const para: Para = datos.get("para") === "empresa" ? "empresa" : "talento";
  const crudo = String(datos.get(medio) ?? "");

  const valor = medio === "celular" ? normalizarCelular(crudo) : normalizarCorreo(crudo);
  if (!valor) {
    return {
      error:
        medio === "celular"
          ? "Escribe los 10 números del celular. Empieza por 3, por ejemplo 300 123 4567."
          : "Revisa el correo. Debe tener una @ y terminar en algo como .com o .co.",
    };
  }

  const pendiente: Pendiente = { tipo: medio, valor, para };
  const fallo = await pedirCodigo(pendiente);
  if (fallo) return fallo;

  await guardarPendiente(pendiente);
  return { enviado: { medio, a: enmascarar(pendiente) } };
}

export async function reenviarCodigo(_previo: EstadoEntrar): Promise<EstadoEntrar> {
  const pendiente = await leerPendiente();
  if (!pendiente) redirect("/entrar");
  return (await pedirCodigo(pendiente)) ?? { aviso: "Te enviamos un código nuevo." };
}

export async function verificarCodigo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const codigo = String(datos.get("codigo") ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { error: "El código tiene 6 números." };

  const pendiente = await leerPendiente();
  if (!pendiente) {
    return { error: "Pasaron más de 10 minutos. Vuelve a pedir el código." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } =
    pendiente.tipo === "celular"
      ? await supabase.auth.verifyOtp({ phone: pendiente.valor, token: codigo, type: "sms" })
      : await supabase.auth.verifyOtp({ email: pendiente.valor, token: codigo, type: "email" });

  if (error || !data.user) {
    return { error: "El código no es correcto o ya venció. Revísalo o pide otro." };
  }

  await borrarPendiente();

  // Si una organización invitó este correo, la cuenta queda en su equipo (y con rol de organización).
  if (pendiente.tipo === "correo") await supabase.rpc("aceptar_invitacion");

  const { data: fila } = await supabase.from("user_roles").select("rol").eq("user_id", data.user.id).maybeSingle();
  const rol = (fila?.rol as Rol | undefined) ?? "talento";

  // Primera vez: perfil en 3 pasos. Ya registrado: inicio. Si un gestor la registró en campo con
  // este celular, recibe ese perfil (reclamar_perfil) en vez de empezar de cero.
  if (rol === "talento") {
    await supabase.rpc("reclamar_perfil");
    const { data: perfil } = await supabase
      .from("talent_profiles")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!perfil) redirect("/perfil/nuevo");
  }
  redirect(inicioDe(rol));
}

export async function salir() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}

// Modo demostración: no envía nada, pero también va por POST. Si el formulario no tuviera acción,
// un toque antes de que cargue la página lo enviaría por GET y el celular quedaría en la URL.
export async function entrarDemo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const medio = datos.get("medio") === "correo" ? "correo" : "celular";
  return { enviado: { medio, a: medio === "celular" ? "300 *** 4567" : "n***@correo.com" } };
}

export async function codigoDemo(_previo: EstadoEntrar, _datos: FormData): Promise<EstadoEntrar> {
  redirect("/perfil/nuevo");
}
