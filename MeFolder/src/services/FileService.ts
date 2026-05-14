import { BaseService } from "./base/BaseService";
import { File, CreateFileInput, FileStatus } from "../types/entities/file";
import { UUID } from "../types/common/base";
import { FileModel, FileFactory } from "../models/file";
import { ROOT_FOLDER_ID } from "../database/seeds/systemFolders";
import { FileSystemService } from "./filesystem/FileSystemService";
import { SYSTEM_TAG_IDS } from "@/database/seeds/systemTags";
import { dropFilesTable } from "@/database/migrations/files";
import { dropFoldersTable } from "@/database/migrations/folders";
import { dropTagsSystem } from "@/database/migrations/tags";
import { dropUserColorsTable } from "@/database/migrations/userColors";
import { MediaService } from "./media/MediaService";
import { MAX_WINDOWS_ITEM_NAME_LENGTH } from "@/constants/validation";

type StorageUsageGroup = "image" | "video" | "audio" | "documents" | "other";

export interface FileStorageUsageSummary {
  totalAppBytes: number;
  sizeByGroup: Record<StorageUsageGroup, number>;
}

/**
 * FileService MVP - Funcionalidades básicas para desarrollo inicial
 *
 * Funciones incluidas:
 * - Crear archivo simple
 * - Obtener archivo por ID
 * - Obtener archivos de una carpeta
 * - Mover archivo entre carpetas
 * - Eliminar archivo (soft delete)
 * - Gestionar tags básico (añadir/remover)
 *
 * Perfecta para construir MVP y entender la arquitectura
 */
export class FileService extends BaseService {
  private fs = new FileSystemService();
  private media = new MediaService();
  private static readonly THUMBNAILS_DIR = ".thumbnails";

  /**
   * Crear nuevo archivo (operación básica sin auto-tags).
   * Resuelve automáticamente el path completo a partir de la carpeta padre.
   */
  async createFile(input: CreateFileInput): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      // Si no se especifica carpeta, usa root
      const folderId = input.folderId || ROOT_FOLDER_ID;
      const folder = await this.validateTargetFolder(folderId);

      // Crear archivo pasando el path completo de la carpeta
      const file = await this.fileRepo.create(
        { ...input, folderId },
        folder.path,
      );

