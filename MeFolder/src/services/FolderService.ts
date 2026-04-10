import { BaseService } from "./base/BaseService";
import {
  Folder,
  CreateFolderInput,
  FolderStatus,
} from "../types/entities/folder";
import { UUID } from "../types/common/base";
import { FolderModel, FolderFactory } from "../models/folder";
import { ROOT_FOLDER_ID } from "../database/seeds/systemFolders";
import { FileSystemService } from "./filesystem/FileSystemService";

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

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      // Validar que no sea su propio descendiente (evitar bucles)
      if (newParentId !== ROOT_FOLDER_ID) {
        await this.validateNotDescendant(folderId, newParentId);
      }
      await this.validateParentFolder(newParentId);

      // Validar nombre único en nuevo nivel
      await this.validateUniqueFolderName(folder.name, newParentId, folderId);

      // Actualizar carpeta padre
      const updated = await this.folderRepo.update(folderId, {
        parentId: newParentId,
      });
      return FolderFactory.fromJSON(updated);
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

      const fsResult = this.fs.deleteDirectory(folder.path);
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

      const [files, subfolders] = await Promise.all([
        this.fileRepo.findByFolderId(folderId),
        this.folderRepo.findByFolderId(folderId),
      ]);

      return {
        files: files.length,
        folders: subfolders.length,
      };
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
    let parentFolderUri = "";

    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      await this.validateParentFolder(destinationParentId);

      if (isRootCall)
        await this.validateUniqueFolderName(folder.name, destinationParentId);

      const subfolders = await this.folderRepo.findChildren(folderId);
      const subfiles = await this.fileRepo.findChildren(folderId);

      const newFolder = await this.folderRepo.create({
        name: folder.name,
        parentId: destinationParentId,
        type: folder.type,
        visibility: folder.visibility,
        viewSettings: folder.viewSettings,
        ...(folder.icon && { icon: folder.icon }),
        ...(folder.color && { color: folder.color }),
        ...(folder.description && { description: folder.description }),
      });
      createdFolders.push(newFolder.id);

      if (isRootCall) {
        this.fs.copyDirectory({ from: folder.path, to: newFolder.path });
        parentFolderUri = newFolder.path;
      }

      const copySubfolderPromises = subfolders.map(async (subfolder) => {
        const newSubfolder = await this.copyFolder(
          subfolder.id,
          newFolder.id,
          false,
        );
        return newSubfolder;
      });
      await Promise.all(copySubfolderPromises);

      const copyFilePromises = subfiles.map(async (file) => {
        const newFile = await this.fileRepo.create({
          name: file.name,
          originalName: file.originalName,
          extension: file.extension,
          folderId: newFolder.id,
          metadata: file.metadata,
          ...(file.visibility && { visibility: file.visibility }),
          ...(file.color && { color: file.color }),
          ...(file.tagIds && { tagIds: file.tagIds }),
          ...(file.storageUrl && { storageUrl: file.storageUrl }),
          ...(file.thumbnailUrl && { thumbnailUrl: file.thumbnailUrl }),
        });
        createdFiles.push(newFile.id);
        return newFile;
      });

      await Promise.all(copyFilePromises);

      return FolderFactory.fromJSON(newFolder);
    } catch (error) {
      if (isRootCall && createdFolders.length > 0)
        this.fs.deleteDirectory(parentFolderUri);

      for (const fileId of createdFiles.reverse()) {
        await this.fileRepo.permanentDelete(fileId);
      }

      for (const folderId of createdFolders.reverse()) {
        await this.folderRepo.permanentDelete(folderId);
      }

      return this.handleError(error, "copiar carpeta");
    }
  }

  /**
   * Renombrar carpeta
   */
  async renameFolder(folderId: UUID, newName: string): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error("Carpeta no encontrada");

      // Validar nombre único en el mismo nivel
      await this.validateUniqueFolderName(
        newName,
        folder.parentId || ROOT_FOLDER_ID,
        folderId,
      );

      // Actualizar nombre
      const updated = await this.folderRepo.update(folderId, {
        name: newName,
      });
      return FolderFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "renombrar carpeta");
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
    const files = await this.fileRepo.findByFolderId(folderId);
    await Promise.all(files.map((f) => this.fileRepo.permanentDelete(f.id)));

    const subfolders = await this.folderRepo.findByFolderId(folderId);
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
}
