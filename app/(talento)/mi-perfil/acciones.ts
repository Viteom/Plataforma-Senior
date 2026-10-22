"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizarCelular } from "@/lib/auth/destino";
import { esForma, type FormaContratar } from "@/lib/formas";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

// Acciones de /mi-perfil. Todas pasan por la sesión de la persona: RLS decide qué puede tocar.

export type Estado = { error?: string; aviso?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ERROR = "No pudimos guardar el cambio. Intente de nuevo o pida ayuda.";
const TIPOS_ARCHIVO = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_ARCHIVO = 10 * 1024 * 1024;

async function sesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: perfil } = await supabase.from("talent_profiles").select("id, estado").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/perfil/nuevo");
  return { supabase, user, perfil: perfil as { id: string; estado: string } };
}

const texto = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function actualizarDatos(_p: Estado, datos: FormData): Promise<Estado> {
  const nombre = texto(datos.get("nombre"), 80);
  const ubicacion = texto(datos.get("ubicacion"), 80);
  const oficio = texto(datos.get("oficio"), 120);
  const resumen = texto(datos.get("resumen"), 600);
  if (nombre.length < 2 || ubicacion.length < 2 || oficio.length < 2) {
    return { error: "Nombre, ciudad u oficio están vacíos." };
  }
  const { supabase, perfil } = await sesion();
  const { error } = await supabase
    .from("talent_profiles")
    .update({ nombre, ubicacion, oficio, resumen: resumen || null })
    .eq("id", perfil.id);
  if (error) return { error: ERROR };
  revalidatePath("/mi-perfil");
  return { aviso: "Guardado." };
}

export async function cambiarVisibilidad(datos: FormData) {
  const visibilidad = datos.get("visibilidad") === "visible" ? "visible" : "reservado";
  const { supabase, perfil } = await sesion();
  await supabase.from("talent_profiles").update({ visibilidad }).eq("id", perfil.id);
  revalidatePath("/mi-perfil");
}

// Pausar oculta el perfil a las empresas sin borrar nada.
export async function cambiarEstado(datos: FormData) {
  const estado = datos.get("estado") === "pausado" ? "pausado" : "publicado";
  const { supabase, perfil } = await sesion();
  if (perfil.estado === "borrador") return; // sin huella confirmada no se publica
  await supabase.from("talent_profiles").update({ estado }).eq("id", perfil.id);
  revalidatePath("/mi-perfil");
}

export async function actualizarFormas(_p: Estado, datos: FormData): Promise<Estado> {
  const formas = datos.getAll("formas").map(String).filter(esForma) as FormaContratar[];
  if (!formas.length) return { error: "Elija al menos una forma de trabajar." };
  const horasCrudas = String(datos.get("horas") ?? "").trim();
  const horas = horasCrudas ? Number(horasCrudas) : null;
  if (horas !== null && (!Number.isInteger(horas) || horas < 1 || horas > 48)) {
    return { error: "Escriba un número de horas entre 1 y 48." };
  }
  const modalidad = ["presencial", "remoto", "mixto"].includes(String(datos.get("modalidad"))) ? String(datos.get("modalidad")) : "presencial";
  const orientacion = datos.get("orientacion") === "si";

  const { supabase, user, perfil } = await sesion();
  await supabase.from("talent_offers").delete().eq("talent_id", perfil.id);
  const { error } = await supabase.from("talent_offers").insert(
    formas.map((tipo) => {
      const tarifa = Number(String(datos.get(`tarifa-${tipo}`) ?? "").replace(/[^\d]/g, ""));
      return {
        talent_id: perfil.id,
        tipo,
        horas_semana: horas,
        modalidad,
        tarifa_esperada: tarifa > 0 ? tarifa : null,
        quiere_orientacion: orientacion,
      };
    }),
  );
  if (error) return { error: ERROR };
  if (orientacion) {
    await supabase.from("help_requests").insert({
      user_id: user.id,
      canal: "orientacion_tarifa",
      motivo: "Pidió orientación sobre cuánto cobrar desde Mi perfil.",
    });
  }
  revalidatePath("/mi-perfil");
  return { aviso: "Guardado." };
}

