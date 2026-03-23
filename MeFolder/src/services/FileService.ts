import { BaseService } from './base/BaseService';
import { 
  File, 
  CreateFileInput,
  FileStatus
} from '../types/entities/file';
import { UUID } from '../types/common/base';
import { FileModel, FileFactory } from '../models/file';
import { ROOT_FOLDER_ID } from '../database/seeds/systemFolders';
import { FileSystemService } from './filesystem/FileSystemService';

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

      this.validateFileMove(file, targetFolder);
      
      await this.validateUniqueFileName(file.name, targetFolderId, fileId);

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
      await this.fileRepo.delete(fileId);
      
      return true;
      
    } catch (error) {
      return this.handleError(error, 'eliminar archivo');
    }
  }

  /**
   * Eliminar archivo permanentemente (hard delete)
   */
  async permanentDeleteFile(fileId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) throw new Error('Archivo no encontrado');
    
      await this.fileRepo.permanentDelete(fileId);

      const fsResult = this.fs.deleteFile(file.path);
      if (!fsResult.success) {
        console.warn(`No se pudo eliminar archivo del disco: ${fsResult.error}`);
      }

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
   * Copiar archivo a otra carpeta
   */
  async copyFile(fileId: UUID, targetFolderId: UUID): Promise<FileModel> {
    try {
      this.ensureDbInitialized();

      const [file, targetFolder] = await Promise.all([
        this.fileRepo.findById(fileId),
        this.folderRepo.findById(targetFolderId)
      ]);

      if (!file) throw new Error('Archivo no encontrado');
      if (!targetFolder) throw new Error('Carpeta destino no encontrada');

      await this.validateUniqueFileName(file.name, targetFolderId);
      this.fs.copyFile({ from: file.path, to: targetFolder.path });

      const newFile = await this.fileRepo.create({
        name: file.name,
        originalName: file.originalName,
        extension: file.extension,
        folderId: targetFolderId,
        visibility: file.visibility,
        metadata: file.metadata,
        storageUrl: targetFolder.path + '/' + file.name, 

        ...(file.color && {color: file.color}),
        ...(file.tagIds.length > 0 && {tagIds: file.tagIds}),
        ...(file.thumbnailUrl && {thumbnailUrl: file.thumbnailUrl}) // hay resorver esto, ya que ahora coge el thumbnail del archivo antiguo.
      }, targetFolder.path);

      return FileFactory.fromJSON(newFile);
    } catch (error){
      return this.handleError(error, 'copiar archivo');
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
   * Devuelve la lista de archivos eliminados..
   */
  async getDeletedFiles(): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();

      const deletedFiles = await this.fileRepo.findDeletedFiles();
      const deletedFileModels = deletedFiles.map(f => FileFactory.fromJSON(f)); 
    
      return deletedFileModels;
      
    } catch (error) {
      return this.handleError(error, 'obtener archivos eliminados');
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
        status: 'deleted' as FileStatus
      };

      const deletedFiles = await this.fileRepo.findAll(filter); 
      const deletedFileModels = deletedFiles.map(f => FileFactory.fromJSON(f)); 
      
      return deletedFileModels;
        
    } catch (error) {
      return this.handleError(error, 'obtener archivos eliminados');
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

      const file = await this.fileRepo.findById(fileId);

      if (!file) throw new Error('Archivo no encontrado');

      const folderId = file.folderId || ROOT_FOLDER_ID; 

      await this.validateUniqueFileName(newName, folderId, fileId);

      const newPath = `${this.removeLastPathSegment(file.path)}/${newName}`;
      
      await this.fileRepo.renameFile(fileId, newName, newPath);
      
      return await this.getFile(fileId);

    } catch (error) {
      return this.handleError(error, 'renombrar archivo');
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
      if (!file) throw new Error('Archivo no encontrado');
      if (file.status !== 'deleted') throw new Error('El archivo no está eliminado');

      const restoredIds: UUID[] = [];

      await this.restoreParentChain(file.folderId || ROOT_FOLDER_ID, restoredIds);

      await this.fileRepo.restore(fileId);
      restoredIds.push(fileId);

      return restoredIds;

    }catch (error) {
      return this.handleError(error, 'restaurar archivo');
    }
  }

  /**
   * Restaura recursivamente la cadena de carpetas padre eliminadas
   */
  private async restoreParentChain(folderId: UUID, restoredIds: UUID[]): Promise<void> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder || folder.status !== 'deleted') return;

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

  /** Elimina el último nivel en el path */
  private removeLastPathSegment(path: string): string {
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const segments = normalizedPath.split('/');
    segments.pop();
    return segments.join('/');
  }
}