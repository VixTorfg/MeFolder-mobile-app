import { BaseService } from './base/BaseService';
import { 
  Folder, 
  CreateFolderInput,
  FolderStatus
} from '../types/entities/folder';
import { UUID } from '../types/common/base';
import { FolderModel, FolderFactory } from '../models/folder';

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
  
  /**
   * Crear nueva carpeta (operación básica)
   */
  async createFolder(input: CreateFolderInput): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();
      
      // Validar carpeta padre si se especifica
      if (input.parentId) {
        await this.validateParentFolder(input.parentId);
      }

      // Validar nombre único en el mismo nivel
      await this.validateUniqueFolderName(input.name, input.parentId || null);

      // Crear carpeta usando el repositorio
      const folder = await this.folderRepo.create(input);
      return FolderFactory.fromJSON(folder);
      
    } catch (error) {
      return this.handleError(error, 'crear carpeta');
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
        throw new Error('Carpeta no encontrada');
      }

      return FolderFactory.fromJSON(folder);
      
    } catch (error) {
      return this.handleError(error, 'obtener carpeta');
    }
  }

  /**
   * Obtener subcarpetas de una carpeta
   */
  async getSubfolders(parentId?: UUID): Promise<FolderModel[]> {
    try {
      this.ensureDbInitialized();

      let folders: Folder[];
      if (parentId) {
        folders = await this.folderRepo.findByFolderId(parentId);
      } else {
        folders = await this.folderRepo.findRootFolders();
      }

      return folders.map(f => FolderFactory.fromJSON(f));
      
    } catch (error) {
      return this.handleError(error, 'obtener subcarpetas');
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
      
      while (currentId) {
        const folder = await this.folderRepo.findById(currentId);
        if (!folder) break;
        
        path.unshift(folder.name);
        currentId = folder.parentId || null;
      }

      return path;
      
    } catch (error) {
      return this.handleError(error, 'obtener ruta de carpeta');
    }
  }

  /**
   * Mover carpeta a otro padre
   */
  async moveFolder(folderId: UUID, newParentId: UUID | null): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error('Carpeta no encontrada');

      // Validar que no sea su propio descendiente (evitar bucles)
      if (newParentId) {
        await this.validateNotDescendant(folderId, newParentId);
        await this.validateParentFolder(newParentId);
      }

      // Validar nombre único en nuevo nivel
      await this.validateUniqueFolderName(folder.name, newParentId, folderId);

      // Actualizar carpeta padre
      const updateData: { parentId?: UUID } = {};
      if (newParentId !== null) {
        updateData.parentId = newParentId;
      }
      
      const updated = await this.folderRepo.update(folderId, updateData);
      return FolderFactory.fromJSON(updated);
      
    } catch (error) {
      return this.handleError(error, 'mover carpeta');
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
      if (!folder) throw new Error('Carpeta no encontrada');

      // Verificar si está vacía (no forzado)
      if (!force) {
        await this.validateFolderEmpty(folderId);
      }

      // Cambiar status a eliminado
      await this.folderRepo.update(folderId, { 
        status: 'deleted' as FolderStatus 
      });
      
      return true;
      
    } catch (error) {
      return this.handleError(error, 'eliminar carpeta');
    }
  }

  /**
   * Contar contenido de una carpeta (archivos + subcarpetas)
   */
  async getFolderContentCount(folderId: UUID): Promise<{ files: number; folders: number }> {
    try {
      this.ensureDbInitialized();

      const [files, subfolders] = await Promise.all([
        this.fileRepo.findByFolderId(folderId),
        this.folderRepo.findByFolderId(folderId)
      ]);

      return {
        files: files.length,
        folders: subfolders.length
      };
      
    } catch (error) {
      return this.handleError(error, 'contar contenido de carpeta');
    }
  }

  /**
   * Renombrar carpeta
   */
  async renameFolder(folderId: UUID, newName: string): Promise<FolderModel> {
    try {
      this.ensureDbInitialized();

      const folder = await this.folderRepo.findById(folderId);
      if (!folder) throw new Error('Carpeta no encontrada');

      // Validar nombre único en el mismo nivel
      await this.validateUniqueFolderName(newName, folder.parentId || null, folderId);

      // Actualizar nombre
      const updated = await this.folderRepo.update(folderId, {
        name: newName
      });
      return FolderFactory.fromJSON(updated);
      
    } catch (error) {
      return this.handleError(error, 'renombrar carpeta');
    }
  }

  // ===== MÉTODOS PRIVADOS DE VALIDACIÓN =====

  /** Validar que la carpeta padre existe */
  private async validateParentFolder(parentId: UUID): Promise<void> {
    const parent = await this.folderRepo.findById(parentId);
    if (!parent) {
      throw new Error('Carpeta padre no encontrada');
    }
    if (parent.status === 'deleted') {
      throw new Error('No se puede crear subcarpeta en carpeta eliminada');
    }
  }

  /** Validar que no existe otra carpeta con el mismo nombre en el nivel */
  private async validateUniqueFolderName(name: string, parentId: UUID | null, excludeFolderId?: UUID): Promise<void> {
    const siblings = parentId ? await this.folderRepo.findByFolderId(parentId) : await this.folderRepo.findAll({ parentId: null });
    const conflicting = siblings.find((f: Folder) => 
      f.name === name && f.id !== excludeFolderId
    );
    
    if (conflicting) {
      throw new Error(`Ya existe una carpeta con el nombre "${name}" en este nivel`);
    }
  }

  /** Validar que la carpeta no sea descendiente de la carpeta destino */
  private async validateNotDescendant(folderId: UUID, targetParentId: UUID): Promise<void> {
    let currentId: UUID | null = targetParentId;
    
    while (currentId) {
      if (currentId === folderId) {
        throw new Error('No se puede mover una carpeta dentro de sí misma');
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
      throw new Error('No se puede eliminar carpeta que contiene archivos o subcarpetas');
    }
  }
}