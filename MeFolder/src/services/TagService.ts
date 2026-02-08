import { BaseService } from './base/BaseService';
import { 
  Tag, 
  CreateTagInput,
  TagType
} from '../types/entities/tag';
import { UUID } from '../types/common/base';
import { ColorInfo } from '../types/common/colors';

/**
 * TagService MVP - Funcionalidades básicas para desarrollo inicial
 * 
 * Funciones incluidas:
 * - Crear tag simple
 * - Obtener tag por ID
 * - Obtener todos los tags
 * - Buscar tags por nombre
 * - Actualizar tag (renombrar)
 * - Eliminar tag (soft delete)
 * - Obtener tags populares
 * 
 * Perfecta para construir MVP y gestión básica de etiquetas
 */
export class TagService extends BaseService {
  
  /**
   * Crear nuevo tag (operación básica)
   */
  async createTag(input: CreateTagInput): Promise<Tag> {
    try {
      this.ensureDbInitialized();
      
      // Validar que no existe otro tag con el mismo nombre
      await this.validateUniqueTagName(input.name);

      // Crear tag usando el repositorio
      return await this.tagRepo.create(input);
      
    } catch (error) {
      return this.handleError(error, 'crear tag');
    }
  }

  /**
   * Obtener tag por ID
   */
  async getTag(tagId: UUID): Promise<Tag> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) {
        throw new Error('Tag no encontrado');
      }

      return tag;
      
    } catch (error) {
      return this.handleError(error, 'obtener tag');
    }
  }

  /**
   * Obtener todos los tags activos
   */
  async getAllTags(): Promise<Tag[]> {
    try {
      this.ensureDbInitialized();

      return await this.tagRepo.findAll({ status: 'active' });
      
    } catch (error) {
      return this.handleError(error, 'obtener todos los tags');
    }
  }

  /**
   * Buscar tags por nombre (búsqueda parcial)
   */
  async searchTagsByName(query: string): Promise<Tag[]> {
    try {
      this.ensureDbInitialized();

      if (!query.trim()) {
        return await this.getAllTags();
      }

      return await this.tagRepo.search(query);
      
    } catch (error) {
      return this.handleError(error, 'buscar tags');
    }
  }

  /**
   * Obtener tags por tipo
   */
  async getTagsByType(type: TagType): Promise<Tag[]> {
    try {
      this.ensureDbInitialized();

      return await this.tagRepo.findAll({ 
        type,
        status: 'active' 
      });
      
    } catch (error) {
      return this.handleError(error, 'obtener tags por tipo');
    }
  }

  /**
   * Renombrar tag
   */
  async renameTag(tagId: UUID, newName: string): Promise<Tag> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error('Tag no encontrado');

      // Validar que no existe otro tag con el nuevo nombre
      await this.validateUniqueTagName(newName, tagId);

      // Actualizar nombre
      return await this.tagRepo.update(tagId, {
        name: newName
      });
      
    } catch (error) {
      return this.handleError(error, 'renombrar tag');
    }
  }

  /**
   * Actualizar color del tag
   */
  async updateTagColor(tagId: UUID, color: ColorInfo): Promise<Tag> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error('Tag no encontrado');

      return await this.tagRepo.update(tagId, { color });
      
    } catch (error) {
      return this.handleError(error, 'actualizar color del tag');
    }
  }

  /**
   * Eliminar tag (soft delete)
   */
  async deleteTag(tagId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error('Tag no encontrado');

      // No permitir eliminar tags del sistema
      if (tag.type === 'system') {
        throw new Error('No se pueden eliminar tags del sistema');
      }

      // Cambiar status a inactivo
      await this.tagRepo.update(tagId, { 
        isActive: false 
      });
      
      return true;
      
    } catch (error) {
      return this.handleError(error, 'eliminar tag');
    }
  }

  /**
   * Obtener tags más utilizados
   */
  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    try {
      this.ensureDbInitialized();

      return await this.tagRepo.findMostUsed(limit);
      
    } catch (error) {
      return this.handleError(error, 'obtener tags populares');
    }
  }

  /**
   * Obtener estadísticas de uso de un tag
   */
  async getTagUsageCount(tagId: UUID): Promise<number> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error('Tag no encontrado');

      // Contar archivos y carpetas que usan este tag
      const fileCount = await this.tagAssignmentRepo.getTagUsageInFiles(tagId);
      const folderCount = await this.tagAssignmentRepo.getTagUsageInFolders(tagId);
      
      return fileCount + folderCount;
      
    } catch (error) {
      return this.handleError(error, 'obtener estadísticas del tag');
    }
  }

  /**
   * Obtener archivos asociados a un tag
   */
  async getFilesWithTag(tagId: UUID): Promise<UUID[]> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error('Tag no encontrado');

      return await this.tagAssignmentRepo.getTaggedFiles(tagId);
      
    } catch (error) {
      return this.handleError(error, 'obtener archivos con tag');
    }
  }

  /**
   * Limpiar tags no utilizados (maintenance)
   */
  async cleanupUnusedTags(): Promise<number> {
    try {
      this.ensureDbInitialized();

      const allTags = await this.tagRepo.findAll({ 
        type: 'user', // Solo tags de usuario
        status: 'active' 
      });

      let deletedCount = 0;

      for (const tag of allTags) {
        const usageCount = await this.getTagUsageCount(tag.id);
        if (usageCount === 0) {
          await this.deleteTag(tag.id);
          deletedCount++;
        }
      }

      return deletedCount;
      
    } catch (error) {
      return this.handleError(error, 'limpiar tags no utilizados');
    }
  }

  /**
   * Crear tags predeterminados del sistema
   */
  async createSystemTags(): Promise<Tag[]> {
    try {
      this.ensureDbInitialized();

      const systemTags = [
        { name: 'Importante', color: { hex: '#ff4444', rgb: { r: 255, g: 68, b: 68 }, isSystem: true, systemName: 'red' as const }, type: 'system' as TagType },
        { name: 'Trabajo', color: { hex: '#4444ff', rgb: { r: 68, g: 68, b: 255 }, isSystem: true, systemName: 'blue' as const }, type: 'system' as TagType },
        { name: 'Personal', color: { hex: '#44ff44', rgb: { r: 68, g: 255, b: 68 }, isSystem: true, systemName: 'green' as const }, type: 'system' as TagType },
        { name: 'Documento', color: { hex: '#ffaa44', rgb: { r: 255, g: 170, b: 68 }, isSystem: true, systemName: 'orange' as const }, type: 'system' as TagType },
        { name: 'Imagen', color: { hex: '#aa44ff', rgb: { r: 170, g: 68, b: 255 }, isSystem: true, systemName: 'purple' as const }, type: 'system' as TagType },
        { name: 'Favorito', color: { hex: '#ff44aa', rgb: { r: 255, g: 68, b: 170 }, isSystem: true, systemName: 'pink' as const }, type: 'system' as TagType }
      ];

      const createdTags: Tag[] = [];

      for (const tagData of systemTags) {
        try {
          // Verificar si ya existe
          const existing = await this.tagRepo.findByName(tagData.name);
          if (!existing) {
            const tag = await this.tagRepo.create(tagData);
            createdTags.push(tag);
          }
        } catch {
          // Continuar si hay error con un tag específico
        }
      }

      return createdTags;
      
    } catch (error) {
      return this.handleError(error, 'crear tags del sistema');
    }
  }

  // ===== MÉTODOS PRIVADOS DE VALIDACIÓN =====

  /** Validar que no existe otro tag con el mismo nombre */
  private async validateUniqueTagName(name: string, excludeTagId?: UUID): Promise<void> {
    const existing = await this.tagRepo.findByName(name);
    
    if (existing && existing.id !== excludeTagId) {
      throw new Error(`Ya existe un tag con el nombre "${name}"`);
    }
  }
}