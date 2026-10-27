// Solo rutas canónicas del perfil. Nunca se decodifican ni normalizan rutas proporcionadas por usuarios.
export function rutaFotoValida(
  perfil: string,
  ruta: string | null | undefined,
): ruta is string {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      perfil,
    ) &&
    typeof ruta === "string" &&
    ruta.startsWith(`${perfil}/`) &&
    /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(ruta.slice(perfil.length + 1))
  );
}
