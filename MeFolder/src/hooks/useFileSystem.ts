import { useState, useCallback, useRef } from 'react';
import { FileSystemService } from '@/services';
import type {
  FSFileInfo,
  FSDirectoryInfo,
  FSDirectoryEntry,
  FSCopyOptions,
  FSMoveOptions,
  FSTransferResult,
  FSBatchResult,
  FSEncoding,
} from '@/types/filesystem';

interface OperationState {
  loading: boolean;
  error: string | null;
}

interface UseFileSystemReturn {
  /** Estado de carga (true durante operaciones async como read/download) */
  loading: boolean;
  /** Error de la última operación (null si fue exitosa) */
  error: string | null;
  /** Limpia el error actual */
  clearError: () => void;

  /** Obtiene info detallada de un archivo */
  getFileInfo: (uri: string) => FSFileInfo | null;
  /** Obtiene info de un directorio */
  getDirectoryInfo: (uri: string) => FSDirectoryInfo | null;
  /** Comprueba si un archivo existe */
  fileExists: (uri: string) => boolean;
  /** Comprueba si un directorio existe */
  directoryExists: (uri: string) => boolean;
  /** Lista contenido de un directorio */
  listDirectory: (uri: string) => FSDirectoryEntry[];

  /** Crea un directorio */
  makeDirectory: (uri: string, options?: { intermediates?: boolean; idempotent?: boolean }) => boolean;
  /** Asegura que un directorio exista */
  ensureDirectory: (uri: string) => boolean;


  /** Copia un archivo */
  copyFile: (from: string, to: string) => FSTransferResult;
  /** Copia un directorio */
  copyDirectory: (from: string, to: string) => FSTransferResult;
  /** Copia múltiples archivos */
  copyBatch: (items: FSCopyOptions[]) => FSBatchResult;


  /** Mueve un archivo */
  moveFile: (from: string, to: string) => FSTransferResult;
  /** Mueve un directorio */
  moveDirectory: (from: string, to: string) => FSTransferResult;
  /** Mueve múltiples archivos */
  moveBatch: (items: FSMoveOptions[]) => FSBatchResult;

  
  /** Elimina un archivo */
  deleteFile: (uri: string) => boolean;
  /** Elimina un directorio y su contenido */
  deleteDirectory: (uri: string) => boolean;
  /** Elimina múltiples archivos */
  deleteBatch: (uris: string[]) => FSBatchResult;


  /** Renombra un archivo */
  renameFile: (uri: string, newName: string) => FSTransferResult;
  /** Renombra un directorio */
  renameDirectory: (uri: string, newName: string) => FSTransferResult;

  
  /** Lee archivo como texto (async) */
  readAsText: (uri: string) => Promise<string | null>;
  /** Lee archivo como base64 (async) */
  readAsBase64: (uri: string) => Promise<string | null>;
  /** Escribe contenido en un archivo */
  writeFile: (uri: string, content: string | Uint8Array, encoding?: FSEncoding) => boolean;

  
  /** Descarga un archivo desde URL (async) */
  downloadFile: (url: string, destinationUri: string, options?: {
    headers?: Record<string, string>;
    overwrite?: boolean;
  }) => Promise<FSFileInfo | null>;

  
  /** Resuelve ruta relativa contra documentDirectory */
  resolveUri: (relativePath: string) => string;
  /** Extrae nombre de archivo de una URI */
  getFileName: (uri: string) => string;
  /** Extrae extensión de archivo */
  getExtension: (uri: string) => string;
  /** Obtiene URI del directorio padre */
  getParentUri: (uri: string) => string;
  /** Genera URI única para evitar colisiones */
  generateUniqueUri: (baseUri: string) => string;
  /** URI base del directorio de documentos */
  baseUri: string;
  /** Espacio total del dispositivo en bytes */
  getTotalDiskSpace: () => number;
  /** Espacio disponible en bytes */
  getAvailableDiskSpace: () => number;
}