export async function quitarEtiqueta(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  if (!UUID.test(id)) return;
  const { supabase } = await sesion();
  await supabase.from("footprint_tags").delete().eq("id", id);
  revalidatePath("/mi-perfil");
}

export async function agregarReferencia(_p: Estado, datos: FormData): Promise<Estado> {
  const nombre = texto(datos.get("nombre"), 80);
  const descripcion = texto(datos.get("descripcion"), 120);
  const telefono = normalizarCelular(String(datos.get("telefono") ?? ""));
  if (nombre.length < 2) return { error: "Escriba el nombre de la persona." };
  if (!telefono) return { error: "Escriba un celular de 10 números, empezando por 3." };
  if (descripcion.length < 2) return { error: "Cuéntenos de dónde le conoce, por ejemplo «fue mi jefe en la planta»." };

  const { supabase, perfil } = await sesion();
  const { error } = await supabase.from("evidence").insert({
    talent_id: perfil.id,
    tipo: "referencia",
    referencia_nombre: nombre,
    referencia_telefono: telefono,
    descripcion,
  });
  if (error) return { error: ERROR };
  revalidatePath("/mi-perfil");
  return { aviso: "Listo. Alguien del equipo llamará a esa persona antes de mostrarla." };
}

export async function subirArchivo(_p: Estado, datos: FormData): Promise<Estado> {
  const archivo = datos.get("archivo");
  const descripcion = texto(datos.get("descripcion"), 120);
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elija una foto o un documento." };
  if (!TIPOS_ARCHIVO.includes(archivo.type)) return { error: "Solo fotos (JPG, PNG) o documentos PDF." };
  if (archivo.size > MAX_ARCHIVO) return { error: "El archivo pesa más de 10 MB. Intente con una foto más liviana." };
  if (descripcion.length < 2) return { error: "Cuéntenos qué muestra, por ejemplo «certificado del curso»." };

  const { supabase, perfil } = await sesion();
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[archivo.type];
  // La ruta empieza por el id del perfil: así lo exigen las reglas del bucket.
  const ruta = `${perfil.id}/${crypto.randomUUID()}.${extension}`;
  const { error: errorSubida } = await supabase.storage.from("evidencias").upload(ruta, archivo, { contentType: archivo.type });
  if (errorSubida) return { error: ERROR };

  const { error } = await supabase.from("evidence").insert({ talent_id: perfil.id, tipo: "archivo", archivo_path: ruta, descripcion });
  if (error) {
    await supabase.storage.from("evidencias").remove([ruta]);
    return { error: ERROR };
  }
  revalidatePath("/mi-perfil");
  return { aviso: "Listo. El equipo lo revisará antes de mostrarlo." };
}

// Foto del perfil. Solo la ven las empresas si el perfil es visible o si la persona aceptó
// conocerlas; nunca entra al puntaje (regla 1).
const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
const MAX_FOTO = 5 * 1024 * 1024;

export async function subirFoto(_p: Estado, datos: FormData): Promise<Estado> {
  const archivo = datos.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Elija una foto." };
  if (!TIPOS_FOTO.includes(archivo.type)) return { error: "Solo fotos JPG, PNG o WebP." };
  if (archivo.size > MAX_FOTO) return { error: "La foto pesa más de 5 MB. Intente con una más liviana." };

  const { supabase, perfil } = await sesion();
  const { data: actual } = await supabase.from("talent_profiles").select("foto_path").eq("id", perfil.id).single();
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[archivo.type];
  // Nombre nuevo en cada cambio: así ningún celular se queda mostrando la foto anterior.
  const ruta = `${perfil.id}/foto-${crypto.randomUUID()}.${extension}`;
  const { error: errorSubida } = await supabase.storage.from("fotos").upload(ruta, archivo, { contentType: archivo.type });
  if (errorSubida) return { error: ERROR };

  const { error } = await supabase.from("talent_profiles").update({ foto_path: ruta }).eq("id", perfil.id);
  if (error) {
    await supabase.storage.from("fotos").remove([ruta]);
    return { error: ERROR };
  }
  if (actual?.foto_path) await supabase.storage.from("fotos").remove([actual.foto_path as string]);
  revalidatePath("/mi-perfil");
  return { aviso: "Foto guardada." };
}

