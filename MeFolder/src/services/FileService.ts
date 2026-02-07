import { BaseService } from './base/BaseService';
import { 
  File, 
  CreateFileInput,
  FileStatus
} from '../types/entities/file';
import { UUID } from '../types/common/base';

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
   * Crear nuevo archivo (operación básica sin auto-tags)
   */
  async createFile(input: CreateFileInput): Promise<File> {
    try {
      this.ensureDbInitialized();
      
      // Validar carpeta destino si se especifica
      if (input.folderId) {
        await this.validateTargetFolder(input.folderId);
      }

      // Crear archivo usando el repositorio
      return await this.fileRepo.create(input);
      
    } catch (error) {
      return this.handleError(error, 'crear archivo');
    }
  }

  /**
   * Obtener archivo por ID
   */
  async getFile(fileId: UUID): Promise<File> {
    try {
      this.ensureDbInitialized();

      const file = await this.fileRepo.findById(fileId);
      if (!file) {
        throw new Error('Archivo no encontrado');
      }

      return file;
      
    } catch (error) {
      return this.handleError(error, 'obtener archivo');
    }
  }

  /**
   * Obtener todos los archivos de una carpeta
   */
  async getFilesInFolder(folderId?: UUID): Promise<File[]> {
    try {
      this.ensureDbInitialized();

      if (folderId) {
        return await this.fileRepo.findByFolderId(folderId);
      } else {
        // Archivos sin carpeta (raíz)
        return await this.fileRepo.findAll({ folderId: null });
      }
      
    } catch (error) {
      return this.handleError(error, 'obtener archivos de carpeta');
    }
  }

  /**
   * Mover archivo a otra carpeta
   */
  async moveFile(fileId: UUID, targetFolderId: UUID): Promise<File> {
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
      return await this.fileRepo.update(fileId, {
        folderId: targetFolderId
      });
      
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
  async addTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<File> {
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
  async removeTagsFromFile(fileId: UUID, tagIds: UUID[]): Promise<File> {
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

  /** Validar que la carpeta destino existe y acepta archivos */
  private async validateTargetFolder(folderId: UUID): Promise<void> {
    const folder = await this.folderRepo.findById(folderId);
    if (!folder) {
      throw new Error('Carpeta destino no encontrada');
    }
    if (folder.status === 'deleted') {
      throw new Error('No se puede crear archivo en carpeta eliminada');
    }
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