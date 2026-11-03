// Las voces son locales. IA, extracción de documentos y clientes con llaves privadas se ejecutan
// en el servidor, así que el navegador no necesita conectarse a sus proveedores.
export function cabecerasSeguridad(produccion: boolean, supabaseUrl: string) {
  let origen = "";
  try { origen = new URL(supabaseUrl).origin; } catch { /* demostración sin Supabase */ }
  const socket = origen.replace(/^http/, "ws");
  const politica = [
    "default-src 'self'",
    // Next utiliza scripts en línea para hidratación; esta política no sustituye una CSP con
    // nonces. En desarrollo también necesita eval. El resto de orígenes sigue cerrado.
    `script-src 'self' 'unsafe-inline'${produccion ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://images.pexels.com ${origen}`,
    "font-src 'self' data:",
    `connect-src 'self' ${origen} ${socket}`,
    `media-src 'self' blob: ${origen}`,
    "worker-src 'self' blob:",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    ...(produccion ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: politica },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
    ...(produccion ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
  ];
}
