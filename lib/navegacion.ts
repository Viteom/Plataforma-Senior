import {
  Tags,
  BadgeCheck,
  BookOpen,
  Building2,
  ClipboardList,
  Compass,
  Handshake,
  House,
  Inbox,
  LayoutList,
  LifeBuoy,
  Search,
  Sprout,
  UserRound,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

export type ItemNav = { href: string; etiqueta: string; icono: LucideIcon };

// Talento: barra inferior, máximo 4 destinos.
export const navTalento: ItemNav[] = [
  { href: "/inicio", etiqueta: "Inicio", icono: House },
  { href: "/oportunidades", etiqueta: "Oportunidades", icono: Handshake },
  { href: "/mi-perfil", etiqueta: "Mi perfil", icono: UserRound },
  { href: "/aprende", etiqueta: "Aprende", icono: BookOpen },
];

export const navEmpresa: ItemNav[] = [
  { href: "/empresa/explorar", etiqueta: "Explorar perfiles", icono: Compass },
  { href: "/empresa/problema/nuevo", etiqueta: "Buscar por un problema", icono: Search },
  { href: "/empresa/campo", etiqueta: "Talento del campo", icono: Sprout },
  { href: "/empresa/procesos", etiqueta: "Mis procesos", icono: LayoutList },
];

export const navEquipo: ItemNav[] = [
  { href: "/equipo", etiqueta: "Curaduría", icono: ClipboardList },
  { href: "/equipo/empresas", etiqueta: "Empresas y reportes", icono: Building2 },
  { href: "/equipo/evidencias", etiqueta: "Evidencias y tarifas", icono: BadgeCheck },
  { href: "/equipo/etiquetas", etiqueta: "Etiquetas nuevas", icono: Tags },
  { href: "/equipo/experiencias", etiqueta: "Talento del campo", icono: Sprout },
  { href: "/equipo/ayuda", etiqueta: "Solicitudes de ayuda", icono: Inbox },
  { href: "/gestor/registrar", etiqueta: "Registro asistido", icono: UserRoundPlus },
];

export const iconoAyuda = LifeBuoy;

// Un destino está activo si es la ruta exacta o una subruta (salvo la raíz de un área).
export function estaActivo(pathname: string, href: string, raices: string[] = []) {
  if (raices.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
