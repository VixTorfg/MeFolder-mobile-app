import { BaseService } from './base/BaseService';
import { 
  File, 
  CreateFileInput,
  FileStatus
} from '../types/entities/file';
import { UUID } from '../types/common/base';
import { FileModel, FileFactory } from '../models/file';
import { ROOT_FOLDER_ID } from '../database/seeds/systemFolders';

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
      const file = await this.fileRepo.create({ ...input, folderId }, folder.path);
      return FileFactory.fromJSON(file);
      
    } catch (error) {
      return this.handleError(error, 'crear archivo');
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
        throw new Error('Archivo no encontrado');
      }

      return FileFactory.fromJSON(file);
      
    } catch (error) {
      return this.handleError(error, 'obtener archivo');
    }
  }

  /**
   * Obtener todos los archivos de una carpeta
   */
  async getFilesInFolder(folderId: UUID = ROOT_FOLDER_ID): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();

      const files = folderId === ROOT_FOLDER_ID
        ? await this.fileRepo.findRootFiles()
        : await this.fileRepo.findByFolderId(folderId);

      return files.map(f => FileFactory.fromJSON(f));
      
    } catch (error) {
      return this.handleError(error, 'obtener archivos de carpeta');
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
        this.folderRepo.findById(targetFolderId)
      ]);

      if (!file) throw new Error('Archivo no encontrado');
      if (!targetFolder) throw new Error('Carpeta destino no encontrada');

      // Validaciones básicas
      this.validateFileMove(file, targetFolder);
      
      // Validar nombre único en carpeta destino
      await this.validateUniqueFileName(file.name, targetFolderId, fileId);

      // Actualizar carpeta del archivo
      const updated = await this.fileRepo.update(fileId, {
        folderId: targetFolderId
      });
      return FileFactory.fromJSON(updated);
      
    } catch (error) {
      return this.handleError(error, 'mover archivo');
    }
  }

  /**
   * Eliminar archivo (soft delete)
   */
  async deleteFile(fileId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error('Archivo no encontrado');

      // Cambiar status a eliminado
      await this.fileRepo.update(fileId, { 
        status: 'deleted' as FileStatus 
      });
      
      return true;
      
    } catch (error) {
      return this.handleError(error, 'eliminar archivo');
    }
  }

  /**
   * Asignar tags a un archivo
   */
  async addTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error('Archivo no encontrado');

      // Validar que los tags existen
      await this.validateTagsExist(tagIds);

      // Asignar tags
      await this.tagAssignmentRepo.assignTagsToFile(fileId, tagIds);

      // Retornar archivo actualizado
      return await this.getFile(fileId);
      
    } catch (error) {
      return this.handleError(error, 'asignar tags al archivo');
    }
  }

  /**
   * Remover tags de un archivo
   */
  async removeTagsFromFile(fileId: UUID, tagIds: UUID[]): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error('Archivo no encontrado');

      // Remover tags
      await this.tagAssignmentRepo.removeTagsFromFile(fileId, tagIds);

      // Retornar archivo actualizado
      return await this.getFile(fileId);
      
    } catch (error) {
      return this.handleError(error, 'remover tags del archivo');
    }
  }

  /**
   * Obtener tags de un archivo
   */
  async getFileTags(fileId: UUID): Promise<UUID[]> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error('Archivo no encontrado');

      return await this.tagAssignmentRepo.getFileTagIds(fileId);
      
    } catch (error) {
      return this.handleError(error, 'obtener tags del archivo');
    }
  }

  /**
   * Resuelve el path de almacenamiento para una carpeta.
   */
  async resolveStoragePath(folderId: UUID = ROOT_FOLDER_ID): Promise<string> {
    this.ensureDbInitialized();
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) throw new Error('Carpeta no encontrada');
    return folder.path;
  }

  /** Validar que la carpeta destino existe y acepta archivos. Retorna la carpeta. */
  private async validateTargetFolder(folderId: UUID): Promise<import('../types/entities/folder').Folder> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) {
      throw new Error('Carpeta destino no encontrada');
    }
    if (folder.status === 'deleted') {
      throw new Error('No se puede crear archivo en carpeta eliminada');
    }
    return folder;
  }

  /** Validar que el movimiento de archivo es permitido */
  private validateFileMove(file: File, targetFolder: any): void {
    if (file.folderId === targetFolder.id) {
      throw new Error('El archivo ya está en esa carpeta');
    }
    
    if (targetFolder.status === 'deleted') {
      throw new Error('No se puede mover a carpeta eliminada');
    }
  }

  /** Validar que no existe otro archivo con el mismo nombre en la carpeta */
  private async validateUniqueFileName(fileName: string, folderId: UUID, excludeFileId?: UUID): Promise<void> {
    const filesInFolder = await this.fileRepo.findByFolderId(folderId);
    const conflictingFile = filesInFolder.find((f: File) => 
      f.name === fileName && f.id !== excludeFileId
    );
    
    if (conflictingFile) {
      throw new Error(`Ya existe un archivo con el nombre "${fileName}" en esta carpeta`);
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
}