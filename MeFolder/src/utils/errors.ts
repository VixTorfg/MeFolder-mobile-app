type PatternEntry = [RegExp, (match: RegExpMatchArray) => string];

const EXACT_MESSAGES: [string, string][] = [
  [
    "No se puede eliminar una carpeta del sistema",
    "Las carpetas del sistema no se pueden eliminar.",
  ],
  [
    "No se puede eliminar una carpeta protegida",
    "Esta carpeta está protegida y no puede eliminarse.",
  ],
  [
    "No se puede renombrar una carpeta del sistema",
    "Las carpetas del sistema no se pueden renombrar.",
  ],
  [
    "No se puede mover una carpeta dentro de sí misma",
    "No puedes mover una carpeta dentro de sí misma.",
  ],
  [
    "No se puede mover a carpeta eliminada",
    "No puedes mover elementos a una carpeta que está en la papelera.",
  ],
  [
    "No se puede crear subcarpeta en carpeta eliminada",
    "No puedes crear carpetas dentro de una carpeta eliminada.",
  ],
  [
    "La carpeta ya está en esa ubicación",
    "La carpeta ya se encuentra en esa ubicación.",
  ],
  [
    "El archivo ya está en esa carpeta",
    "El archivo ya se encuentra en esa carpeta.",
  ],
  [
    "El portapapeles contiene elementos que ya no existen o fueron eliminados",
    "Algunos elementos del portapapeles ya no existen o fueron eliminados.",
  ],
  [
    "El nombre del archivo no puede estar vacío",
    "El nombre no puede estar vacío.",
  ],
  [
    "Error al copiar el archivo",
    "No se pudo copiar el archivo. Verifica que existe y que hay espacio suficiente.",
  ],
];

const PATTERN_MESSAGES: PatternEntry[] = [
  [
    /Ya existe una carpeta con el nombre "(.+)" en este nivel/,
    (m) =>
      `Ya existe una carpeta llamada "${m[1]}" en esta ubicación. Usa un nombre diferente.`,
  ],
  [
    /Ya existe un archivo con el nombre "(.+)" en esta carpeta/,
    (m) =>
      `Ya existe un archivo llamado "${m[1]}" en esta carpeta. Usa un nombre diferente.`,
  ],
  [
    /El nombre del archivo no puede superar (\d+) caracteres/,
    (m) => `El nombre es demasiado largo. El máximo permitido es ${m[1]} caracteres.`,
  ],
];

function mapRawMessage(raw: string): string | null {
  for (const [needle, friendly] of EXACT_MESSAGES) {
    if (raw.includes(needle)) return friendly;
  }
  for (const [pattern, builder] of PATTERN_MESSAGES) {
    const match = raw.match(pattern);
    if (match) return builder(match);
  }
  return null;
}

export function getFriendlyErrorMessage(
  error: unknown,
  fallback = "Ha ocurrido un error inesperado. Inténtalo de nuevo.",
): string {
  const raw = error instanceof Error ? error.message : String(error);
  return mapRawMessage(raw) ?? fallback;
}

/** Para errores de importación que ya vienen como string (MediaImportFailure.error) */
export function getFriendlyImportError(errorStr: string): string {
  return mapRawMessage(errorStr) ?? errorStr;
}
