// Compartido por la salida del navegador y la activación del service worker. Las precachés
// solo contienen recursos de compilación; se eliminan todas las cachés de respuestas de red.
export async function borrarCachesPrivadas() {
  if (typeof caches === "undefined") return;
  const nombres = await caches.keys();
  await Promise.all(nombres.filter(n => !n.includes("precache")).map(n => caches.delete(n)));
}

export async function cerrarSesionLocal(accion: () => Promise<void>) {
  try { await borrarCachesPrivadas(); }
  catch { /* Un fallo del almacenamiento no puede impedir cerrar la sesión de Auth. */ }
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  await accion();
}
