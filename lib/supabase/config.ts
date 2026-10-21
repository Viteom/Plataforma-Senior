// Sin estas variables la app corre en modo demostración: sin inicio de sesión ni protección
// de rutas, con datos de ejemplo. Así sigue funcionando el despliegue mientras no hay cuentas.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
