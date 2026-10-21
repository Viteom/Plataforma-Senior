"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MODO_DEMO, necesidadEjemplo } from "@/lib/demo";
import { esForma } from "@/lib/formas";
import { crearClienteServidor } from "@/lib/supabase/server";

// Acciones de la empresa. Los pasos de una conexión pasan por funciones de la base que revisan
// quién lo pide y desde qué estado; la regla 9 la hace cumplir un trigger.

export type Estado = { error?: string; aviso?: string };

const DEMO = { aviso: "En la demostración no se guarda nada." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const texto = (v: FormDataEntryValue | null, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

async function sesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?para=empresa");
  return { supabase, user };
}

// Traduce los errores de la base a algo que la empresa entienda, sin detalles internos.
function mensaje(error: { message?: string } | null): string {
  const m = error?.message ?? "";
  if (/sin verificar|pausada/.test(m)) return "Su empresa todavía no está verificada o está en pausa. Le escribimos cuando quede lista.";
  if (/registrada/.test(m)) return "Primero registre los datos de su empresa.";
  if (/una_conexion_viva|duplicate/.test(m)) return "Ya pidió conocer este perfil. Lo verá en Mis procesos.";
  if (/no disponible/.test(m)) return "Este perfil ya no está disponible.";
  return "No pudimos guardar. Intente de nuevo o pida ayuda.";
}

export async function registrarEmpresa(_p: Estado, datos: FormData): Promise<Estado> {
  const nombre = texto(datos.get("nombre"), 120);
  const nit = String(datos.get("nit") ?? "").replace(/[^\d]/g, "");
  const sector = texto(datos.get("sector"), 80);
  const tamano = texto(datos.get("tamano"), 40);
  const ciudad = texto(datos.get("ciudad"), 80);
  const contacto = texto(datos.get("contacto"), 120);
  if (nombre.length < 2) return { error: "Escriba el nombre de la empresa." };
  if (nit.length < 9 || nit.length > 10) return { error: "Escriba el NIT sin dígito de verificación: 9 o 10 números." };
  if (ciudad.length < 2) return { error: "Escriba la ciudad." };
  if (contacto.length < 2) return { error: "Escriba el nombre de la persona de contacto." };
  if (MODO_DEMO) return DEMO;

  const { supabase, user } = await sesion();
  const { error } = await supabase.from("companies").insert({ owner_id: user.id, nombre, nit, sector, tamano, ciudad, contacto });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa", "layout");
  return { aviso: "Listo. Nuestro equipo verifica el NIT en el RUES; mientras tanto puede explorar perfiles." };
}

export async function pedirConexion(_p: Estado, datos: FormData): Promise<Estado> {
  const talento = String(datos.get("talento") ?? "");
  if (!UUID.test(talento)) return { error: "Perfil no válido." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await sesion();
  const { error } = await supabase.rpc("pedir_conexion", { talento });
  if (error) return { error: mensaje(error) };
  revalidatePath(`/empresa/perfil/${talento}`);
  return { aviso: "Listo. Le contamos a la persona; si le interesa, abrimos la conversación." };
}

export async function quieroConocer(_p: Estado, datos: FormData): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  if (!UUID.test(conexion)) return { error: "Conexión no válida." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await sesion();
  const { error } = await supabase.rpc("actuar_conexion", { conexion, accion: "quiero_conocer" });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa", "layout");
  return { aviso: "Listo. Nuestro equipo les pone en contacto en las próximas 24 horas hábiles." };
}

export async function cerrarConexion(_p: Estado, datos: FormData): Promise<Estado> {
  const conexion = String(datos.get("conexion") ?? "");
  const evaluacion = Number(datos.get("evaluacion"));
  if (!UUID.test(conexion)) return { error: "Conexión no válida." };
  if (!Number.isInteger(evaluacion) || evaluacion < 1 || evaluacion > 5) return { error: "Elija una calificación de 1 a 5." };
  if (MODO_DEMO) return DEMO;
  const { supabase } = await sesion();
  const { error } = await supabase.rpc("actuar_conexion", { conexion, accion: "cerrar", evaluacion });
  if (error) return { error: mensaje(error) };
  revalidatePath("/empresa", "layout");
  return { aviso: "Gracias. Su evaluación ayuda a otras empresas a confiar." };
}

// Buscar por un problema. Los requisitos se eligen de la taxonomía (sin IA: la IA está apagada).
export async function crearNecesidad(_p: Estado, datos: FormData): Promise<Estado> {
  const problema = texto(datos.get("problema"), 3000);
  const formatos = datos.getAll("formatos").map(String).filter(esForma);
  const modalidad = ["presencial", "remoto", "mixto"].includes(String(datos.get("modalidad"))) ? String(datos.get("modalidad")) : null;
  const ubicacion = texto(datos.get("ubicacion"), 80) || null;
  const presupuestoCrudo = String(datos.get("presupuesto") ?? "").replace(/[^\d]/g, "");
  const presupuesto = presupuestoCrudo ? Number(presupuestoCrudo) : null;
  const obligatorios = datos.getAll("obligatorio").map(String).filter((v) => UUID.test(v));
  const deseables = datos.getAll("deseable").map(String).filter((v) => UUID.test(v) && !obligatorios.includes(v));

  if (problema.length < 20) return { error: "Cuéntenos el problema con un poco más de detalle." };
  if (!formatos.length) return { error: "Elija al menos una forma de contratar." };
  if (!obligatorios.length && !deseables.length) return { error: "Elija al menos un requisito de la lista." };
  if (MODO_DEMO) redirect(`/empresa/problema/${necesidadEjemplo.id}`);

  const { supabase } = await sesion();
  const { data: empresa } = await supabase.rpc("mi_empresa");
  if (!empresa) return { error: "Primero registre los datos de su empresa." };

  const { data: necesidad, error } = await supabase
    .from("needs")
    .insert({ company_id: empresa, problema, formatos, modalidad, ubicacion, presupuesto })
    .select("id")
    .single();
  if (error || !necesidad) return { error: mensaje(error) };

  const { data: tax } = await supabase.from("taxonomy").select("id, capa, etiqueta").in("id", [...obligatorios, ...deseables]);
  if (tax?.length) {
    const { error: errorReq } = await supabase.from("need_requirements").insert(
      tax.map((t) => ({ need_id: necesidad.id, capa: t.capa, etiqueta: t.etiqueta, taxonomy_id: t.id, obligatorio: obligatorios.includes(t.id) })),
    );
    if (errorReq) return { error: mensaje(errorReq) };
  }
  redirect(`/empresa/problema/${necesidad.id}`);
}
