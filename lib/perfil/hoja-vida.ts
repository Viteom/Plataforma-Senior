import { prepararHistoria } from "@/lib/ia/preparar";
// Solo se conserva experiencia revisable, nunca los documentos originales. No se infiere capacidad.
export function experienciaHojaVida(texto: string, nombre?: string) {
  const lineas = texto
    .split(/[\r\n]+/)
    .filter(
      (l) =>
        !/(nacimiento|nac[ií] (en|el)|pensi[oó]n|estado civil|diagn[oó]st|historia cl[ií]nica|medicamento|tipo de sangre|EPS:|salud:)/i.test(
          l,
        ),
    );
  return prepararHistoria(lineas.join("\n"), nombre).texto.slice(0, 6000);
}
