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