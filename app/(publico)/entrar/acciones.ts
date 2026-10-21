"use server";

import { redirect } from "next/navigation";

import { hashDestino, normalizarCelular, normalizarCorreo } from "@/lib/auth/destino";
import { borrarPendiente, guardarPendiente, leerPendiente, type Para, type Pendiente } from "@/lib/auth/pendiente";
import { inicioDe, type Rol } from "@/lib/auth/rutas";
import { crearClienteServidor } from "@/lib/supabase/server";

// Entrada sin contraseña (brief, "Registro sin contraseña").

export type EstadoEntrar = { error?: string; aviso?: string };

const ERROR_GENERAL = "No pudimos enviar el código. Intente de nuevo en un momento o pida ayuda.";

async function pedirCodigo(p: Pendiente): Promise<EstadoEntrar | null> {
  const supabase = await crearClienteServidor();

  // Máximo 5 códigos por hora por número o correo. Se cuenta un hash, no el dato.
  const hash = await hashDestino(p.valor, process.env.OTP_PEPPER ?? "");
  const { data: permitido, error: errorLimite } = await supabase.rpc("registrar_intento_codigo", {
    destino_hash: hash,
  });
  if (errorLimite) return { error: ERROR_GENERAL };
  if (!permitido) {
    return {
      error:
        "Ya pidió 5 códigos en la última hora. Espere un rato o pida ayuda y le colaboramos.",
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
      return { error: "Debe esperar 45 segundos antes de pedir otro código." };
    }
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
          ? "Escriba los 10 números del celular. Empieza por 3, por ejemplo 300 123 4567."
          : "Revise el correo. Debe tener una @ y terminar en algo como .com o .co.",
    };
  }

  const pendiente: Pendiente = { tipo: medio, valor, para };
  const fallo = await pedirCodigo(pendiente);
  if (fallo) return fallo;

  await guardarPendiente(pendiente);
  redirect("/entrar/codigo");
}

export async function reenviarCodigo(_previo: EstadoEntrar): Promise<EstadoEntrar> {
  const pendiente = await leerPendiente();
  if (!pendiente) redirect("/entrar");
  return (await pedirCodigo(pendiente)) ?? { aviso: "Le enviamos un código nuevo." };
}

export async function verificarCodigo(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const codigo = String(datos.get("codigo") ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) return { error: "El código tiene 6 números." };

  const pendiente = await leerPendiente();
  if (!pendiente) {
    return { error: "Pasaron más de 10 minutos. Vuelva a pedir el código." };
  }

  const supabase = await crearClienteServidor();
  const { data, error } =
    pendiente.tipo === "celular"
      ? await supabase.auth.verifyOtp({ phone: pendiente.valor, token: codigo, type: "sms" })
      : await supabase.auth.verifyOtp({ email: pendiente.valor, token: codigo, type: "email" });

  if (error || !data.user) {
    return { error: "El código no es correcto o ya venció. Revíselo o pida otro." };
  }

  await borrarPendiente();

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

// Modo demostración: solo navegan, pero también por POST. Si el formulario no tuviera acción,
// un toque antes de que cargue la página lo enviaría por GET y el celular quedaría en la URL.
export async function entrarDemo() {
  redirect("/entrar/codigo");
}

export async function codigoDemo() {
  redirect("/perfil/nuevo");
}