export async function quitarFoto() {
  const { supabase, perfil } = await sesion();
  const { data: actual } = await supabase.from("talent_profiles").select("foto_path").eq("id", perfil.id).single();
  await supabase.from("talent_profiles").update({ foto_path: null }).eq("id", perfil.id);
  if (actual?.foto_path) await supabase.storage.from("fotos").remove([actual.foto_path as string]);
  revalidatePath("/mi-perfil");
}

export async function borrarEvidencia(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  if (!UUID.test(id)) return;
  const { supabase } = await sesion();
  const { data } = await supabase.from("evidence").delete().eq("id", id).select("archivo_path").maybeSingle();
  if (data?.archivo_path) await supabase.storage.from("evidencias").remove([data.archivo_path as string]);
  revalidatePath("/mi-perfil");
}

export async function cambiarAutorizacion(datos: FormData) {
  const id = String(datos.get("id") ?? "");
  if (!UUID.test(id)) return;
  const { supabase } = await sesion();
  await supabase.from("evidence").update({ autorizada_empresas: datos.get("autorizada") === "si" }).eq("id", id);
  revalidatePath("/mi-perfil");
}

// Descargar los propios datos (Ley 1581). La fecha de nacimiento y la autorización están en la
// parte que solo lee el equipo; el archivo explica cómo pedirlas.
export async function descargarDatos(): Promise<string> {
  const { supabase, user, perfil } = await sesion();
  const [perfilCompleto, ofertas, historias, huella, evidencias, ayudas] = await Promise.all([
    supabase.from("talent_profiles").select("nombre, ubicacion, oficio, resumen, visibilidad, estado, created_at").eq("id", perfil.id).single(),
    supabase.from("talent_offers").select("tipo, horas_semana, modalidad, tarifa_esperada").eq("talent_id", perfil.id),
    supabase.from("stories").select("texto, origen, created_at").eq("talent_id", perfil.id),
    supabase.from("footprint_tags").select("capa, etiqueta, confirmada").eq("talent_id", perfil.id),
    supabase.from("evidence").select("tipo, descripcion, referencia_nombre, referencia_telefono, estado, creado_en").eq("talent_id", perfil.id),
    supabase.from("help_requests").select("canal, motivo, estado, creado_en").eq("user_id", user.id),
  ]);
  return JSON.stringify(
    {
      descargado_en: new Date().toISOString(),
      cuenta: { celular: user.phone ?? null, correo: user.email ?? null },
      perfil: perfilCompleto.data,
      formas_de_trabajar: ofertas.data,
      historias: historias.data,
      huella: huella.data,
      evidencias: evidencias.data,
      solicitudes_de_ayuda: ayudas.data,
      nota: "Su fecha de nacimiento y su autorización de datos las guarda el equipo aparte. Puede pedirlas desde Ayuda.",
    },
    null,
    2,
  );
}

export async function borrarCuenta(): Promise<Estado> {
  const { supabase, user, perfil } = await sesion();

  // Archivos primero: al borrar el perfil se pierde la referencia a sus rutas.
  const { data: archivos } = await supabase.from("evidence").select("archivo_path").eq("talent_id", perfil.id).not("archivo_path", "is", null);
  const rutas = (archivos ?? []).map((a) => a.archivo_path as string);
  if (rutas.length) await supabase.storage.from("evidencias").remove(rutas);
  const { data: conFoto } = await supabase.from("talent_profiles").select("foto_path").eq("id", perfil.id).single();
  if (conFoto?.foto_path) await supabase.storage.from("fotos").remove([conFoto.foto_path as string]);

  // Borra el perfil y, en cascada, ofertas, historias, huella, evidencias y datos privados.
  const { error } = await supabase.from("talent_profiles").delete().eq("id", perfil.id);
  if (error) return { error: ERROR };

  // El usuario de Auth solo se borra con la llave de servicio. Sin ella, el equipo lo termina.
  const admin = crearClienteAdmin();
  if (admin) {
    await admin.auth.admin.deleteUser(user.id);
  } else {
    await supabase.from("help_requests").insert({
      user_id: user.id,
      canal: "borrar_cuenta",
      motivo: "Borró su perfil. Falta eliminar su usuario de acceso.",
    });
  }
  await supabase.auth.signOut();
  redirect("/?cuenta=borrada");
}
