// Carga nominal de acuerdos vigentes; no son horas trabajadas ni una medida de capacidad.
export function fechaColombia(ahora = new Date()) {
  return new Date(ahora.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
}
export type AcuerdoConHoras = {
  estado: string;
  acuerdo_horas_semana?: number | null;
  acuerdo_inicio?: string | null;
};
export function acuerdosActuales<T extends AcuerdoConHoras>(
  procesos: T[],
  fecha = fechaColombia(),
): T[] {
  return procesos.filter(
    (p) =>
      p.estado === "en_curso" &&
      (!p.acuerdo_inicio || p.acuerdo_inicio.slice(0, 10) <= fecha),
  );
}
export function resumenCarga(
  meta: number,
  procesos: AcuerdoConHoras[],
  fecha = fechaColombia(),
) {
  const activos = acuerdosActuales(procesos, fecha);
  const horas = activos.reduce(
    (s, p) => s + Number(p.acuerdo_horas_semana ?? 0),
    0,
  );
  return {
    horas,
    sinHoras: activos.filter((p) => p.acuerdo_horas_semana == null).length,
    futuros: procesos.filter(
      (p) =>
        p.estado === "en_curso" &&
        p.acuerdo_inicio &&
        p.acuerdo_inicio.slice(0, 10) > fecha,
    ).length,
    porcentaje: meta > 0 ? Math.min(100, Math.round((horas / meta) * 100)) : 0,
    mensaje:
      meta === 0
        ? "Elegiste una pausa. Revisa tus acuerdos activos con el equipo."
        : horas > meta
          ? "Tus acuerdos superan el tiempo que elegiste. Puedes pedir un ajuste."
          : horas === meta
            ? "Tus acuerdos alcanzan el límite que elegiste. Guarda espacio para descansar."
            : "Tu ritmo lo decides tú. No necesitas llenar todas tus horas.",
  };
}
export type CargaAcuerdo = {
  fecha: string;
  horas_previas: number;
  horas_nuevas: number | null;
  total: number;
  sin_horas: number;
  limite: number | null;
  requiere_confirmacion: boolean;
  token: string;
};
