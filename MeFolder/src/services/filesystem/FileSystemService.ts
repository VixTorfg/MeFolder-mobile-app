import {
  File as FSFile,
  Directory as FSDirectory,
  Paths,
} from "expo-file-system";
import mime from "mime";
import type {
  FSFileInfo,
  FSDirectoryInfo,
  FSDirectoryEntry,
  FSCopyOptions,
  FSMoveOptions,
  FSRenameOptions,
  FSMakeDirectoryOptions,
  FSOperationResult,
  FSTransferResult,
  FSBatchResult,
  FSWriteOptions,
} from "@/types/filesystem";

const MAX_MD5_FILE_SIZE_BYTES = 16 * 1024 * 1024;

/**
 * FileSystemService — Servicio puro para operaciones sobre el sistema de archivos.
 *
 * Encapsula expo-file-system v19 (API basada en clases: File, Directory, Paths).
 *
 * Proporciona:
 * - API consistente con resultados tipados (FSOperationResult / FSTransferResult)
 * - Manejo de errores unificado (nunca lanza, siempre retorna { success, error })
 * - Operaciones batch (mover/copiar/eliminar múltiples)
 * - Utilidades de rutas
 */
export class FileSystemService {
  /** Directorio de documentos de la app */
  get documentDir(): FSDirectory {
    return Paths.document;
  }

  /** Directorio de caché de la app */
  get cacheDir(): FSDirectory {
    return Paths.cache;
  }

  /** URI base del directorio de documentos */
  get baseUri(): string {
    return Paths.document.uri;
  }

  /**
   * Obtiene información detallada de un archivo.
   */
  getFileInfo(uri: string): FSOperationResult<FSFileInfo> {
    try {
      const file = new FSFile(uri);

      if (!file.exists) {
        return {
          success: true,
          uri,
          data: {
            uri,
            name: this.getFileName(uri),
            extension: this.getExtension(uri),
            exists: false,
            size: 0,
            modificationTime: null,
            creationTime: null,
            md5: null,
            mimeType: "",
          },
        };
      }

      const mimeType = file.type ?? "";

      // md5 es un getter síncrono que lee el archivo completo.
      // Lo evitamos en archivos grandes para no bloquear la UI al importar media pesada.
      let md5: string | null = null;
      if ((file.size ?? 0) <= MAX_MD5_FILE_SIZE_BYTES) {
        try {
          md5 = file.md5 ?? null;
        } catch {
          // Ignorar — el checksum es opcional
        }
      }

      return {
        success: true,
        uri,
        data: {
          uri: file.uri,
          name: file.name ?? this.getFileName(uri),
          extension: this.getExtension(uri, mimeType),
          exists: true,
          size: file.size ?? 0,
          modificationTime: file.modificationTime ?? null,
          creationTime: file.creationTime ?? null,
          md5,
          mimeType,
        },
      };
    } catch (error) {
      return this.failResult(uri, error, "obtener información del archivo");
    }
  }

  /**
   * Obtiene información de un directorio.
   */
  getDirectoryInfo(uri: string): FSOperationResult<FSDirectoryInfo> {
    try {
      const dir = new FSDirectory(uri);
      const dirName = this.getFileName(uri);

      if (!dir.exists) {
        return {
          success: true,
          uri,
          data: {
            uri,
            name: dirName,
            exists: false,
            size: null,
          },
        };
      }

      const info = dir.info();
      return {
        success: true,
        uri,
        data: {
          uri: dir.uri,
          name: dirName,
          exists: true,
          size: info.size ?? null,
          modificationTime: info.modificationTime,
          creationTime: info.creationTime,
        },
      };
    } catch (error) {
      return this.failResult(uri, error, "obtener información del directorio");
    }
  }

  /**
   * Comprueba si un archivo existe.
   */
  fileExists(uri: string): boolean {
    try {
      return new FSFile(uri).exists;
    } catch {
      return false;
    }
  }

  /**
   * Comprueba si un directorio existe.
   */
  directoryExists(uri: string): boolean {
    try {
      return new FSDirectory(uri).exists;
    } catch {
      return false;
    }
  }

  /**
   * Lista el contenido de un directorio.
   */
  listDirectory(uri: string): FSOperationResult<FSDirectoryEntry[]> {
    try {
      const dir = new FSDirectory(uri);
      if (!dir.exists) {
        return { success: false, uri, error: "El directorio no existe" };
      }

      const contents = dir.list();
      const entries: FSDirectoryEntry[] = contents.map((item) => {
        const isDirectory = item instanceof FSDirectory;
        return {
          name: item.name ?? this.getFileName(item.uri),
          uri: item.uri,
          isDirectory,
          size: !isDirectory ? (item as FSFile).size : undefined,
        };
      });

      return { success: true, uri, data: entries };
    } catch (error) {
      return this.failResult(uri, error, "listar directorio");
    }
  }

