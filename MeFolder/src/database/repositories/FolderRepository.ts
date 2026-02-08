import { Database } from '../sqlite/Database';
import { FolderFactory } from '../../models/folder';
import { 
  Folder, 
  CreateFolderInput, 
  UpdateFolderInput, 
  FolderStatus, 
  FolderVisibility,
  FolderType,
  FolderViewSettings
} from '../../types/entities/folder';
import { UUID } from '../../types/common/base';
import { ColorInfo } from '../../types/common/colors';
import { FolderRepository } from '../../types/repositories/folder';

/**
 * Implementación del repositorio de carpetas.
 * Maneja todas las operaciones de base de datos para carpetas
 */
export class FolderRepositoryImplementation implements FolderRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Buscar carpeta por ID
   */
  async findById(id: UUID): Promise<Folder | null> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT * FROM folders WHERE id = ? AND status != ?',
        [id, 'deleted']
      );

      return row ? this.mapRowToFolder(row) : null;
    } catch (error) {
      console.error('Error finding folder by id:', error);
      throw new Error(`Error al buscar carpeta: ${error}`);
    }
  }

  /**
   * Obtener todas las carpetas con filtros opcionales
   */
  async findAll(filters?: any): Promise<Folder[]> {
    try {
      let sql = 'SELECT * FROM folders WHERE status != ?';
      const params: any[] = ['deleted'];

      // Aplicar filtros si existen
      if (filters) {
        if (filters.parentId) {
          sql += ' AND parent_id = ?';
          params.push(filters.parentId);
        }
        if (filters.status) {
          sql += ' AND status = ?';
          params.push(filters.status);
        }
        if (filters.visibility) {
          sql += ' AND visibility = ?';
          params.push(filters.visibility);
        }
        if (filters.type) {
          sql += ' AND type = ?';
          params.push(filters.type);
        }
        if (filters.level !== undefined) {
          sql += ' AND level = ?';
          params.push(filters.level);
        }
        if (filters.isSystemFolder !== undefined) {
          sql += ' AND is_system_folder = ?';
          params.push(filters.isSystemFolder);
        }
      }

      sql += ' ORDER BY name ASC';

      // Paginación si se especifica
      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
        if (filters?.offset) {
          sql += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const rows = await this.db.query<any>(sql, params);
      return rows.map(row => this.mapRowToFolder(row));
    } catch (error) {
      console.error('Error finding all folders:', error);
      throw new Error(`Error al buscar carpetas: ${error}`);
    }
  }

  /**
   * Crear nueva carpeta
   */
  async create(input: CreateFolderInput): Promise<Folder> {
    try {
      const folderModel = FolderFactory.create(input);
      const folder = folderModel.toJSON();

      const validation = folderModel.validate();
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      await this.db.transaction([
        {
          sql: `INSERT INTO folders (
            id, created_at, updated_at,
            name, description, parent_id, path, level,
            status, type, visibility,
            color_hex, color_rgb_r, color_rgb_g, color_rgb_b,
            icon, is_favorite, is_protected, is_system_folder,
            view_settings_sort_by, view_settings_sort_order, 
            view_settings_view_mode, view_settings_show_hidden_files,
            last_accessed_at, archived_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            folder.id, folder.createdAt, folder.updatedAt,
            folder.name, folder.description, folder.parentId, folder.path, folder.level,
            folder.status, folder.type, folder.visibility,
            folder.color?.hex, folder.color?.rgb.r, folder.color?.rgb.g, folder.color?.rgb.b,
            folder.icon, folder.isFavorite, folder.isProtected, folder.isSystemFolder,
            folder.viewSettings.sortBy, folder.viewSettings.sortOrder,
            folder.viewSettings.viewMode, folder.viewSettings.showHiddenFiles,
            folder.lastAccessedAt, folder.archivedAt
          ]
        },
        // Insertar tags si existen
        ...(folder.tagIds?.map(tagId => ({
          sql: 'INSERT INTO folder_tags (folder_id, tag_id) VALUES (?, ?)',
          params: [folder.id, tagId]
        })) || [])
      ]);

      return folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Error al crear carpeta: ${error}`);
    }
  }

  /**
   * Actualizar carpeta existente
   */
  async update(id: UUID, input: UpdateFolderInput): Promise<Folder> {
    try {
      const existingFolder = await this.findById(id);
      if (!existingFolder) {
        throw new Error('Carpeta no encontrada');
      }

      const folderModel = FolderFactory.fromJSON(existingFolder);

      const updateData: any = { ...input };
      
      if (input.viewSettings) {
        updateData.viewSettings = {
          ...existingFolder.viewSettings,
          ...input.viewSettings
        };
      }
      
      folderModel.update(updateData);

      const validation = folderModel.validate();
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const folder = folderModel.toJSON();

      await this.db.execute(`
        UPDATE folders SET 
          updated_at = ?,
          name = ?, 
          description = ?,
          parent_id = ?, 
          path = ?, 
          level = ?,
          status = ?, 
          type = ?,
          visibility = ?,
          color_hex = ?, 
          color_rgb_r = ?, 
          color_rgb_g = ?, 
          color_rgb_b = ?,
          icon = ?,
          is_favorite = ?,
          is_protected = ?,
          view_settings_sort_by = ?,
          view_settings_sort_order = ?,
          view_settings_view_mode = ?,
          view_settings_show_hidden_files = ?,
          last_accessed_at = ?,
          archived_at = ?
        WHERE id = ?
      `, [
        folder.updatedAt,
        folder.name, folder.description, folder.parentId, folder.path, folder.level,
        folder.status, folder.type, folder.visibility,
        folder.color?.hex, folder.color?.rgb.r, folder.color?.rgb.g, folder.color?.rgb.b,
        folder.icon, folder.isFavorite, folder.isProtected,
        folder.viewSettings.sortBy, folder.viewSettings.sortOrder,
        folder.viewSettings.viewMode, folder.viewSettings.showHiddenFiles,
        folder.lastAccessedAt, folder.archivedAt,
        id
      ]);

      return folder;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw new Error(`Error al actualizar carpeta: ${error}`);
    }
  }

  /**
   * Eliminación lógica (cambiar status a 'deleted')
   */
  async delete(id: UUID): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'UPDATE folders SET status = ?, updated_at = ? WHERE id = ?',
        ['deleted', new Date(), id]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw new Error(`Error al eliminar carpeta: ${error}`);
    }
  }

  /**
   * Contar carpetas con filtros opcionales
   */
  async count(filters?: any): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as total FROM folders WHERE status != ?';
      const params: any[] = ['deleted'];

      if (filters?.parentId) {
        sql += ' AND parent_id = ?';
        params.push(filters.parentId);
      }

      const [result] = await this.db.query<{ total: number }>(sql, params);
      return result?.total || 0;
    } catch (error) {
      console.error('Error counting folders:', error);
      throw new Error(`Error al contar carpetas: ${error}`);
    }
  }

  /**
   * Verificar si existe una carpeta
   */
  async exists(id: UUID): Promise<boolean> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM folders WHERE id = ? AND status != ?',
        [id, 'deleted']
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking folder existence:', error);
      return false;
    }
  }

  /**
   * Buscar carpetas por carpeta padre
   */
  async findByFolderId(folderId: UUID): Promise<Folder[]> {
    return this.findAll({ parentId: folderId });
  }

  /**
   * Buscar carpetas por nivel jerárquico
   */
  async findByLevel(level: number): Promise<Folder[]> {
    return this.findAll({ level });
  }

  /**
   * Buscar carpetas por visibilidad
   */
  async findByVisibility(visibility: string): Promise<Folder[]> {
    return this.findAll({ visibility });
  }

  /**
   * Buscar carpetas por estado
   */
  async findByStatus(status: string): Promise<Folder[]> {
    return this.findAll({ status });
  }

  /**
   * Buscar carpetas que tengan ciertos tags
   */
  async findByTagIds(tagIds: UUID[]): Promise<Folder[]> {
    try {
      if (tagIds.length === 0) return [];

      const placeholders = tagIds.map(() => '?').join(',');
      const sql = `
        SELECT DISTINCT f.* FROM folders f
        INNER JOIN folder_tags ft ON f.id = ft.folder_id
        WHERE ft.tag_id IN (${placeholders})
        AND f.status != 'deleted'
        ORDER BY f.name ASC
      `;

      const rows = await this.db.query<any>(sql, tagIds);
      return rows.map(row => this.mapRowToFolder(row));
    } catch (error) {
      console.error('Error finding folders by tags:', error);
      throw new Error(`Error al buscar carpetas por tags: ${error}`);
    }
  }

  /**
   * Actualizar tags de una carpeta
   */
  async updateTags(folderId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      await this.db.transaction([
        // Eliminar tags existentes
        {
          sql: 'DELETE FROM folder_tags WHERE folder_id = ?',
          params: [folderId]
        },
        // Insertar nuevos tags
        ...tagIds.map(tagId => ({
          sql: 'INSERT INTO folder_tags (folder_id, tag_id) VALUES (?, ?)',
          params: [folderId, tagId]
        }))
      ]);
    } catch (error) {
      console.error('Error updating folder tags:', error);
      throw new Error(`Error al actualizar tags de la carpeta: ${error}`);
    }
  }

  /**
   * Búsqueda de carpetas por texto
   */
  async search(query: string, filters?: any): Promise<Folder[]> {
    try {
      let sql = `
        SELECT * FROM folders 
        WHERE status != 'deleted' 
        AND (name LIKE ? OR description LIKE ?)
      `;
      const params: any[] = [`%${query}%`, `%${query}%`];

      if (filters) {
        if (filters.parentId) {
          sql += ' AND parent_id = ?';
          params.push(filters.parentId);
        }
        if (filters.type) {
          sql += ' AND type = ?';
          params.push(filters.type);
        }
        if (filters.level !== undefined) {
          sql += ' AND level = ?';
          params.push(filters.level);
        }
      }

      sql += ' ORDER BY name ASC';

      const rows = await this.db.query<any>(sql, params);
      return rows.map(row => this.mapRowToFolder(row));
    } catch (error) {
      console.error('Error searching folders:', error);
      throw new Error(`Error al buscar carpetas: ${error}`);
    }
  }

  /**
   * Mapear fila de base de datos a objeto Folder
   */
  private mapRowToFolder(row: any): Folder {
    const baseFolder = {
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      name: row.name,
      path: row.path,
      level: row.level,
      status: row.status as FolderStatus,
      type: row.type as FolderType,
      visibility: row.visibility as FolderVisibility,
      tagIds: [], 
      viewSettings: {
        sortBy: row.view_settings_sort_by || 'name',
        sortOrder: row.view_settings_sort_order || 'asc',
        viewMode: row.view_settings_view_mode || 'list',
        showHiddenFiles: row.view_settings_show_hidden_files || false,
      } as FolderViewSettings,
      isFavorite: Boolean(row.is_favorite),
      isProtected: Boolean(row.is_protected),
      isSystemFolder: Boolean(row.is_system_folder),
    };

    return {
      ...baseFolder,
      
      ...(row.description && { description: row.description }),
      ...(row.parent_id && { parentId: row.parent_id }),
      ...(row.color_hex && {
        color: {
          hex: row.color_hex,
          rgb: {
            r: row.color_rgb_r,
            g: row.color_rgb_g,
            b: row.color_rgb_b,
          },
          isSystem: false,
        } as ColorInfo,
      }),
      ...(row.icon && { icon: row.icon }),
      ...(row.last_accessed_at && { lastAccessedAt: new Date(row.last_accessed_at) }),
      ...(row.archived_at && { archivedAt: new Date(row.archived_at) }),
    };
  }
}