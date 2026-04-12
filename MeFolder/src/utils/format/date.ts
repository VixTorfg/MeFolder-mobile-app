/**
 * Devuelve una fecha formateada como una cadena de texto en el formato dd/MM/yyyy.
 * @param date Fecha a formatear en tipo `Date`
 * @returns Fecha formateada como una cadena de texto (dd/MM/yyyy)
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Devuelve una duración de video formateada como una cadena de texto en el formato mm:ss.
 * @param durationInSeconds Duración en segundos del video
 * @returns Duración formateada como una cadena de texto (mm:ss)
 */
export const formatVideoDuration = (
  durationInSeconds: number | null | undefined,
): string => {
  if (
    durationInSeconds === null ||
    durationInSeconds === undefined ||
    durationInSeconds < 0
  ) {
    return "--:--";
  }

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export function formatAudioDuration(durationInSeconds: number): string {
  if (
    !isFinite(durationInSeconds) ||
    isNaN(durationInSeconds) ||
    durationInSeconds < 0
  ) {
    return "0:00";
  }

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);

  const basicTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  if (hours > 0) {
    return `${hours}:${basicTime}`;
  }

  return `${basicTime}`;
}

/**
 * Devuelve una fecha y hora formateada como una cadena de texto "dia de la semana, dd de mes de yyyy, hh:mm:ss".
 * @param date Fecha a formatear en tipo `Date`
 * @returns Fecha y hora formateada como una cadena de texto
 */

export const formatFullDateTime = (date: Date): string => {
  return date.toLocaleString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