/**
 * Hook que expone operaciones del sistema de archivos con manejo de estado.
 * 
 * - Operaciones síncronas (move, copy, delete, rename, etc.) ejecutan directamente
 *   y actualizan `error` si fallan.
 * - Operaciones async (read, download) actualizan `loading` y `error`.
 * 
 * @example
 * ```tsx
 * const { moveFile, copyFile, deleteFile, error } = useFileSystem();
 * 
 * const handleMove = () => {
 *   const result = moveFile(fromUri, toUri);
 *   if (result.success) {
 *     console.log('Movido a:', result.toUri);
 *   }
 * };
 * ```
 */
export const useFileSystem = (): UseFileSystemReturn => {
  const [state, setState] = useState<OperationState>({ loading: false, error: null });
  const serviceRef = useRef(new FileSystemService());
  const fs = serviceRef.current;

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => setError(null), [setError]);

  /** Wrapper para operaciones async con loading state */
  const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setState({ loading: true, error: null });
    try {
      const result = await operation();
      setState({ loading: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setState({ loading: false, error: message });
      throw err;
    }
  }, []);

  const getFileInfo = useCallback((uri: string): FSFileInfo | null => {
    const result = fs.getFileInfo(uri);
    if (!result.success) {
      setError(result.error ?? null);
      return null;
    }
    setError(null);
    return result.data ?? null;
  }, [fs, setError]);

  const getDirectoryInfo = useCallback((uri: string): FSDirectoryInfo | null => {
    const result = fs.getDirectoryInfo(uri);
    if (!result.success) {
      setError(result.error ?? null);
      return null;
    }
    setError(null);
    return result.data ?? null;
  }, [fs, setError]);

  const fileExists = useCallback((uri: string): boolean => {
    return fs.fileExists(uri);
  }, [fs]);

  const directoryExists = useCallback((uri: string): boolean => {
    return fs.directoryExists(uri);
  }, [fs]);

  const listDirectory = useCallback((uri: string): FSDirectoryEntry[] => {
    const result = fs.listDirectory(uri);
    if (!result.success) {
      setError(result.error ?? null);
      return [];
    }
    setError(null);
    return result.data ?? [];
  }, [fs, setError]);

  const makeDirectory = useCallback((
    uri: string,
    options?: { intermediates?: boolean; idempotent?: boolean },
  ): boolean => {
    const result = fs.makeDirectory({
      uri,
      intermediates: options?.intermediates,
      idempotent: options?.idempotent,
    });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result.success;
  }, [fs, setError]);

  const ensureDirectory = useCallback((uri: string): boolean => {
    const result = fs.ensureDirectory(uri);
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result.success;
  }, [fs, setError]);

  const copyFile = useCallback((from: string, to: string): FSTransferResult => {
    const result = fs.copyFile({ from, to });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result;
  }, [fs, setError]);

  const copyDirectory = useCallback((from: string, to: string): FSTransferResult => {
    const result = fs.copyDirectory({ from, to });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result;
  }, [fs, setError]);

  const copyBatch = useCallback((items: FSCopyOptions[]): FSBatchResult => {
    const result = fs.copyBatch(items);
    if (result.failed > 0) {
      setError(`${result.failed} de ${result.total} copias fallaron`);
    } else {
      setError(null);
    }
    return result;
  }, [fs, setError]);

  const moveFile = useCallback((from: string, to: string): FSTransferResult => {
    const result = fs.moveFile({ from, to });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result;
  }, [fs, setError]);

  const moveDirectory = useCallback((from: string, to: string): FSTransferResult => {
    const result = fs.moveDirectory({ from, to });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result;
  }, [fs, setError]);

  const moveBatch = useCallback((items: FSMoveOptions[]): FSBatchResult => {
    const result = fs.moveBatch(items);
    if (result.failed > 0) {
      setError(`${result.failed} de ${result.total} movimientos fallaron`);
    } else {
      setError(null);
    }
    return result;
  }, [fs, setError]);

  const deleteFile = useCallback((uri: string): boolean => {
    const result = fs.deleteFile(uri);
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result.success;
  }, [fs, setError]);

  const deleteDirectory = useCallback((uri: string): boolean => {
    const result = fs.deleteDirectory(uri);
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result.success;
  }, [fs, setError]);

  const deleteBatch = useCallback((uris: string[]): FSBatchResult => {
    const result = fs.deleteBatch(uris);
    if (result.failed > 0) {
      setError(`${result.failed} de ${result.total} eliminaciones fallaron`);
    } else {
      setError(null);
    }
    return result;
  }, [fs, setError]);

  const renameFile = useCallback((uri: string, newName: string): FSTransferResult => {
    const result = fs.renameFile({ uri, newName });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result;
  }, [fs, setError]);

  const renameDirectory = useCallback((uri: string, newName: string): FSTransferResult => {
    const result = fs.renameDirectory({ uri, newName });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result;
  }, [fs, setError]);

  const readAsText = useCallback(async (uri: string): Promise<string | null> => {
    return withLoading(async () => {
      const result = await fs.readAsText(uri);
      if (!result.success) {
        setError(result.error ?? null);
        return null;
      }
      return result.data ?? null;
    });
  }, [fs, setError, withLoading]);

  const readAsBase64 = useCallback(async (uri: string): Promise<string | null> => {
    return withLoading(async () => {
      const result = await fs.readAsBase64(uri);
      if (!result.success) {
        setError(result.error ?? null);
        return null;
      }
      return result.data ?? null;
    });
  }, [fs, setError, withLoading]);

  const writeFile = useCallback((
    uri: string,
    content: string | Uint8Array,
    encoding?: FSEncoding,
  ): boolean => {
    const result = fs.writeFile({ uri, content, encoding });
    if (!result.success) setError(result.error ?? null);
    else setError(null);
    return result.success;
  }, [fs, setError]);

  const downloadFile = useCallback(async (
    url: string,
    destinationUri: string,
    options?: { headers?: Record<string, string>; overwrite?: boolean },
  ): Promise<FSFileInfo | null> => {
    return withLoading(async () => {
      const result = await fs.downloadFile(url, destinationUri, options);
      if (!result.success) {
        setError(result.error ?? null);
        return null;
      }
      return result.data ?? null;
    });
  }, [fs, setError, withLoading]);

  const resolveUri = useCallback((p: string) => fs.resolveUri(p), [fs]);
  const getFileName = useCallback((u: string) => fs.getFileName(u), [fs]);
  const getExtension = useCallback((u: string) => fs.getExtension(u), [fs]);
  const getParentUri = useCallback((u: string) => fs.getParentUri(u), [fs]);
  const generateUniqueUri = useCallback((u: string) => fs.generateUniqueUri(u), [fs]);
  const getTotalDiskSpace = useCallback(() => fs.getTotalDiskSpace(), [fs]);
  const getAvailableDiskSpace = useCallback(() => fs.getAvailableDiskSpace(), [fs]);

  return {
    loading: state.loading,
    error: state.error,
    clearError,

    getFileInfo,
    getDirectoryInfo,
    fileExists,
    directoryExists,
    listDirectory,

    makeDirectory,
    ensureDirectory,

    copyFile,
    copyDirectory,
    copyBatch,

    moveFile,
    moveDirectory,
    moveBatch,

    deleteFile,
    deleteDirectory,
    deleteBatch,

    renameFile,
    renameDirectory,

    readAsText,
    readAsBase64,
    writeFile,

    downloadFile,

    resolveUri,
    getFileName,
    getExtension,
    getParentUri,
    generateUniqueUri,
    baseUri: fs.baseUri,
    getTotalDiskSpace,
    getAvailableDiskSpace,
  };
};
