import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de servidor con la sesión del usuario (cookies). Las llaves privadas
// (service role, Twilio, Claude…) nunca pasan por aquí ni llevan prefijo NEXT_PUBLIC_.
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (lista) => {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: el middleware del hito 2 refresca la sesión.
          }
        },
      },
    },
  );
}
