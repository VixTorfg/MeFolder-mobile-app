import { BaseService } from "./base/BaseService";
import {
  Folder,
  CreateFolderInput,
  UpdateFolderInput,
  FolderStatus,
} from "../types/entities/folder";
import { File as FileEntity } from "../types/entities/file";
import { UUID } from "../types/common/base";
import { FolderModel, FolderFactory } from "../models/folder";
import { ROOT_FOLDER_ID } from "../database/seeds/systemFolders";
import { FileSystemService } from "./filesystem/FileSystemService";
import { ColorInfo } from "@/types/common/colors";
import { FileService } from "./FileService";
import type {
  FileLocationUpdate,
  FolderLocationUpdate,
} from "../types/repositories/folder";

/**
 * FolderService MVP - Funcionalidades básicas para desarrollo inicial
 *
 * Funciones incluidas:
 * - Crear carpeta simple
 * - Obtener carpeta por ID
 * - Obtener subcarpetas
 * - Mover carpeta entre jerarquías
 * - Eliminar carpeta (soft delete)
 * - Navegación básica de jerarquía
 *
 * Perfecta para construir MVP y entender la arquitectura de carpetas
 */
export class FolderService extends BaseService {
  private fs = new FileSystemService();
  private fileService = new FileService();

  /**
   * Crear nueva carpeta (operación básica)
   */
  async createFolder(input: CreateFolderInput): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      // Si no se especifica padre, usa root
      const parentId = input.parentId || ROOT_FOLDER_ID;

      // Validar carpeta padre
      await this.validateParentFolder(parentId);

      // Validar nombre único en el mismo nivel
      await this.validateUniqueFolderName(input.name, parentId);

