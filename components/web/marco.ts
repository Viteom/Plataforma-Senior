// Un solo par de márgenes para toda la web: 16 px en celular, 32 px desde tableta.
export const MARCO = "mx-auto w-full max-w-web px-4 md:px-8";

// Retraso escalonado para las partes de una sección (60–90 ms entre una y otra).
export const retraso = (i: number) => ({ "--retraso": `${i * 80}ms` }) as React.CSSProperties;
