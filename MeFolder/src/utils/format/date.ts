/**
 * Devuelve una fecha formateada como una cadena de texto en el formato dd/MM/yyyy.
 * @param date Fecha a formatear en tipo `Date`
 * @returns Fecha formateada como una cadena de texto (dd/MM/yyyy)
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Devuelve una duración de video formateada como una cadena de texto en el formato mm:ss.
 * @param durationInSeconds Duración en segundos del video
 * @returns Duración formateada como una cadena de texto (mm:ss)
 */
export const formatVideoDuration = (durationInSeconds: number | null | undefined): string => {
  if (durationInSeconds === null || durationInSeconds === undefined || durationInSeconds < 0) {
    return '--:--';
  }
  
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}