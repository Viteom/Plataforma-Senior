import { createBrowserClient } from "@supabase/ssr";

// Cliente del navegador: solo usa la llave pública. Todo lo protegido depende de RLS.
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