  /**
   * Crea un directorio.
   */
  makeDirectory(options: FSMakeDirectoryOptions): FSOperationResult {
    try {
      const dir = new FSDirectory(options.uri);
      dir.create({
        intermediates: options.intermediates ?? false,
        idempotent: options.idempotent ?? false,
      });
      return { success: true, uri: options.uri };
    } catch (error) {
      return this.failResult(options.uri, error, "crear directorio");
    }
  }

  /**
   * Garantiza que un directorio exista, creándolo con intermedios si es necesario.
   */
  ensureDirectory(uri: string): FSOperationResult {
    try {
      const dir = new FSDirectory(uri);
      if (dir.exists) {
        return { success: true, uri };
      }
      dir.create({ intermediates: true, idempotent: true });
      return { success: true, uri };
    } catch (error) {
      return this.failResult(uri, error, "asegurar directorio");
    }
  }

  /**
   * Copia un archivo a un destino.
   * `to` puede ser URI de archivo destino o URI de directorio destino.
   */
  copyFile(options: FSCopyOptions): FSTransferResult {
    try {
      const source = new FSFile(options.from);
      if (!source.exists) {
        return this.failTransfer(
          options.from,
          options.to,
          "Archivo origen no existe",
        );
      }

      // Determinar si el destino es directorio o archivo
      const destination = this.resolveDestination(options.to);
      source.copy(destination);

      const finalUri =
        destination instanceof FSDirectory
          ? `${destination.uri}/${source.name}`
          : destination.uri;

      return { success: true, fromUri: options.from, toUri: finalUri };
    } catch (error) {
      return {
        success: false,
        fromUri: options.from,
        toUri: options.to,
        error: this.extractErrorMessage(error, "copiar archivo"),
      };
    }
  }

  /**
   * Copia un directorio a un destino.
   */
  copyDirectory(options: FSCopyOptions): FSTransferResult {
    try {
      const source = new FSDirectory(options.from);
      if (!source.exists) {
        return this.failTransfer(
          options.from,
          options.to,
          "Directorio origen no existe",
        );
      }

      const destination = new FSDirectory(options.to);
      source.copy(destination);

      return { success: true, fromUri: options.from, toUri: destination.uri };
    } catch (error) {
      return {
        success: false,
        fromUri: options.from,
        toUri: options.to,
        error: this.extractErrorMessage(error, "copiar directorio"),
      };
    }
  }

  /**
   * Copia múltiples archivos.
   */
  copyBatch(items: FSCopyOptions[]): FSBatchResult {
    return this.executeBatch(items, (item) => this.copyFile(item));
  }

  /**
   * Mueve un archivo a otra ubicación.
   * `to` puede ser URI de archivo destino o URI de directorio destino.
   */
  moveFile(options: FSMoveOptions): FSTransferResult {
    try {
      const source = new FSFile(options.from);
      if (!source.exists) {
        return this.failTransfer(
          options.from,
          options.to,
          "Archivo origen no existe",
        );
      }

      const destination = this.resolveDestination(options.to);
      source.move(destination);

      return { success: true, fromUri: options.from, toUri: source.uri };
    } catch (error) {
      return {
        success: false,
        fromUri: options.from,
        toUri: options.to,
        error: this.extractErrorMessage(error, "mover archivo"),
      };
    }
  }

  /**
   * Mueve un directorio a otra ubicación.
   */
  moveDirectory(options: FSMoveOptions): FSTransferResult {
    try {
      const source = new FSDirectory(options.from);
      if (!source.exists) {
        return this.failTransfer(
          options.from,
          options.to,
          "Directorio origen no existe",
        );
      }

      const destination = new FSDirectory(options.to);
      source.move(destination);

      return { success: true, fromUri: options.from, toUri: source.uri };
    } catch (error) {
      return {
        success: false,
        fromUri: options.from,
        toUri: options.to,
        error: this.extractErrorMessage(error, "mover directorio"),
      };
    }
  }

  /**
   * Mueve múltiples archivos.
   */
  moveBatch(items: FSMoveOptions[]): FSBatchResult {
    return this.executeBatch(items, (item) => this.moveFile(item));
  }

  /**
   * Elimina un archivo.
   */
  deleteFile(uri: string): FSOperationResult {
    try {
      const file = new FSFile(uri);
      if (!file.exists) {
        return { success: true, uri };
      }
      file.delete();
      return { success: true, uri };
    } catch (error) {
      return this.failResult(uri, error, "eliminar archivo");
    }
  }

