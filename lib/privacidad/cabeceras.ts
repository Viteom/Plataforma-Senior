// Las voces son locales. IA, extracción de documentos y clientes con llaves privadas se ejecutan
// en el servidor, así que el navegador no necesita conectarse a sus proveedores.
// Política de contenido. Con «nonce» (páginas privadas, desde el middleware) solo corren los
// scripts de la propia app y los que llevan ese identificador de un solo uso: un script inyectado
// en la página no corre. Sin nonce (páginas públicas, que se sirven ya armadas y no pueden llevar
// un identificador por visita) se permiten scripts en línea, que Next necesita para hidratar.
export function politicaContenido(produccion: boolean, supabaseUrl: string, nonce?: string) {
  let origen = "";
  try { origen = new URL(supabaseUrl).origin; } catch { /* demostración sin Supabase */ }
  const socket = origen.replace(/^http/, "ws");
  const scripts = nonce ? `'self' 'nonce-${nonce}'` : "'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    // En desarrollo Next también necesita eval. El resto de orígenes sigue cerrado.
    `script-src ${scripts}${produccion ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://images.pexels.com ${origen}`,
    "font-src 'self' data:",
    `connect-src 'self' ${origen} ${socket}`,
    `media-src 'self' blob: ${origen}`,
    "worker-src 'self' blob:",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ...(produccion ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function cabecerasSeguridad(produccion: boolean, supabaseUrl: string) {
  return [
    { key: "Content-Security-Policy", value: politicaContenido(produccion, supabaseUrl) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
    ...(produccion ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
  ];
}
