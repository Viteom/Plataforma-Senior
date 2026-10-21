"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizarCelular } from "@/lib/auth/destino";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

// Envía un registro asistido (brief, "Registro asistido"). El id lo genera el celular del gestor
// y es también el id del perfil: si la señal se cae a mitad y se reintenta, no se duplica.

export type Resultado = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const texto = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const archivo = (v: FormDataEntryValue | null) => (v instanceof File && v.size > 0 ? v : null);
const extension = (f: File) => (f.type.includes("png") ? "png" : f.type.includes("jpeg") ? "jpg" : f.type.includes("webp") ? "webp" : f.type.includes("ogg") ? "ogg" : f.type.includes("mp4") ? "m4a" : "webm");

export async function enviarRegistro(datos: FormData): Promise<Resultado> {
  const id = String(datos.get("id") ?? "");
  const nombre = texto(datos.get("nombre"), 80);
  const ubicacion = texto(datos.get("ubicacion"), 80);
  const oficio = texto(datos.get("oficio"), 120);
  const celularCrudo = texto(datos.get("celular"), 20);
  const celular = celularCrudo ? normalizarCelular(celularCrudo) : null;
  const visibilidad = datos.get("visibilidad") === "visible" ? "visible" : "reservado";
  const historiaTexto = texto(datos.get("historia"), 6000);
  const historiaAudio = archivo(datos.get("historiaAudio"));
  const foto = visibilidad === "visible" ? archivo(datos.get("foto")) : null;
  const medio = datos.get("autorizacionMedio") === "audio" ? "audio" : "firma";
  const autorizacion = archivo(datos.get("autorizacion"));

  if (!UUID.test(id)) return { ok: false, error: "Registro dañado. Vuelva a crearlo." };
  if (nombre.length < 2 || ubicacion.length < 2) return { ok: false, error: "Falta el nombre o la vereda." };
  if (celularCrudo && !celular) return { ok: false, error: "El celular debe tener 10 números y empezar por 3." };
  if (!historiaTexto && !historiaAudio) return { ok: false, error: "Falta la historia (escrita o grabada)." };
  if (!autorizacion) return { ok: false, error: "Falta la autorización de datos (firma o audio)." };
  if (MODO_DEMO) return { ok: true };

  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // 1. Perfil (si ya existe por un intento anterior, se sigue con él).
  const { error: errorPerfil } = await supabase
    .from("talent_profiles")
    .insert({ id, user_id: null, registrado_por: user.id, nombre, ubicacion, oficio, visibilidad });
  if (errorPerfil && !/duplicate|23505/.test(`${errorPerfil.code} ${errorPerfil.message}`)) {
    return { ok: false, error: "No pudimos crear el perfil. Intente de nuevo." };
  }

  // 2. Archivos, en carpetas con el id del perfil (así lo exigen las reglas de Storage).
  const subir = async (bucket: string, nombreArchivo: string, f: File) => {
    const ruta = `${id}/${nombreArchivo}.${extension(f)}`;
    const { error } = await supabase.storage.from(bucket).upload(ruta, f, { contentType: f.type, upsert: true });
    return error ? null : ruta;
  };
  const rutaAutorizacion = await subir("autorizaciones", medio, autorizacion);
  if (!rutaAutorizacion) return { ok: false, error: "No pudimos subir la autorización. Intente de nuevo." };
  const rutaAudio = historiaAudio ? await subir("historias", "historia", historiaAudio) : null;
  if (historiaAudio && !rutaAudio) return { ok: false, error: "No pudimos subir el audio de la historia. Intente de nuevo." };
  const rutaFoto = foto ? await subir("fotos", "foto", foto) : null;
  if (rutaFoto) await supabase.from("talent_profiles").update({ foto_path: rutaFoto }).eq("id", id);

  // 3. Historia (una sola por registro, aunque se reintente).
  const { data: yaHay } = await supabase.from("stories").select("id").eq("talent_id", id).eq("origen", "gestor").limit(1);
  if (!yaHay?.length) {
    const { error } = await supabase.from("stories").insert({
      talent_id: id,
      origen: "gestor",
      texto: historiaTexto || "[Historia grabada en audio: falta transcribirla]",
      audio_path: rutaAudio,
    });
    if (error) return { ok: false, error: "No pudimos guardar la historia. Intente de nuevo." };
  }

  // 4. Celular y autorización: solo los ve el equipo.
  const { error: errorPrivado } = await supabase.rpc("guardar_registro_gestor", {
    perfil: id,
    celular: celular ? celular.replace(/^\+57/, "") : null,
    autorizacion_medio: medio,
    autorizacion_archivo: rutaAutorizacion,
  });
  if (errorPrivado) return { ok: false, error: "No pudimos guardar la autorización. Intente de nuevo." };

  revalidatePath("/gestor/registrar");
  return { ok: true };
}
