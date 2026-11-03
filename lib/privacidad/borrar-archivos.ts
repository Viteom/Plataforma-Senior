import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// El id llega de sesion(), nunca del formulario. Se recorre únicamente su carpeta en cada bucket,
// incluidos archivos huérfanos y subcarpetas. Un fallo deja el perfil disponible para reintentar.
export async function borrarArchivosPerfil(admin: SupabaseClient, perfil: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(perfil)) throw new Error("perfil inválido");
  let leidos = 0;
  for (const bucket of ["evidencias", "fotos", "historias", "autorizaciones"]) {
    const api = admin.storage.from(bucket);
    async function limpiar(prefijo: string): Promise<void> {
      for (;;) {
        const { data, error } = await api.list(prefijo, { limit: 100, offset: 0 });
        if (error || !data) throw new Error("No se pudo comprobar Storage");
        if (!data.length) return;
        leidos += data.length;
        if (leidos > 10_000) throw new Error("Reintentar limpieza");
        const archivos: string[] = [];
        for (const archivo of data) {
          if (!archivo.name || archivo.name.includes("/") || archivo.name === "." || archivo.name === "..") throw new Error("ruta inválida");
          const ruta = `${prefijo}/${archivo.name}`;
          if (archivo.id) archivos.push(ruta);
          else await limpiar(ruta);
        }
        if (archivos.length) {
          const { error: fallo } = await api.remove(archivos);
          if (fallo) throw new Error("No se pudo limpiar Storage");
        }
        // Se vuelve a leer desde cero: al eliminar desaparecen las filas y el offset saltaría archivos.
      }
    }
    await limpiar(perfil);
  }
}
