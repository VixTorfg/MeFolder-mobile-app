
/** Información de un archivo en el file system */
export interface FSFileInfo {
  /** URI del archivo */
  uri: string;
  /** Nombre del archivo (con extensión) */
  name: string;
  /** Extensión del archivo */
  extension: string;
  /** Existe en disco */
  exists: boolean;
  /** Tamaño en bytes */
  size: number;
  /** Fecha de última modificación (ms desde epoch) */
  modificationTime: number | null;
  /** Fecha de creación (ms desde epoch, puede ser null en Android < API 26) */
  creationTime: number | null;
  /** Hash MD5 del archivo */
  md5: string | null;
  /** Tipo MIME */
  mimeType: string;
}

/** Información de un directorio en el file system */
export interface FSDirectoryInfo {
  /** URI del directorio */
  uri: string;
  /** Nombre del directorio */
  name: string;
  /** Existe en disco */
  exists: boolean;
  /** Tamaño total en bytes */
  size: number | null;
  /** Fecha de última modificación */
  modificationTime?: number | undefined;
  /** Fecha de creación */
  creationTime?: number | undefined;
}

/** Entrada al listar contenido de un directorio */
export interface FSDirectoryEntry {
  /** Nombre del elemento */
  name: string;
  /** URI completa */
  uri: string;
  /** Es directorio */
  isDirectory: boolean;
  /** Tamaño en bytes (solo archivos) */
  size?: number | undefined;
}

/** Opciones para copiar archivos/carpetas */
export interface FSCopyOptions {
  /** URI origen */
  from: string;
  /** URI o directorio destino */
  to: string;
}

/** Opciones para mover archivos/carpetas */
export interface FSMoveOptions {
  /** URI origen */
  from: string;
  /** URI o directorio destino */
  to: string;
}

/** Opciones para renombrar un archivo/carpeta */
export interface FSRenameOptions {
  /** URI actual del elemento */
  uri: string;
  /** Nuevo nombre (solo nombre, no ruta completa) */
  newName: string;
}

/** Opciones para crear directorio */
export interface FSMakeDirectoryOptions {
  /** URI del directorio a crear */
  uri: string;
  /** Crear directorios intermedios (default: false) */
  intermediates?: boolean | undefined;
  /** No lanzar error si ya existe (default: false) */
  idempotent?: boolean | undefined;
}

/** Resultado genérico de una operación del file system */
export interface FSOperationResult<T = void> {
  /** Operación exitosa */
  success: boolean;
  /** Datos resultantes (si aplica) */
  data?: T | undefined;
  /** Mensaje de error (si falló) */
  error?: string | undefined;
  /** URI del elemento afectado */
  uri?: string | undefined;
}

/** Resultado de una operación de copia/movimiento */
export interface FSTransferResult {
  /** Operación exitosa */
  success: boolean;
  /** URI origen */
  fromUri: string;
  /** URI destino */
  toUri: string;
  /** Mensaje de error */
  error?: string | undefined;
}

/** Resultado de operaciones batch */
export interface FSBatchResult {
  /** Total de operaciones intentadas */
  total: number;
  /** Operaciones exitosas */
  succeeded: number;
  /** Operaciones fallidas */
  failed: number;
  /** Detalle de errores por URI */
  errors: { uri: string; error: string }[];
}

/** Estado de una operación del file system */
export interface FSOperationState<T = void> {
  /** Operación en progreso */
  loading: boolean;
  /** Error de la última operación */
  error: string | null;
  /** Datos resultantes */
  data: T | null;
}


/** Tipo de encoding para escritura de archivos */
export type FSEncoding = 'utf8' | 'base64';

/** Opciones de escritura de archivo */
export interface FSWriteOptions {
  uri: string;
  content: string | Uint8Array;
  encoding?: FSEncoding | undefined;
}
