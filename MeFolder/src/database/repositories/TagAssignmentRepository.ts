import { Database } from '../sqlite/Database';
import { 
  Tag, 
  TagType,
  TagPriority
} from '../../types/entities/tag';
import { UUID } from '../../types/common/base';
import { 
  TagAssignmentRepository, 
  TagAssignmentStats, 
  TagWithUsage 
} from '../../types/repositories/tag';

/**
 * Implementación del repositorio de asignaciones de etiquetas.
 * Maneja relaciones entre etiquetas y archivos/carpetas
 */
export class TagAssignmentRepositoryImplementation implements TagAssignmentRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  // ===== OPERACIONES PARA ARCHIVOS =====

  /**
   * Asignar etiquetas a un archivo
   */
  async assignTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      if (tagIds.length === 0) return;

      // Primero obtener tags existentes para evitar duplicados
      const existingTagIds = await this.getFileTagIds(fileId);
      const newTagIds = tagIds.filter(id => !existingTagIds.includes(id));

      if (newTagIds.length === 0) return;

      const queries = newTagIds.map(tagId => ({
        sql: 'INSERT INTO file_tags (file_id, tag_id, created_at) VALUES (?, ?, ?)',
        params: [fileId, tagId, new Date()]
      }));

      await this.db.transaction(queries);
    } catch (error) {
      console.error('Error assigning tags to file:', error);
      throw new Error(`Error al asignar etiquetas al archivo: ${error}`);
    }
  }

  /**
   * Remover etiquetas de un archivo
   */
  async removeTagsFromFile(fileId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      if (tagIds.length === 0) return;

      const placeholders = tagIds.map(() => '?').join(',');
      await this.db.execute(
        `DELETE FROM file_tags WHERE file_id = ? AND tag_id IN (${placeholders})`,
        [fileId, ...tagIds]
      );
    } catch (error) {
      console.error('Error removing tags from file:', error);
      throw new Error(`Error al remover etiquetas del archivo: ${error}`);
    }
  }

  /**
   * Obtener IDs de etiquetas de un archivo
   */
  async getFileTagIds(fileId: UUID): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ tag_id: UUID }>(
        'SELECT tag_id FROM file_tags WHERE file_id = ?',
        [fileId]
      );
      return rows.map(row => row.tag_id);
    } catch (error) {
      console.error('Error getting file tag ids:', error);
      throw new Error(`Error al obtener etiquetas del archivo: ${error}`);
    }
  }

  /**
   * Obtener objetos Tag completos de un archivo
   */
  async getFileTags(fileId: UUID): Promise<Tag[]> {
    try {
      const rows = await this.db.query<any>(`
        SELECT t.* FROM tags t
        INNER JOIN file_tags ft ON t.id = ft.tag_id
        WHERE ft.file_id = ? AND t.is_active = ?
        ORDER BY t.name
      `, [fileId, true]);

      return rows.map(row => this.mapRowToTag(row));
    } catch (error) {
      console.error('Error getting file tags:', error);
      throw new Error(`Error al obtener etiquetas del archivo: ${error}`);
    }
  }

  // ===== OPERACIONES PARA CARPETAS =====

  /**
   * Asignar etiquetas a una carpeta
   */
  async assignTagsToFolder(folderId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      if (tagIds.length === 0) return;

      const existingTagIds = await this.getFolderTagIds(folderId);
      const newTagIds = tagIds.filter(id => !existingTagIds.includes(id));

      if (newTagIds.length === 0) return;

      const queries = newTagIds.map(tagId => ({
        sql: 'INSERT INTO folder_tags (folder_id, tag_id, created_at) VALUES (?, ?, ?)',
        params: [folderId, tagId, new Date()]
      }));

      await this.db.transaction(queries);
    } catch (error) {
      console.error('Error assigning tags to folder:', error);
      throw new Error(`Error al asignar etiquetas a la carpeta: ${error}`);
    }
  }

  /**
   * Remover etiquetas de una carpeta
   */
  async removeTagsFromFolder(folderId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      if (tagIds.length === 0) return;

      const placeholders = tagIds.map(() => '?').join(',');
      await this.db.execute(
        `DELETE FROM folder_tags WHERE folder_id = ? AND tag_id IN (${placeholders})`,
        [folderId, ...tagIds]
      );
    } catch (error) {
      console.error('Error removing tags from folder:', error);
      throw new Error(`Error al remover etiquetas de la carpeta: ${error}`);
    }
  }

  /**
   * Obtener IDs de etiquetas de una carpeta
   */
  async getFolderTagIds(folderId: UUID): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ tag_id: UUID }>(
        'SELECT tag_id FROM folder_tags WHERE folder_id = ?',
        [folderId]
      );
      return rows.map(row => row.tag_id);
    } catch (error) {
      console.error('Error getting folder tag ids:', error);
      throw new Error(`Error al obtener etiquetas de la carpeta: ${error}`);
    }
  }

  /**
   * Obtener objetos Tag completos de una carpeta
   */
  async getFolderTags(folderId: UUID): Promise<Tag[]> {
    try {
      const rows = await this.db.query<any>(`
        SELECT t.* FROM tags t
        INNER JOIN folder_tags ft ON t.id = ft.tag_id
        WHERE ft.folder_id = ? AND t.is_active = ?
        ORDER BY t.name
      `, [folderId, true]);

      return rows.map(row => this.mapRowToTag(row));
    } catch (error) {
      console.error('Error getting folder tags:', error);
      throw new Error(`Error al obtener etiquetas de la carpeta: ${error}`);
    }
  }

  // ===== OPERACIONES MIXTAS =====

  /**
   * Obtener archivos que tienen una etiqueta específica
   */
  async getTaggedFiles(tagId: UUID): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ file_id: UUID }>(
        'SELECT file_id FROM file_tags WHERE tag_id = ?',
        [tagId]
      );
      return rows.map(row => row.file_id);
    } catch (error) {
      console.error('Error getting tagged files:', error);
      throw new Error(`Error al obtener archivos con etiqueta: ${error}`);
    }
  }

  /**
   * Obtener carpetas que tienen una etiqueta específica
   */
  async getTaggedFolders(tagId: UUID): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ folder_id: UUID }>(
        'SELECT folder_id FROM folder_tags WHERE tag_id = ?',
        [tagId]
      );
      return rows.map(row => row.folder_id);
    } catch (error) {
      console.error('Error getting tagged folders:', error);
      throw new Error(`Error al obtener carpetas con etiqueta: ${error}`);
    }
  }

  /**
   * Contar uso de etiqueta en archivos
   */
  async getTagUsageInFiles(tagId: UUID): Promise<number> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM file_tags WHERE tag_id = ?',
        [tagId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting tag usage in files:', error);
      return 0;
    }
  }

  /**
   * Contar uso de etiqueta en carpetas
   */
  async getTagUsageInFolders(tagId: UUID): Promise<number> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM folder_tags WHERE tag_id = ?',
        [tagId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting tag usage in folders:', error);
      return 0;
    }
  }

  /**
   * Obtener uso total de una etiqueta (archivos + carpetas)
   */
  async getTotalTagUsage(tagId: UUID): Promise<number> {
    try {
      const filesUsage = await this.getTagUsageInFiles(tagId);
      const foldersUsage = await this.getTagUsageInFolders(tagId);
      return filesUsage + foldersUsage;
    } catch (error) {
      console.error('Error getting total tag usage:', error);
      return 0;
    }
  }

  // ===== OPERACIONES DE LIMPIEZA =====

  /**
   * Limpiar etiquetas no utilizadas
   */
  async cleanupUnusedTags(): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ id: UUID }>(`
        SELECT t.id FROM tags t
        LEFT JOIN file_tags ft ON t.id = ft.tag_id
        LEFT JOIN folder_tags fot ON t.id = fot.tag_id
        WHERE t.is_active = ? 
        AND t.type != 'system'
        AND ft.tag_id IS NULL 
        AND fot.tag_id IS NULL
      `, [true]);

      const unusedTagIds = rows.map(row => row.id);

      if (unusedTagIds.length > 0) {
        const placeholders = unusedTagIds.map(() => '?').join(',');
        await this.db.execute(
          `UPDATE tags SET is_active = ?, updated_at = ? WHERE id IN (${placeholders})`,
          [false, new Date(), ...unusedTagIds]
        );
      }

      return unusedTagIds;
    } catch (error) {
      console.error('Error cleaning unused tags:', error);
      throw new Error(`Error al limpiar etiquetas no utilizadas: ${error}`);
    }
  }

  /**
   * Remover todas las etiquetas de un archivo
   */
  async removeAllTagsFromFile(fileId: UUID): Promise<void> {
    try {
      await this.db.execute(
        'DELETE FROM file_tags WHERE file_id = ?',
        [fileId]
      );
    } catch (error) {
      console.error('Error removing all tags from file:', error);
      throw new Error(`Error al remover todas las etiquetas del archivo: ${error}`);
    }
  }

  /**
   * Remover todas las etiquetas de una carpeta
   */
  async removeAllTagsFromFolder(folderId: UUID): Promise<void> {
    try {
      await this.db.execute(
        'DELETE FROM folder_tags WHERE folder_id = ?',
        [folderId]
      );
    } catch (error) {
      console.error('Error removing all tags from folder:', error);
      throw new Error(`Error al remover todas las etiquetas de la carpeta: ${error}`);
    }
  }

  // ===== ESTADÍSTICAS =====

  /**
   * Obtener estadísticas de asignación de una etiqueta
   */
  async getTagAssignmentStats(tagId: UUID): Promise<TagAssignmentStats> {
    try {
      const filesCount = await this.getTagUsageInFiles(tagId);
      const foldersCount = await this.getTagUsageInFolders(tagId);
      const totalUsage = filesCount + foldersCount;

      // Obtener fecha de último uso
      const [lastUsedResult] = await this.db.query<{ last_used: string }>(`
        SELECT MAX(created_at) as last_used FROM (
          SELECT created_at FROM file_tags WHERE tag_id = ?
          UNION ALL
          SELECT created_at FROM folder_tags WHERE tag_id = ?
        )
      `, [tagId, tagId]);

      // Verificar si es la más usada en archivos/carpetas
      const [mostUsedInFilesResult] = await this.db.query<{ max_usage: number }>(`
        SELECT MAX(usage_count) as max_usage FROM (
          SELECT COUNT(*) as usage_count FROM file_tags GROUP BY tag_id
        )
      `);

      const [mostUsedInFoldersResult] = await this.db.query<{ max_usage: number }>(`
        SELECT MAX(usage_count) as max_usage FROM (
          SELECT COUNT(*) as usage_count FROM folder_tags GROUP BY tag_id
        )
      `);

      return {
        tagId,
        filesCount,
        foldersCount,
        totalUsage,
        mostUsedInFiles: filesCount === (mostUsedInFilesResult?.max_usage || 0),
        mostUsedInFolders: foldersCount === (mostUsedInFoldersResult?.max_usage || 0),
        ...(lastUsedResult?.last_used && { lastUsed: new Date(lastUsedResult.last_used) })
      };
    } catch (error) {
      console.error('Error getting tag assignment stats:', error);
      throw new Error(`Error al obtener estadísticas de la etiqueta: ${error}`);
    }
  }

  /**
   * Obtener etiquetas populares con información de uso
   */
  async getPopularTags(limit: number): Promise<TagWithUsage[]> {
    try {
      const rows = await this.db.query<any>(`
        SELECT 
          t.*,
          COALESCE(file_usage.count, 0) as files_usage,
          COALESCE(folder_usage.count, 0) as folders_usage,
          (COALESCE(file_usage.count, 0) + COALESCE(folder_usage.count, 0)) as total_usage
        FROM tags t
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as count 
          FROM file_tags 
          GROUP BY tag_id
        ) file_usage ON t.id = file_usage.tag_id
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as count 
          FROM folder_tags 
          GROUP BY tag_id
        ) folder_usage ON t.id = folder_usage.tag_id
        WHERE t.is_active = ?
        ORDER BY total_usage DESC, t.name ASC
        LIMIT ?
      `, [true, limit]);

      // Calcular porcentaje de uso total
      const totalAssignments = rows.reduce((sum, row) => sum + row.total_usage, 0);

      return rows.map(row => ({
        ...this.mapRowToTag(row),
        filesUsage: row.files_usage,
        foldersUsage: row.folders_usage,
        totalUsage: row.total_usage,
        usagePercentage: totalAssignments > 0 ? (row.total_usage / totalAssignments) * 100 : 0
      }));
    } catch (error) {
      console.error('Error getting popular tags:', error);
      throw new Error(`Error al obtener etiquetas populares: ${error}`);
    }
  }

  /**
   * Mapear fila de base de datos a objeto Tag
   */
  private mapRowToTag(row: any): Tag {
    return {
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      name: row.name,
      type: row.type as TagType,
      priority: row.priority as TagPriority,
      isActive: Boolean(row.is_active),
      color: {
        hex: row.color_hex,
        rgb: {
          r: row.color_rgb_r,
          g: row.color_rgb_g,
          b: row.color_rgb_b,
        },
        isSystem: row.type === 'system',
      },
      usageCount: row.usage_count,
      
      ...(row.description && { description: row.description }),
      ...(row.parent_id && { parentId: row.parent_id }),
      ...(row.last_used_at && { lastUsedAt: new Date(row.last_used_at) }),
    };
  }
}