import {
  Tags,
  BadgeCheck,
  BookOpen,
  Building2,
  ClipboardCheck,
  Compass,
  FileCheck,
  Handshake,
  Heart,
  House,
  Inbox,
  LayoutList,
  LifeBuoy,
  Search,
  SlidersHorizontal,
  Sprout,
  UserRound,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

// «corta»: la etiqueta de la barra inferior en celular. Con cinco destinos cabe una palabra.
export type ItemNav = {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  corta?: string;
};

// Talento: barra inferior, máximo 4 destinos.
export const navTalento: ItemNav[] = [
  { href: "/inicio", etiqueta: "Inicio", icono: House },
  { href: "/oportunidades", etiqueta: "Oportunidades", icono: Handshake },
  { href: "/mi-perfil", etiqueta: "Mi perfil", icono: UserRound },
  { href: "/aprende", etiqueta: "Aprende", icono: BookOpen },
];

export const navEmpresa: ItemNav[] = [
  {
    href: "/empresa/explorar",
    etiqueta: "Explorar perfiles",
    icono: Compass,
    corta: "Explorar",
  },
  {
    href: "/empresa/problema/nuevo",
    etiqueta: "Contar un reto",
    icono: Search,
    corta: "Un reto",
  },
  {
    href: "/empresa/campo",
    etiqueta: "Talento del campo",
    icono: Sprout,
    corta: "Campo",
  },
  {
    href: "/empresa/procesos",
    etiqueta: "Mis procesos",
    icono: LayoutList,
    corta: "Procesos",
  },
];

// En celular, la organización usa la misma barra inferior que el talento, con «Mi empresa» al final.
export const navEmpresaCelular: ItemNav[] = [
  ...navEmpresa,
  {
    href: "/empresa/datos",
    etiqueta: "Mi empresa",
    icono: Building2,
    corta: "Empresa",
  },
];

// Equipo: menú por áreas. El número de pendientes de cada destino lo calcula el layout del panel.
export const inicioEquipo: ItemNav = { href: "/equipo", etiqueta: "Inicio", icono: House };

export const gruposEquipo: { titulo: string; items: ItemNav[] }[] = [
  {
    titulo: "Retos y acuerdos",
    items: [
      { href: "/equipo/curaduria", etiqueta: "Curaduría de retos", icono: ClipboardCheck },
      { href: "/equipo/condiciones", etiqueta: "Condiciones de acuerdos", icono: FileCheck },
      { href: "/equipo/semaforo", etiqueta: "Reglas del semáforo", icono: SlidersHorizontal },
    ],
  },
  {
    titulo: "Personas",
    items: [
      { href: "/equipo/bienestar", etiqueta: "Bienestar", icono: Heart },
      { href: "/equipo/ayuda", etiqueta: "Solicitudes de ayuda", icono: Inbox },
      { href: "/equipo/evidencias", etiqueta: "Evidencias y tarifas", icono: BadgeCheck },
      { href: "/equipo/etiquetas", etiqueta: "Etiquetas nuevas", icono: Tags },
      { href: "/equipo/experiencias", etiqueta: "Talento del campo", icono: Sprout },
      // ?desde=equipo: en la demostración muestra el enlace de vuelta al panel.
      { href: "/gestor/registrar?desde=equipo", etiqueta: "Registro asistido", icono: UserRoundPlus },
    ],
  },
  {
    titulo: "Organizaciones",
    items: [{ href: "/equipo/empresas", etiqueta: "Organizaciones y reportes", icono: Building2 }],
  },
];

export const iconoAyuda = LifeBuoy;

// Un destino está activo si es la ruta exacta o una subruta (salvo la raíz de un área).
export function estaActivo(pathname: string, href: string, raices: string[] = []) {
  if (raices.includes(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
