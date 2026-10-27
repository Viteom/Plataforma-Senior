// Campos públicos de la organización y del contacto responsable; sin credenciales ni datos clínicos.
export function leerEmpresa(d: FormData) {
  const text = (key: string, max: number) =>
    String(d.get(key) ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  const datos = {
    nombre: text("nombre", 120),
    nit: text("nit", 10),
    sector: text("sector", 80),
    tamano: text("tamano", 40),
    ciudad: text("ciudad", 80),
    contacto: text("contacto", 120),
    correo_contacto: text("correo_contacto", 254),
    telefono_contacto: text("telefono_contacto", 20),
    cargo_contacto: text("cargo_contacto", 100),
    descripcion: text("descripcion", 1000),
    sitio_web: text("sitio_web", 500) || null,
    brandbook_url: text("brandbook_url", 500) || null,
    zona_local: text("ciudad_sector", 100) || null,
    compromiso_bienestar: d.get("compromiso_bienestar") === "si",
  };
  if (
    datos.nombre.length < 2 ||
    !/^\d{9,10}$/.test(datos.nit) ||
    datos.ciudad.length < 2 ||
    datos.contacto.length < 2 ||
    datos.sector.length < 2 ||
    datos.cargo_contacto.length < 2 ||
    datos.descripcion.length < 20
  )
    return {
      error:
        "Completa el nombre, NIT sin dígito de verificación, sector, ciudad, contacto, cargo y descripción de la organización.",
    };
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo_contacto) ||
    !/^\+?[\d\s()-]{7,20}$/.test(datos.telefono_contacto)
  )
    return { error: "Revisa el correo y teléfono de contacto." };
  for (const url of [datos.sitio_web, datos.brandbook_url]) {
    if (!url) continue;
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
    } catch {
      return {
        error:
          "Los enlaces de sitio web y manual de marca deben empezar por https:// y no incluir claves.",
      };
    }
  }
  if (!datos.compromiso_bienestar)
    return { error: "Confirma el compromiso de trato digno y acompañamiento." };
  return { datos };
}
