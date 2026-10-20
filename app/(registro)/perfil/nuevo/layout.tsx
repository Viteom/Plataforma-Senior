import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cree su perfil" };

// La página es de cliente: el título de la pestaña se define aquí.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
