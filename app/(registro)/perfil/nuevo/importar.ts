"use server";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { MODO_DEMO } from "@/lib/demo";
import { crearClienteServidor } from "@/lib/supabase/server";
const ejecutar = promisify(execFile);
let lectores = 0;
export type LecturaHojaVida = { texto?: string; error?: string; demo?: boolean };

// En la demostración no hay cuenta ni tope diario: no se lee ningún archivo, para que nadie pueda
// poner al servidor a abrir documentos sin límite. Se devuelve siempre este ejemplo.
const HOJA_VIDA_DEMO = `Marta Lucía Gómez
Oficio: Cocina de producción y formación de aprendices
Experiencia
Jefa de cocina en un restaurante de Medellín. Organicé la producción por lotes para 300 almuerzos diarios.
Formé a doce aprendices del SENA en manipulación de alimentos, costos y orden de la cocina.
Monté el plan de compras con proveedores del barrio y bajé el desperdicio a la mitad.`;
export async function leerHojaVida(d: FormData): Promise<LecturaHojaVida> {
  const archivo = d.get("hoja_vida");
  if (!(archivo instanceof File) || !archivo.size || archivo.size > 5 * 1024 * 1024)
    return { error: "Elige un archivo de hasta 5 MB." };
  const extension = archivo.name.toLowerCase().split(".").at(-1) ?? "";
  if (!["pdf", "doc", "docx"].includes(extension)) return { error: "Elige un archivo PDF o Word (.doc o .docx)." };
  if (lectores >= 2)
    return {
      error: "Estamos leyendo otros documentos. Intenta de nuevo en un momento.",
    };
  if (MODO_DEMO) return { texto: HOJA_VIDA_DEMO, demo: true };
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entra a tu cuenta para importar tu hoja de vida." };
  const { data, error } = await supabase.rpc("reservar_uso_ia", {
    tarea: "huella",
    modelo: "lector-local",
  });
  if (error || !data)
    return {
      error: "Por hoy llegaste al límite de importaciones. Puedes escribir o dictar tu historia.",
    };
  const uso: string = data;
  lectores++;
  let carpeta: string | undefined;
  try {
    carpeta = await mkdtemp(join(tmpdir(), "kanna-cv-"));
    const ruta = join(carpeta, `documento.${extension}`);
    await writeFile(ruta, new Uint8Array(await archivo.arrayBuffer()), {
      mode: 0o600,
    });
    const { stdout } = await ejecutar(
      process.execPath,
      ["--max-old-space-size=192", join(process.cwd(), "scripts/leer-hoja-vida.mjs"), ruta, extension],
      {
        timeout: 15000,
        maxBuffer: 256 * 1024,
        encoding: "utf8",
        env: { PATH: process.env.PATH ?? "", NODE_ENV: process.env.NODE_ENV },
      },
    );
    const leido = JSON.parse(stdout) as { texto: string };
    if (leido.texto.trim().length < 40) throw Error("sin-texto");
    await supabase.rpc("cerrar_uso_ia", { uso, resultado: "correcto" });
    return { texto: leido.texto.slice(0, 12000) };
  } catch {
    await supabase.rpc("cerrar_uso_ia", { uso, resultado: "error" });
    return {
      error:
        "No pudimos extraer el texto. Si es un PDF escaneado, prueba una versión con texto o cuenta tu historia escribiendo o hablando.",
    };
  } finally {
    lectores--;
    if (carpeta) await rm(carpeta, { recursive: true, force: true });
  }
}
