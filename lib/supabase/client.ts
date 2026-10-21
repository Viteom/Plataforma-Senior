import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Cliente del navegador: solo usa la llave pública. Todo lo protegido depende de RLS.
export function crearClienteNavegador() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