      return await this.attachGeneratedThumbnail(FileFactory.fromJSON(file));
    } catch (error) {
      return this.handleError(error, "crear archivo");
    }
  }

  private async attachGeneratedThumbnail(file: FileModel): Promise<FileModel> {
    if (
      (file.category !== "image" && file.category !== "video") ||
      !file.storageUrl
    ) {
      return file;
    }

    try {
      const thumbnailUrl = await this.media.generateThumbnail(
        file.storageUrl,
        file.id,
        file.category,
      );

      if (!thumbnailUrl || thumbnailUrl === file.thumbnailUrl) {
        return file;
      }

      const updatedFile = await this.fileRepo.updateThumbnailUrl(
        file.id,
        thumbnailUrl,
      );

      return FileFactory.fromJSON(updatedFile);
    } catch (error) {
      console.warn(
        `No se pudo generar thumbnail para ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return file;
    }
  }

  /**
   * Obtener archivo por ID
   */
  async getFile(fileId: UUID): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) {
        throw new Error("Archivo no encontrado");
      }

      return FileFactory.fromJSON(file);
    } catch (error) {
      return this.handleError(error, "obtener archivo");
    }
  }

  async fileExists(fileId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();
      return await this.fileRepo.exists(fileId);
    } catch (error) {
      return this.handleError(error, "verificar existencia de archivo");
    }
  }

  /**
   * Obtener todos los archivos de una carpeta
   */
  async getFilesInFolder(
    folderId: UUID = ROOT_FOLDER_ID,
  ): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();

      const files =
        folderId === ROOT_FOLDER_ID
          ? await this.fileRepo.findRootFiles()
          : await this.fileRepo.findByFolderId(folderId);

      return files.map((f) => FileFactory.fromJSON(f));
    } catch (error) {
      return this.handleError(error, "obtener archivos de carpeta");
    }
  }

  /**
   * Mover archivo a otra carpeta
   */
  async moveFile(fileId: UUID, targetFolderId: UUID): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const [file, targetFolder] = await Promise.all([
        this.fileRepo.findById(fileId),
        this.folderRepo.findById(targetFolderId),
      ]);

      if (!file) throw new Error("Archivo no encontrado");
      if (!targetFolder) throw new Error("Carpeta destino no encontrada");

      this.validateFileMove(file, targetFolder);

      await this.validateUniqueFileName(file.name, targetFolderId, fileId);

      const sourceUri = file.storageUrl ?? file.path;
      const expectedTargetPath = `${targetFolder.path}/${file.name}`;
      const moveResult = this.fs.moveFile({
        from: sourceUri,
        to: expectedTargetPath,
      });

      if (!moveResult.success || !moveResult.toUri) {
        throw new Error(moveResult.error ?? "No se pudo mover el archivo");
      }

      try {
        const updated = await this.fileRepo.updateLocation(
          fileId,
          targetFolderId,
          expectedTargetPath,
          moveResult.toUri,
        );
        return FileFactory.fromJSON(updated);
      } catch (error) {
        const rollbackResult = this.fs.moveFile({
          from: moveResult.toUri,
          to: sourceUri,
        });

        if (!rollbackResult.success) {
          console.warn(
            `No se pudo revertir el movimiento del archivo ${fileId}: ${rollbackResult.error}`,
          );
        }

        throw error;
      }
    } catch (error) {
      return this.handleError(error, "mover archivo");
    }
  }

  /**
   * Eliminar archivo (soft delete)
   */
  async deleteFile(fileId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error("Archivo no encontrado");

      // Cambiar status a eliminado
      await this.fileRepo.delete(fileId);

      return true;
    } catch (error) {
      return this.handleError(error, "eliminar archivo");
    }
  }

  /**
   *  Marca un archivo como favorito
   */
  async markAsFavorite(fileId: UUID): Promise<void> {
    try {
      this.ensureDbInitialized();

      await this.tagAssignmentRepo.assignTagsToFile(fileId, [
        SYSTEM_TAG_IDS.favorite,
      ]);
    } catch (error) {
      return this.handleError(error, "marcar archivo como favorito");
    }
  }

  /**
   * Eliminar archivo permanentemente (hard delete)
   */
  async permanentDeleteFile(fileId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error("Archivo no encontrado");

      await this.fileRepo.permanentDelete(fileId);

      const fileUri = file.storageUrl ?? file.path;
      const fsResult = this.fs.deleteFile(fileUri);
      if (!fsResult.success) {
        console.warn(
          `No se pudo eliminar archivo del disco: ${fsResult.error}`,
        );
      }

      if (
        (file.category === "image" || file.category === "video") &&
        file.thumbnailUrl
      ) {
        const thumbnailResult = this.fs.deleteFile(file.thumbnailUrl);
        if (!thumbnailResult.success) {
          console.warn(
            `No se pudo eliminar thumbnail del disco: ${thumbnailResult.error}`,
          );
        }
      }

      return true;
    } catch (error) {
      return this.handleError(error, "eliminar archivo");
    }
  }

  /** Elimina permanentemente múltiples archivos a partir de una lista de IDs. */
  async permanentDeleteFiles(fileIds: UUID[]): Promise<void> {
    try {
      this.ensureDbInitialized();

      for (const fileId of fileIds) {
        await this.permanentDeleteFile(fileId);
      }
    } catch (error) {
      return this.handleError(error, "eliminar archivos");
    }
  }

  async searchFiles(query: string): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();
      if (query.trim() === "") return [];
      const files = await this.fileRepo.findAll({ name: query });
      return files.map((f) => FileFactory.fromJSON(f));
    } catch (error) {
      return this.handleError(error, "buscar archivos");
    }
  }

  /** Obtiene un resumen agregado del espacio ocupado por la app por grupos de contenido. */
  async getStorageUsageSummary(): Promise<FileStorageUsageSummary> {
    try {
      this.ensureDbInitialized();

      const sizeByCategory = await this.fileRepo.obtainSizePerCategory();
      const sizeByGroup: Record<StorageUsageGroup, number> = {
        image: sizeByCategory.image ?? 0,
        video: sizeByCategory.video ?? 0,
        audio: sizeByCategory.audio ?? 0,
        documents:
          (sizeByCategory.document ?? 0) +
          (sizeByCategory.code ?? 0) +
          (sizeByCategory.spreadsheet ?? 0) +
          (sizeByCategory.archive ?? 0),
        other: sizeByCategory.other ?? 0,
      };

      const totalAppBytes = Object.values(sizeByGroup).reduce(
        (total, current) => total + current,
        0,
      );

      return {
        totalAppBytes,
        sizeByGroup,
      };
    } catch (error) {
      return this.handleError(error, "obtener resumen de almacenamiento");
    }
  }

  /** Borra todo el contenido persistido de la app para forzar una reinicialización limpia en el siguiente arranque. */
  async clearAllStoredContent(): Promise<void> {
    try {
      this.ensureDbInitialized();

      await dropTagsSystem();
      await dropFilesTable();
      await dropFoldersTable();
      await dropUserColorsTable();

      const directoryCandidates = [
        this.fs.resolveUri("root"),
        this.fs.resolveUri(ROOT_FOLDER_ID),
        this.fs.resolveUri(FileService.THUMBNAILS_DIR),
      ];

      directoryCandidates.forEach((uri) => {
        const result = this.fs.deleteDirectory(uri);
        if (!result.success) {
          console.warn(
            `No se pudo eliminar el directorio ${uri}: ${result.error}`,
          );
        }
      });

      await this.db.close();
    } catch (error) {
      return this.handleError(error, "borrar todo el contenido");
    }
  }

  /**
   * Asignar tags a un archivo
   */
  async addTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error("Archivo no encontrado");

      // Validar que los tags existen
      await this.validateTagsExist(tagIds);

      // Asignar tags
      await this.tagAssignmentRepo.assignTagsToFile(fileId, tagIds);

      // Retornar archivo actualizado
      return await this.getFile(fileId);
    } catch (error) {
      return this.handleError(error, "asignar tags al archivo");
    }
  }

  /**
   * Copiar archivo a otra carpeta
   */
  async copyFile(fileId: UUID, targetFolderId: UUID): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const [file, targetFolder] = await Promise.all([
        this.fileRepo.findById(fileId),
        this.folderRepo.findById(targetFolderId),
      ]);

      if (!file) throw new Error("Archivo no encontrado");
      if (!targetFolder) throw new Error("Carpeta destino no encontrada");

      const copyName = await this.resolveCopyFileName(
        file.name,
        targetFolderId,
      );
      const sourceUri = file.storageUrl ?? file.path;
      const destinationUri = `${targetFolder.path}/${copyName}`;
      const copyResult = this.fs.copyFile({
        from: sourceUri,
        to: destinationUri,
      });

      if (!copyResult.success || !copyResult.toUri) {
        throw new Error(copyResult.error ?? "No se pudo copiar el archivo");
      }

      try {
        return await this.createFile({
          name: copyName,
          originalName: file.originalName,
          extension: file.extension,
          folderId: targetFolderId,
          visibility: file.visibility,
          metadata: file.metadata,
          storageUrl: copyResult.toUri,
          ...(file.color && { color: file.color }),
          ...(file.tagIds.length > 0 && { tagIds: file.tagIds }),
        });
      } catch (error) {
        this.fs.deleteFile(copyResult.toUri);
        throw error;
      }
    } catch (error) {
      return this.handleError(error, "copiar archivo");
    }
  }

  /**
   * Remover tags de un archivo
   */
  async removeTagsFromFile(fileId: UUID, tagIds: UUID[]): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error("Archivo no encontrado");

      // Remover tags
      await this.tagAssignmentRepo.removeTagsFromFile(fileId, tagIds);

      // Retornar archivo actualizado
      return await this.getFile(fileId);
    } catch (error) {
      return this.handleError(error, "remover tags del archivo");
    }
  }

  /**
   * Obtener tags de un archivo
   */
  async getFileTags(fileId: UUID): Promise<UUID[]> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error("Archivo no encontrado");

      return await this.tagAssignmentRepo.getFileTagIds(fileId);
    } catch (error) {
      return this.handleError(error, "obtener tags del archivo");
    }
  }

  /**
   * Obtener archivos por categoría
   */
  async getFilesByCategory(
    category: string,
    excludeTagId?: string,
  ): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();

      const files = await this.fileRepo.findByCategory(category, excludeTagId);
      return files.map((f) => FileFactory.fromJSON(f));
    } catch (error) {
      return this.handleError(error, "obtener archivos por categoría");
    }
  }

  /**
   * Devuelve la lista de archivos eliminados..
   */
  async getDeletedFiles(): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();

      const deletedFiles = await this.fileRepo.findDeletedFiles();
      const deletedFileModels = deletedFiles.map((f) =>
        FileFactory.fromJSON(f),
      );

      return deletedFileModels;
    } catch (error) {
      return this.handleError(error, "obtener archivos eliminados");
    }
  }

  /**
   * Devuelve la lista de archivos dentro de una carpeta eliminadas dado un parentId.
   */
  async getDeletedInFolder(parentId: UUID): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();

      const filter = {
        parentId,
        status: "deleted" as FileStatus,
      };

      const deletedFiles = await this.fileRepo.findAll(filter);
      const deletedFileModels = deletedFiles.map((f) =>
        FileFactory.fromJSON(f),
      );

      return deletedFileModels;
    } catch (error) {
      return this.handleError(error, "obtener archivos eliminados");
    }
  }

  /**
   * Actualiza el nombre de un archivo.
   * @param fileId
   * @param newName
   * @returns El archivo actualizado con el nuevo nombre
   */
  async renameFile(fileId: UUID, newName: string): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const trimmedName = newName.trim();

      if (!trimmedName) {
        throw new Error("El nombre del archivo no puede estar vacío");
      }

      if (trimmedName.length > MAX_WINDOWS_ITEM_NAME_LENGTH) {
        throw new Error(
          `El nombre del archivo no puede superar ${MAX_WINDOWS_ITEM_NAME_LENGTH} caracteres`,
        );
      }

      const file = await this.fileRepo.findById(fileId);

      if (!file) throw new Error("Archivo no encontrado");

      const folderId = file.folderId || ROOT_FOLDER_ID;

      await this.validateUniqueFileName(trimmedName, folderId, fileId);

      const newPath = `${this.removeLastPathSegment(file.path)}/${trimmedName}`;

      await this.fileRepo.renameFile(fileId, trimmedName, newPath);

      return await this.getFile(fileId);
    } catch (error) {
      return this.handleError(error, "renombrar archivo");
    }
  }

  /**
   * Restaurar archivo eliminado (cambiar status de 'deleted' a 'active').
   * Devuelve los UUIDs de todos los elementos restaurados (archivo + carpetas padre).
   */
  async restoreFile(fileId: UUID): Promise<UUID[]> {
    try {
      this.ensureDbInitialized();
      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error("Archivo no encontrado");
      if (file.status !== "deleted")
        throw new Error("El archivo no está eliminado");

      const restoredIds: UUID[] = [];

      await this.restoreParentChain(
        file.folderId || ROOT_FOLDER_ID,
        restoredIds,
      );

      await this.fileRepo.restore(fileId);
      restoredIds.push(fileId);

      return restoredIds;
    } catch (error) {
      return this.handleError(error, "restaurar archivo");
    }
  }

  /**
   * Restaura recursivamente la cadena de carpetas padre eliminadas
   */
  private async restoreParentChain(
    folderId: UUID,
    restoredIds: UUID[],
  ): Promise<void> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder || folder.status !== "deleted") return;

    if (folder.parentId) {
      await this.restoreParentChain(folder.parentId, restoredIds);
    }

    await this.folderRepo.restore(folderId);
    restoredIds.push(folderId);
  }

  /**
   * Resuelve el path de almacenamiento para una carpeta.
   */
  async resolveStoragePath(folderId: UUID = ROOT_FOLDER_ID): Promise<string> {
    this.ensureDbInitialized();
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new Error("Carpeta no encontrada");
    return folder.path;
  }

  /** Validar que la carpeta destino existe y acepta archivos. Retorna la carpeta. */
  private async validateTargetFolder(
    folderId: UUID,
  ): Promise<import("../types/entities/folder").Folder> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) {
      throw new Error("Carpeta destino no encontrada");
    }
    if (folder.status === "deleted") {
      throw new Error("No se puede crear archivo en carpeta eliminada");
    }
    return folder;
  }

  /** Validar que el movimiento de archivo es permitido */
  private validateFileMove(file: File, targetFolder: any): void {
    if (file.folderId === targetFolder.id) {
      throw new Error("El archivo ya está en esa carpeta");
    }

    if (targetFolder.status === "deleted") {
      throw new Error("No se puede mover a carpeta eliminada");
    }
  }

  /** Validar que no existe otro archivo con el mismo nombre en la carpeta */
  private async validateUniqueFileName(
    fileName: string,
    folderId: UUID,
    excludeFileId?: UUID,
  ): Promise<void> {
    const filesInFolder = await this.fileRepo.findByFolderId(folderId);
    const conflictingFile = filesInFolder.find(
      (f: File) => f.name === fileName && f.id !== excludeFileId,
    );

    if (conflictingFile) {
      throw new Error(
        `Ya existe un archivo con el nombre "${fileName}" en esta carpeta`,
      );
    }
  }

  /** Validar que todos los tags existen */
  private async validateTagsExist(tagIds: UUID[]): Promise<void> {
    for (const tagId of tagIds) {
      const exists = await this.tagRepo.exists(tagId);
      if (!exists) {
        throw new Error(`Tag con ID ${tagId} no encontrado`);
      }
    }
  }

  /** Elimina el último nivel en el path */
  private removeLastPathSegment(path: string): string {
    const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path;
    const segments = normalizedPath.split("/");
    segments.pop();
    return segments.join("/");
  }

  private async resolveCopyFileName(
    fileName: string,
    folderId: UUID,
  ): Promise<string> {
    const filesInFolder = await this.fileRepo.findByFolderId(folderId);
    const usedNames = new Set(filesInFolder.map((file) => file.name));

    if (!usedNames.has(fileName)) {
      return fileName;
    }

    const { baseName, extensionSuffix } = this.splitFileName(fileName);

    let copyIndex = 1;
    while (true) {
      const suffix = copyIndex === 1 ? "_copia" : `_copia_${copyIndex}`;
      const candidateName = `${baseName}${suffix}${extensionSuffix}`;

      if (!usedNames.has(candidateName)) {
        return candidateName;
      }

      copyIndex += 1;
    }
  }

  private splitFileName(fileName: string): {
    baseName: string;
    extensionSuffix: string;
  } {
    const extensionIndex = fileName.lastIndexOf(".");

    if (extensionIndex <= 0) {
      return {
        baseName: fileName,
        extensionSuffix: "",
      };
    }

    return {
      baseName: fileName.slice(0, extensionIndex),
      extensionSuffix: fileName.slice(extensionIndex),
    };
  }
}
