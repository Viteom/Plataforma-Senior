export type Rol = "talento" | "empresa" | "curador" | "gestor" | "admin";

// A dónde llega cada rol al entrar.
export function inicioDe(rol: Rol): string {
  switch (rol) {
    case "empresa":
      return "/empresa/explorar";
    case "curador":
    case "admin":
      return "/equipo";
    case "gestor":
      return "/gestor/registrar";
    default:
      return "/inicio";
  }
}

// Rutas abiertas sin sesión. Ayuda está siempre disponible (regla 6).
const PUBLICAS = [
  "/",
  "/entrar",
  "/ayuda",
  "/sin-conexion",
  "/privacidad",
  // Web informativa
  "/talento",
  "/organizaciones",
  "/campo",
  "/confianza",
];

const AREAS: { prefijos: string[]; roles: Rol[] }[] = [
  { prefijos: ["/empresa"], roles: ["empresa", "admin"] },
  { prefijos: ["/equipo"], roles: ["curador", "admin"] },
  { prefijos: ["/gestor"], roles: ["gestor", "admin"] },
  {
    prefijos: ["/inicio", "/oportunidades", "/mi-perfil", "/aprende", "/emprende", "/perfil", "/huella"],
    roles: ["talento", "admin"],
  },
];

const coincide = (pathname: string, prefijo: string) =>
  pathname === prefijo || pathname.startsWith(`${prefijo}/`);

export function esPublica(pathname: string) {
  return PUBLICAS.some((p) => (p === "/" ? pathname === "/" : coincide(pathname, p)));
}

// Devuelve a dónde redirigir, o null si puede seguir.
export function decidirRuta(pathname: string, rol: Rol | null): string | null {
  // Con sesión, la pantalla de entrar no tiene sentido: va a su inicio.
  if (rol && coincide(pathname, "/entrar")) return inicioDe(rol);
  if (esPublica(pathname)) return null;

  const area = AREAS.find((a) => a.prefijos.some((p) => coincide(pathname, p)));
  // Rutas que no pertenecen a ningún área (por ejemplo, una que no existe): que responda Next
  // con su página de "no encontrada", sin pedir sesión.
  if (!area) return null;
  if (!rol) return "/entrar";
  return area.roles.includes(rol) ? null : inicioDe(rol);
}
