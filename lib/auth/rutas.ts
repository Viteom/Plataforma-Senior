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
    prefijos: ["/inicio", "/bienestar", "/oportunidades", "/mi-perfil", "/aprende", "/emprende", "/perfil", "/huella"],
    roles: ["talento", "admin"],
  },
];

const coincide = (pathname: string, prefijo: string) => pathname === prefijo || pathname.startsWith(`${prefijo}/`);

export function esPublica(pathname: string) {
  return PUBLICAS.some((p) => (p === "/" ? pathname === "/" : coincide(pathname, p)));
}

// Curaduría y administración solo tienen permisos tras el segundo factor (la base lo exige con
// mi_rol()). Mientras tanto, su única puerta es la entrada del equipo.
export const ENTRADA_EQUIPO = "/equipo/entrar";
export const esRolEquipo = (rol: Rol | null) => rol === "curador" || rol === "admin";

// Devuelve a dónde redirigir, o null si puede seguir.
export function decidirRuta(pathname: string, rol: Rol | null, segundoFactor = false): string | null {
  if (coincide(pathname, ENTRADA_EQUIPO)) {
    if (!rol) return null;
    if (!esRolEquipo(rol)) return inicioDe(rol);
    return segundoFactor ? inicioDe(rol) : null;
  }
  // Con sesión, la pantalla de entrar no tiene sentido: va a su inicio.
  if (rol && coincide(pathname, "/entrar")) return inicioDe(rol);
  if (esPublica(pathname)) return null;
  if (esRolEquipo(rol) && !segundoFactor) return ENTRADA_EQUIPO;

  const area = AREAS.find((a) => a.prefijos.some((p) => coincide(pathname, p)));
  // Rutas que no pertenecen a ningún área (por ejemplo, una que no existe): que responda Next
  // con su página de "no encontrada", sin pedir sesión.
  if (!area) return null;
  if (!rol) return area.prefijos.includes("/equipo") ? ENTRADA_EQUIPO : "/entrar";
  return area.roles.includes(rol) ? null : inicioDe(rol);
}