      // Crear carpeta usando el repositorio
      const folder = await this.folderRepo.create({ ...input, parentId });
      return FolderFactory.fromJSON(folder);
    } catch (error) {
      return this.handleError(error, "crear carpeta");
    }
  }

  /**
   *  Actualizar configuración de vista de carpeta
   */
  async updateFolderViewConfig(
    folderId: UUID,
    viewSettings: Partial<Folder["viewSettings"]>,
  ): Promise<void> {
    try {
      this.ensureDbInitialized();

      await this.folderRepo.updateViewConfig(folderId, viewSettings);
    } catch (error) {
      return this.handleError(
        error,
        "actualizar configuración de vista de carpeta",
      );
    }
  }

  async searchFolders(query: string): Promise<FolderModel[]> {
    try {
      this.ensureDbInitialized();
      if (query.trim() === "") return [];
      const folders = await this.folderRepo.findAll({ name: query });
      return folders.map((f) => FolderFactory.fromJSON(f));
    } catch (error) {
      return this.handleError(error, "buscar carpetas");
    }
  }

  /** Obtiene la configuración de vista de una carpeta específica */
  async getFolderViewConfig(
    folderId: UUID,
  ): Promise<Folder["viewSettings"] | null> {
    try {
      this.ensureDbInitialized();

      return await this.folderRepo.getFolderViewConfig(folderId);
    } catch (error) {
      return this.handleError(
        error,
        "obtener configuración de vista de carpeta",
      );
    }
  }

  /**
   * Obtener carpeta por ID
   */
  async getFolder(folderId: UUID): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) {
        throw new Error("Carpeta no encontrada");
      }

      return FolderFactory.fromJSON(folder);
    } catch (error) {
      return this.handleError(error, "obtener carpeta");
    }
  }

  async folderExists(folderId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();
      return await this.folderRepo.exists(folderId);
    } catch (error) {
      return this.handleError(error, "verificar existencia de carpeta");
    }
  }

  /**
   * Obtener subcarpetas de una carpeta
   */
  async getSubfolders(parentId: UUID = ROOT_FOLDER_ID): Promise<FolderModel[]> {
    try {
      this.ensureDbInitialized();

      const folders =
        parentId === ROOT_FOLDER_ID
          ? await this.folderRepo.findRootFolders()
          : await this.folderRepo.findByFolderId(parentId);

      return folders.map((f) => FolderFactory.fromJSON(f));
    } catch (error) {
      return this.handleError(error, "obtener subcarpetas");
    }
  }

  /**
   * Obtener ruta completa de una carpeta
   */
  async getFolderPath(folderId: UUID): Promise<string[]> {
    try {
      this.ensureDbInitialized();

      const path: string[] = [];
      let currentId: UUID | null = folderId;

      while (currentId && currentId !== ROOT_FOLDER_ID) {
        const folder = await this.folderRepo.findById(currentId);
        if (!folder) break;

        path.unshift(folder.name);
        currentId = folder.parentId || null;
      }

      return path;
    } catch (error) {
      return this.handleError(error, "obtener ruta de carpeta");
    }
  }

  /**
   * Mover carpeta a otro padre
   */
  async moveFolder(
    folderId: UUID,
    newParentId: UUID = ROOT_FOLDER_ID,
  ): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const [folder, newParentFolder] = await Promise.all([
        this.folderRepo.findById(folderId),
        this.folderRepo.findById(newParentId),
      ]);

      if (!folder) throw new Error("Carpeta no encontrada");
      if (!newParentFolder) throw new Error("Carpeta padre no encontrada");
      if (folder.parentId === newParentId) {
        throw new Error("La carpeta ya está en esa ubicación");
      }

      // Validar que no sea su propio descendiente (evitar bucles)
      if (newParentId !== ROOT_FOLDER_ID) {
        await this.validateNotDescendant(folderId, newParentId);
      }
      await this.validateParentFolder(newParentId);

      // Validar nombre único en nuevo nivel
      await this.validateUniqueFolderName(folder.name, newParentId, folderId);

      const oldRootPath = folder.path;
      const newRootPath = `${newParentFolder.path}/${folder.id}`;
      const newRootLevel = newParentFolder.level + 1;
      const levelDelta = newRootLevel - folder.level;
      const subtree = await this.collectFolderMoveSubtree(folderId);
      const moveResult = this.fs.moveDirectory({
        from: this.fs.resolveUri(oldRootPath),
        to: this.fs.resolveUri(newRootPath),
      });

      if (!moveResult.success) {
        throw new Error(moveResult.error ?? "No se pudo mover la carpeta");
      }

      try {
        const folderUpdates: FolderLocationUpdate[] = subtree.folders.map(
          (subfolder) => ({
            id: subfolder.id,
            path: this.replacePathPrefix(
              subfolder.path,
              oldRootPath,
              newRootPath,
            ),
            level: subfolder.level + levelDelta,
          }),
        );
        const fileUpdates: FileLocationUpdate[] = subtree.files.map((file) => {
          const newLogicalPath = this.replacePathPrefix(
            file.path,
            oldRootPath,
            newRootPath,
          );
          return {
            id: file.id,
            path: newLogicalPath,
            storageUrl: this.fs.resolveUri(newLogicalPath),
          };
        });

        await this.folderRepo.relocateSubtree({
          rootFolderId: folderId,
          newParentId,
          newRootPath,
          newRootLevel,
          folderUpdates,
          fileUpdates,
        });
        return await this.getFolder(folderId);
      } catch (error) {
        const rollbackResult = this.fs.moveDirectory({
          from: this.fs.resolveUri(newRootPath),
          to: this.fs.resolveUri(oldRootPath),
        });

        if (!rollbackResult.success) {
          console.warn(
            `No se pudo revertir el movimiento de la carpeta ${folderId}: ${rollbackResult.error}`,
          );
        }

        throw error;
      }
    } catch (error) {
      return this.handleError(error, "mover carpeta");
    }
  }

  /**
   * Eliminar carpeta (soft delete)
   * Solo permite eliminar carpetas vacías por seguridad
   */
  async deleteFolder(folderId: UUID, force: boolean = false): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      if (folder.isSystemFolder) {
        throw new Error("No se puede eliminar una carpeta del sistema");
      }
      if (folder.isProtected) {
        throw new Error("No se puede eliminar una carpeta protegida");
      }

      if (!force) {
        await this.validateFolderEmpty(folderId);
      }

      await this.folderRepo.delete(folderId);

      await this.deleteChildrenRecursive(folderId);

      return true;
    } catch (error) {
      return this.handleError(error, "eliminar carpeta");
    }
  }

  /**
   * Eliminar carpeta permanentemente (hard delete)
   */
  async permanentDeleteFolder(folderId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      // Las carpetas del sistema y protegidas no se pueden eliminar
      if (folder.isSystemFolder) {
        throw new Error("No se puede eliminar una carpeta del sistema");
      }
      if (folder.isProtected) {
        throw new Error("No se puede eliminar una carpeta protegida");
      }

      await this.permanentDeleteChildrenRecursive(folderId);
      await this.folderRepo.permanentDelete(folderId);

      const fsResult = this.fs.deleteDirectory(this.fs.resolveUri(folder.path));
      if (!fsResult.success) {
        console.warn(
          `No se pudo eliminar carpeta del disco: ${fsResult.error}`,
        );
      }

      return true;
    } catch (error) {
      return this.handleError(error, "eliminar carpeta");
    }
  }

  /**
   * Devuelve la lista de carpetas eliminadas.
   */
  async getDeletedFolders(): Promise<FolderModel[]> {
    try {
      this.ensureDbInitialized();

      const deletedFolders = await this.folderRepo.findDeletedFolders();
      const deletedFolderModels = deletedFolders.map((f) =>
        FolderFactory.fromJSON(f),
      );

      return deletedFolderModels;
    } catch (error) {
      return this.handleError(error, "obtener carpetas eliminadas");
    }
  }

  /**
   * Devuelve la lista de subcarpetas eliminadas dado un parentId.
   */
  async getDeletedInFolder(parentId: UUID): Promise<FolderModel[]> {
    try {
      this.ensureDbInitialized();

      const filter = {
        parentId,
        status: "deleted" as FolderStatus,
      };

      const deletedFolders = await this.folderRepo.findAll(filter);
      const deletedFolderModels = deletedFolders.map((f) =>
        FolderFactory.fromJSON(f),
      );

      return deletedFolderModels;
    } catch (error) {
      return this.handleError(error, "obtener carpetas eliminadas");
    }
  }

  /**
   * Contar contenido de una carpeta (archivos + subcarpetas)
   */
  async getFolderContentCount(
    folderId: UUID,
  ): Promise<{ files: number; folders: number }> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) {
        throw new Error("Carpeta no encontrada");
      }

      if (folder.status === "deleted") {
        const [files, folders] = await Promise.all([
          this.fileRepo.findAll({ folderId, status: "deleted" }, true),
          this.folderRepo.findAll(
            { parentId: folderId, status: "deleted" },
            true,
          ),
        ]);

        return {
          files: files.length,
          folders: folders.length,
        };
      }

      const [files, folders] = await Promise.all([
        this.fileRepo.count({ folderId }),
        this.folderRepo.count({ parentId: folderId }),
      ]);

      return { files, folders };
    } catch (error) {
      return this.handleError(error, "contar contenido de carpeta");
    }
  }

  /**
   * Restaurar carpeta eliminada, incluyendo padres hacia arriba e hijos hacia abajo.
   * Devuelve los UUIDs de todos los elementos restaurados.
   */
  async restoreFolder(folderId: UUID): Promise<UUID[]> {
    try {
      this.ensureDbInitialized();
      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");
      if (folder.status !== "deleted")
        throw new Error("La carpeta no está eliminada");

      const restoredIds: UUID[] = [];

      // Restaurar padres hacia arriba
      await this.restoreParentChain(
        folder.parentId || ROOT_FOLDER_ID,
        restoredIds,
      );

      // Restaurar la carpeta
      await this.folderRepo.restore(folderId);
      restoredIds.push(folderId);

      // Restaurar hijos hacia abajo
      await this.restoreChildrenRecursive(folderId, restoredIds);

      return restoredIds;
    } catch (error) {
      return this.handleError(error, "restaurar carpeta");
    }
  }

  async copyFolder(
    folderId: UUID,
    destinationParentId: UUID,
    isRootCall: boolean = true,
  ): Promise<FolderModel> {
    const createdFolders: UUID[] = [];
    const createdFiles: UUID[] = [];

    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      await this.validateParentFolder(destinationParentId);

      const copiedFolderName = isRootCall
        ? await this.resolveCopyFolderName(folder.name, destinationParentId)
        : folder.name;

      const newFolder = await this.createCopiedFolder(
        folder,
        destinationParentId,
        copiedFolderName,
      );
      createdFolders.push(newFolder.id);

      await this.copyFolderContents(
        folderId,
        newFolder.id,
        createdFolders,
        createdFiles,
      );

      return FolderFactory.fromJSON(newFolder);
    } catch (error) {
      for (const fileId of createdFiles.reverse()) {
        await this.fileService.permanentDeleteFile(fileId);
      }

      for (const folderId of createdFolders.reverse()) {
        const folder = await this.folderRepo.findById(folderId);
        if (folder) {
          this.fs.deleteDirectory(this.fs.resolveUri(folder.path));
        }
        await this.folderRepo.permanentDelete(folderId);
      }

      return this.handleError(error, "copiar carpeta");
    }
  }

  /**
   * Actualizar descripción de la carpeta
   */
  async updateFolderDescription(
    folderId: UUID,
    description: string,
  ): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      const updated = await this.folderRepo.update(folderId, {
        description,
      });
      return FolderFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "actualizar descripción de carpeta");
    }
  }

  /**
   * Renombrar carpeta
   */
  async renameFolder(folderId: UUID, newName: string): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const trimmedName = newName.trim();

      const folder = await this.folderRepo.findById(folderId);

      if (folder?.isSystemFolder)
        throw new Error("No se puede renombrar una carpeta del sistema");

      if (!folder) throw new Error("Carpeta no encontrada");

      // Validar nombre único en el mismo nivel
      await this.validateUniqueFolderName(
        trimmedName,
        folder.parentId || ROOT_FOLDER_ID,
        folderId,
      );

      // Actualizar nombre
      const updated = await this.folderRepo.update(folderId, {
        name: trimmedName,
      });
      return FolderFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "renombrar carpeta");
    }
  }

  /**
   * Actualizar propiedades de una carpeta (color, icono, etc.)
   */
  async updateFolder(
    folderId: UUID,
    input: UpdateFolderInput,
  ): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      const updated = await this.folderRepo.update(folderId, input);
      return FolderFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "actualizar carpeta");
    }
  }

  /**
   * Actualizar el icono de una carpeta
   */
  async updateFolderIcon(folderId: UUID, input: string): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      const updated = await this.folderRepo.update(folderId, { icon: input });
      return FolderFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "actualizar icono de carpeta");
    }
  }

  /**
   * Actualizar el color de una carpeta
   */
  async updateFolderColor(
    folderId: UUID,
    input: ColorInfo,
  ): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      const updated = await this.folderRepo.update(folderId, { color: input });
      return FolderFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "actualizar color de carpeta");
    }
  }

  /** Validar que la carpeta padre existe */
  private async validateParentFolder(parentId: UUID): Promise<void> {
    const parent = await this.folderRepo.findById(parentId);
    if (!parent) {
      throw new Error("Carpeta padre no encontrada");
    }
    if (parent.status === "deleted") {
      throw new Error("No se puede crear subcarpeta en carpeta eliminada");
    }
  }

  /** Validar que no existe otra carpeta con el mismo nombre en el nivel */
  private async validateUniqueFolderName(
    name: string,
    parentId: UUID,
    excludeFolderId?: UUID,
  ): Promise<void> {
    const siblings =
      parentId === ROOT_FOLDER_ID
        ? await this.folderRepo.findRootFolders()
        : await this.folderRepo.findByFolderId(parentId);
    const conflicting = siblings.find(
      (f: Folder) => f.name === name && f.id !== excludeFolderId,
    );

    if (conflicting) {
      throw new Error(
        `Ya existe una carpeta con el nombre "${name}" en este nivel`,
      );
    }
  }

  /** Validar que la carpeta no sea descendiente de la carpeta destino */
  private async validateNotDescendant(
    folderId: UUID,
    targetParentId: UUID,
  ): Promise<void> {
    let currentId: UUID | null = targetParentId;

    while (currentId && currentId !== ROOT_FOLDER_ID) {
      if (currentId === folderId) {
        throw new Error("No se puede mover una carpeta dentro de sí misma");
      }

      const folder = await this.folderRepo.findById(currentId);
      if (!folder) break;

      currentId = folder.parentId || null;
    }
  }

  /** Validar que la carpeta esté vacía */
  private async validateFolderEmpty(folderId: UUID): Promise<void> {
    const content = await this.getFolderContentCount(folderId);

    if (content.files > 0 || content.folders > 0) {
      throw new Error(
        "No se puede eliminar carpeta que contiene archivos o subcarpetas",
      );
    }
  }

  /**
   * Elimina recursivamente todos los hijos de una carpeta (subcarpetas y archivos)
   */
  private async deleteChildrenRecursive(folderId: UUID): Promise<void> {
    const files = await this.fileRepo.findByFolderId(folderId);
    await Promise.all(files.map((f) => this.fileRepo.delete(f.id)));

    const subfolders = await this.folderRepo.findByFolderId(folderId);
    await Promise.all(
      subfolders.map(async (f) => {
        await this.deleteChildrenRecursive(f.id);
        await this.folderRepo.delete(f.id);
      }),
    );
  }

  /**
   * Permanentemente elimina recursivamente todos los hijos de una carpeta (subcarpetas y archivos)
   */
  private async permanentDeleteChildrenRecursive(
    folderId: UUID,
  ): Promise<void> {
    const files = await this.fileRepo.findAll(
      { folderId, status: "deleted" },
      true,
    );
    await Promise.all(
      files.map(async (file) => {
        await this.fileRepo.permanentDelete(file.id);

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
      }),
    );

    const subfolders = await this.folderRepo.findAll(
      { parentId: folderId, status: "deleted" },
      true,
    );
    await Promise.all(
      subfolders.map(async (f) => {
        await this.permanentDeleteChildrenRecursive(f.id);
        await this.folderRepo.permanentDelete(f.id);
      }),
    );
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
   * Restaura recursivamente todos los hijos de una carpeta (subcarpetas y archivos)
   */
  private async restoreChildrenRecursive(
    folderId: UUID,
    restoredIds: UUID[],
  ): Promise<void> {
    const files = await this.fileRepo.findAll(
      { folderId, status: "deleted" },
      true,
    );
    await Promise.all(
      files.map(async (f) => {
        await this.fileRepo.restore(f.id);
        restoredIds.push(f.id);
      }),
    );

    const subfolders = await this.folderRepo.findAll(
      { parentId: folderId, status: "deleted" },
      true,
    );
    await Promise.all(
      subfolders.map(async (f) => {
        await this.folderRepo.restore(f.id);
        restoredIds.push(f.id);
        await this.restoreChildrenRecursive(f.id, restoredIds);
      }),
    );
  }

  private async createCopiedFolder(
    sourceFolder: Folder,
    parentId: UUID,
    name: string,
  ): Promise<Folder> {
    const newFolder = await this.folderRepo.create({
      name,
      parentId,
      type: "regular",
      visibility: "public",
      viewSettings: sourceFolder.viewSettings,
      ...(sourceFolder.icon && { icon: sourceFolder.icon }),
      ...(sourceFolder.color && { color: sourceFolder.color }),
      ...(sourceFolder.description && {
        description: sourceFolder.description,
      }),
    });

    const dirResult = this.fs.makeDirectory({
      uri: this.fs.resolveUri(newFolder.path),
      intermediates: true,
      idempotent: true,
    });

    if (!dirResult.success) {
      await this.folderRepo.permanentDelete(newFolder.id);
      throw new Error(dirResult.error ?? "No se pudo crear la carpeta copiada");
    }

    return newFolder;
  }

  private async copyFolderContents(
    sourceFolderId: UUID,
    targetFolderId: UUID,
    createdFolderIds: UUID[],
    createdFileIds: UUID[],
  ): Promise<void> {
    const [subfolders, subfiles] = await Promise.all([
      this.folderRepo.findChildren(sourceFolderId),
      this.fileRepo.findChildren(sourceFolderId),
    ]);

    for (const subfolder of subfolders) {
      const copiedSubfolder = await this.createCopiedFolder(
        subfolder,
        targetFolderId,
        subfolder.name,
      );
      createdFolderIds.push(copiedSubfolder.id);

      await this.copyFolderContents(
        subfolder.id,
        copiedSubfolder.id,
        createdFolderIds,
        createdFileIds,
      );
    }

    for (const file of subfiles) {
      const copiedFile = await this.fileService.copyFile(
        file.id,
        targetFolderId,
      );
      createdFileIds.push(copiedFile.id);
    }
  }

  private async collectFolderMoveSubtree(folderId: UUID): Promise<{
    folders: Folder[];
    files: FileEntity[];
  }> {
    const folders: Folder[] = [];
    const files: FileEntity[] = [];

    const visitFolder = async (currentFolderId: UUID): Promise<void> => {
      const [currentFiles, subfolders] = await Promise.all([
        this.fileRepo.findChildren(currentFolderId),
        this.folderRepo.findChildren(currentFolderId),
      ]);

      files.push(...currentFiles);

      for (const subfolder of subfolders) {
        folders.push(subfolder);
        await visitFolder(subfolder.id);
      }
    };

    await visitFolder(folderId);

    return { folders, files };
  }

  private replacePathPrefix(
    inputPath: string,
    currentPrefix: string,
    nextPrefix: string,
  ): string {
    if (inputPath === currentPrefix) {
      return nextPrefix;
    }

    const normalizedCurrentPrefix = currentPrefix.endsWith("/")
      ? currentPrefix
      : `${currentPrefix}/`;
    const normalizedNextPrefix = nextPrefix.endsWith("/")
      ? nextPrefix
      : `${nextPrefix}/`;

    if (!inputPath.startsWith(normalizedCurrentPrefix)) {
      return inputPath;
    }

    return `${normalizedNextPrefix}${inputPath.slice(normalizedCurrentPrefix.length)}`;
  }

  private async resolveCopyFolderName(
    folderName: string,
    parentId: UUID,
  ): Promise<string> {
    const siblings =
      parentId === ROOT_FOLDER_ID
        ? await this.folderRepo.findRootFolders()
        : await this.folderRepo.findByFolderId(parentId);
    const usedNames = new Set(siblings.map((folder) => folder.name));

    if (!usedNames.has(folderName)) {
      return folderName;
    }

    let copyIndex = 1;
    while (true) {
      const suffix = copyIndex === 1 ? "_copia" : `_copia_${copyIndex}`;
      const candidateName = `${folderName}${suffix}`;

      if (!usedNames.has(candidateName)) {
        return candidateName;
      }

      copyIndex += 1;
    }
  }
}
