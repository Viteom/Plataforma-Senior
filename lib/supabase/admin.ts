import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "./config";

// Cliente con la llave de servicio: salta RLS. Solo para lo que la persona no puede hacer con su
// propia sesión (por ejemplo, borrar su usuario de Auth). Devuelve null si la llave no está.
export function crearClienteAdmin() {
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !llave) return null;
  return createClient(SUPABASE_URL, llave, { auth: { persistSession: false, autoRefreshToken: false } });
}