  /**
   * Elimina un directorio y todo su contenido.
   */
  deleteDirectory(uri: string): FSOperationResult {
    try {
      const dir = new FSDirectory(uri);
      if (!dir.exists) {
        return { success: true, uri };
      }
      dir.delete();
      return { success: true, uri };
    } catch (error) {
      return this.failResult(uri, error, "eliminar directorio");
    }
  }

  /**
   * Elimina múltiples archivos.
   */
  deleteBatch(uris: string[]): FSBatchResult {
    const items = uris.map((uri) => ({ uri }));
    return this.executeBatch(items, (item) => this.deleteFile(item.uri));
  }

  /**
   * Renombra un archivo.
   */
  renameFile(options: FSRenameOptions): FSTransferResult {
    try {
      const file = new FSFile(options.uri);
      if (!file.exists) {
        return this.failTransfer(options.uri, options.uri, "Archivo no existe");
      }
      file.rename(options.newName);
      return { success: true, fromUri: options.uri, toUri: file.uri };
    } catch (error) {
      return {
        success: false,
        fromUri: options.uri,
        toUri: options.uri,
        error: this.extractErrorMessage(error, "renombrar archivo"),
      };
    }
  }

  /**
   * Renombra un directorio.
   */
  renameDirectory(options: FSRenameOptions): FSTransferResult {
    try {
      const dir = new FSDirectory(options.uri);
      if (!dir.exists) {
        return this.failTransfer(
          options.uri,
          options.uri,
          "Directorio no existe",
        );
      }
      dir.rename(options.newName);
      return { success: true, fromUri: options.uri, toUri: dir.uri };
    } catch (error) {
      return {
        success: false,
        fromUri: options.uri,
        toUri: options.uri,
        error: this.extractErrorMessage(error, "renombrar directorio"),
      };
    }
  }

  /**
   * Lee el contenido de un archivo como texto (UTF-8).
   */
  async readAsText(uri: string): Promise<FSOperationResult<string>> {
    try {
      const file = new FSFile(uri);
      if (!file.exists) {
        return { success: false, uri, error: "Archivo no existe" };
      }
      const content = await file.text();
      return { success: true, uri, data: content };
    } catch (error) {
      return this.failResult(uri, error, "leer archivo como texto");
    }
  }

  /**
   * Lee el contenido de un archivo como base64.
   */
  async readAsBase64(uri: string): Promise<FSOperationResult<string>> {
    try {
      const file = new FSFile(uri);
      if (!file.exists) {
        return { success: false, uri, error: "Archivo no existe" };
      }
      const content = await file.base64();
      return { success: true, uri, data: content };
    } catch (error) {
      return this.failResult(uri, error, "leer archivo como base64");
    }
  }

  /**
   * Escribe contenido en un archivo.
   * Crea el archivo si no existe. Sobreescribe si existe.
   */
  writeFile(options: FSWriteOptions): FSOperationResult {
    try {
      const file = new FSFile(options.uri);

      // Asegurar que el directorio padre exista
      const parentUri = this.getParentUri(options.uri);
      this.ensureDirectory(parentUri);

      if (!file.exists) {
        file.create({ intermediates: true, overwrite: true });
      }

      const encodingOpt =
        options.encoding === "base64"
          ? { encoding: "base64" as const }
          : undefined;
      file.write(options.content, encodingOpt);

      return { success: true, uri: options.uri };
    } catch (error) {
      return this.failResult(options.uri, error, "escribir archivo");
    }
  }

  /**
   * Descarga un archivo desde una URL.
   */
  async downloadFile(
    url: string,
    destinationUri: string,
    options?: { headers?: Record<string, string>; overwrite?: boolean },
  ): Promise<FSOperationResult<FSFileInfo>> {
    try {
      // Asegurar directorio destino
      const parentUri = this.getParentUri(destinationUri);
      this.ensureDirectory(parentUri);

      const destination = new FSFile(destinationUri);
      const downloadOpts: {
        headers?: { [key: string]: string };
        idempotent?: boolean;
      } = {
        idempotent: options?.overwrite ?? false,
      };
      if (options?.headers) {
        downloadOpts.headers = options.headers;
      }
      const file = await FSFile.downloadFileAsync(
        url,
        destination,
        downloadOpts,
      );

      const info = this.getFileInfo(file.uri);
      if (info.success && info.data) {
        return { success: true, uri: file.uri, data: info.data };
      }
      return { success: true, uri: file.uri };
    } catch (error) {
      return this.failResult(destinationUri, error, "descargar archivo");
    }
  }

  /**
   * Resuelve una ruta relativa contra el documentDirectory.
   * @example resolveUri('images/photo.jpg') → '{documentDirectory}/images/photo.jpg'
   */
  resolveUri(relativePath: string): string {
    if (
      relativePath.startsWith("file://") ||
      relativePath.startsWith("content://")
    ) {
      return relativePath;
    }
    return this.joinPath(this.baseUri, relativePath);
  }

