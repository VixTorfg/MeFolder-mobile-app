
/** Resultado genérico de una operación de media */
export interface MediaOperationResult<T = void> {
  /** Operación exitosa */
  success: boolean;
  /** Datos resultantes (si aplica) */
  data?: T | undefined;
  /** Mensaje de error (si falló) */
  error?: string | undefined;
  /** URI del elemento procesado */
  uri?: string | undefined;
}

/** Metadatos extraídos de un archivo de video */
export interface MediaVideoMetadata {
  /** Duración en segundos */
  duration: number;
  /** Ancho en píxeles */
  width: number;
  /** Alto en píxeles */
  height: number;
}

/** Metadatos extraídos de un archivo de audio */
export interface MediaAudioMetadata {
  /** Duración en segundos */
  duration: number;
}

/** Metadatos extraídos de un archivo de imagen */
export interface MediaImageMetadata {
  /** Ancho en píxeles */
  width: number;
  /** Alto en píxeles */
  height: number;
}