  /**
   * Une segmentos de URI asegurando separadores correctos.
   */
  joinPath(...segments: string[]): string {
    return segments
      .map((s, i) => {
        let segment = s;
        if (i < segments.length - 1) {
          segment = segment.replace(/\/+$/, "");
        }
        if (i > 0) {
          segment = segment.replace(/^\/+/, "");
        }
        return segment;
      })
      .join("/");
  }

  /**
   * Extrae el nombre de archivo/carpeta de una URI.
   * @example getFileName('file:///data/images/photo.jpg') → 'photo.jpg'
   */
  getFileName(uri: string): string {
    const clean = uri.replace(/\/+$/, "");
    const parts = clean.split("/");
    return parts[parts.length - 1] || "";
  }

  /**
   * Extrae la extensión de un archivo.
   * Si se proporciona mimeType, se usa la librería `mime` para resolverla.
   * Si no, se extrae del nombre de archivo como fallback.
   * @example getExtension('photo.jpg')                  → 'jpg'
   * @example getExtension('archivo_sin_ext', 'image/png') → 'png'
   */
  getExtension(uri: string, mimeType?: string): string {
    if (mimeType) {
      const ext = mime.getExtension(mimeType);
      if (ext) return ext;
    }
    const name = this.getFileName(uri);
    const dotIndex = name.lastIndexOf(".");
    return dotIndex > 0 ? name.substring(dotIndex + 1).toLowerCase() : "";
  }

  /**
   * Obtiene la URI del directorio padre.
   * @example getParentUri('file:///data/images/photo.jpg') → 'file:///data/images'
   */
  getParentUri(uri: string): string {
    const clean = uri.replace(/\/+$/, "");
    const lastSlash = clean.lastIndexOf("/");
    return lastSlash > 0 ? clean.substring(0, lastSlash) : clean;
  }

  /**
   * Genera una URI única añadiendo timestamp + random para evitar colisiones.
   */
  generateUniqueUri(baseUri: string): string {
    const name = this.getFileName(baseUri);
    const ext = this.getExtension(baseUri);
    const parentUri = this.getParentUri(baseUri);
    const suffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const baseName = ext ? name.replace(`.${ext}`, "") : name;
    const uniqueName = ext
      ? `${baseName}_${suffix}.${ext}`
      : `${baseName}_${suffix}`;

    return this.joinPath(parentUri, uniqueName);
  }

  /**
   * Obtiene el espacio total del dispositivo en bytes.
   */
  getTotalDiskSpace(): number {
    return Paths.totalDiskSpace;
  }

  /**
   * Obtiene el espacio disponible del dispositivo en bytes.
   */
  getAvailableDiskSpace(): number {
    return Paths.availableDiskSpace;
  }

  /**
   * Resuelve si un destino es File o Directory basándose en si tiene extensión.
   * Si el destino parece un directorio (sin extensión o termina en /), retorna Directory.
   */
  private resolveDestination(toUri: string): FSFile | FSDirectory {
    if (toUri.endsWith("/") || !this.getExtension(toUri)) {
      return new FSDirectory(toUri);
    }
    return new FSFile(toUri);
  }

  /** Ejecuta operaciones batch y recopila resultados */
  private executeBatch<
    TInput,
    TResult extends { success: boolean; error?: string | undefined },
  >(items: TInput[], operation: (item: TInput) => TResult): FSBatchResult {
    const result: FSBatchResult = {
      total: items.length,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    for (const item of items) {
      const opResult = operation(item);
      if (opResult.success) {
        result.succeeded++;
      } else {
        result.failed++;
        result.errors.push({
          uri: (item as any).from ?? (item as any).uri ?? "unknown",
          error: opResult.error ?? "Error desconocido",
        });
      }
    }

    return result;
  }

  /** Crea un resultado de error estandarizado */
  private failResult<T = void>(
    uri: string,
    error: unknown,
    operation: string,
  ): FSOperationResult<T> {
    return {
      success: false,
      uri,
      error: this.extractErrorMessage(error, operation),
    };
  }

  /** Crea un resultado de transferencia fallida */
  private failTransfer(
    from: string,
    to: string,
    message: string,
  ): FSTransferResult {
    return { success: false, fromUri: from, toUri: to, error: message };
  }

  /** Extrae mensaje legible de un error */
  private extractErrorMessage(error: unknown, operation: string): string {
    if (error instanceof Error) {
      return `Error al ${operation}: ${error.message}`;
    }
    return `Error desconocido al ${operation}`;
  }
}
