import { Database } from '../sqlite/Database';
import { FileFactory } from '../../models/file';
import { 
  File, 
  CreateFileInput, 
  UpdateFileInput, 
  FileStatus, 
  FileVisibility,
  FileMetadata 
} from '../../types/entities/file';
import { FileExtension, FileCategory } from '../../types/common/file-extensions';
import { UUID } from '../../types/common/base';
import { FileRepository } from '../../types/repositories/file';

/**
 * Implementación del repositorio de archivos.
 * Maneja todas las operaciones de base de datos para archivos
 */
export class FileRepositoryImplementation implements FileRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Buscar archivo por ID
   */
  async findById(id: UUID): Promise<File | null> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT * FROM files WHERE id = ? AND status != ?',
        [id, 'deleted']
      );

      return row ? this.mapRowToFile(row) : null;
    } catch (error) {
      console.error('Error finding file by id:', error);
      throw new Error(`Error al buscar archivo: ${error}`);
    }
  }

  /**
   * Obtener todos los archivos con filtros opcionales
   */
  async findAll(filters?: any): Promise<File[]> {
    try {
      let sql = 'SELECT * FROM files WHERE status != ?';
      const params: any[] = ['deleted'];

      // Aplicar filtros si existen
      if (filters) {
        if (filters.folderId) {
          sql += ' AND folder_id = ?';
          params.push(filters.folderId);
        }
        if (filters.status) {
          sql += ' AND status = ?';
          params.push(filters.status);
        }
        if (filters.extensions && filters.extensions.length > 0) {
          const placeholders = filters.extensions.map(() => '?').join(',');
          sql += ` AND extension IN (${placeholders})`;
          params.push(...filters.extensions);
        }
        if (filters.category) {
          sql += ' AND category = ?';
          params.push(filters.category);
        }
      }

      sql += ' ORDER BY created_at DESC';

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
      return rows.map(row => this.mapRowToFile(row));
    } catch (error) {
      console.error('Error finding all files:', error);
      throw new Error(`Error al buscar archivos: ${error}`);
    }
  }

  /**
   * Crear nuevo archivo
   */
  async create(input: CreateFileInput): Promise<File> {
    try {
      const fileModel = FileFactory.create(input);
      const file = fileModel.toJSON();

      // Validar antes de insertar
      const validation = fileModel.validate();
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      await this.db.transaction([
        {
          sql: `INSERT INTO files (
            id, created_at, updated_at,
            name, original_name, extension, category, description,
            folder_id, path, status, visibility,
            metadata_size, metadata_mime_type, metadata_checksum,
            metadata_image_width, metadata_image_height, metadata_image_orientation,
            metadata_video_duration, metadata_video_width, metadata_video_height, metadata_video_framerate,
            metadata_audio_duration, metadata_audio_bitrate, metadata_audio_sample_rate,
            color_hex, color_rgb_r, color_rgb_g, color_rgb_b,
            last_accessed_at, archived_at, storage_url, thumbnail_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            file.id, file.createdAt, file.updatedAt,
            file.name, file.originalName, file.extension, file.category, file.description,
            file.folderId, file.path, file.status, file.visibility,
            file.metadata.size, file.metadata.mimeType, file.metadata.checksum,
            file.metadata.imageMetadata?.width, file.metadata.imageMetadata?.height, file.metadata.imageMetadata?.orientation,
            file.metadata.videoMetadata?.duration, file.metadata.videoMetadata?.width, file.metadata.videoMetadata?.height, file.metadata.videoMetadata?.framerate,
            file.metadata.audioMetadata?.duration, file.metadata.audioMetadata?.bitrate, file.metadata.audioMetadata?.sampleRate,
            file.color?.hex, file.color?.rgb.r, file.color?.rgb.g, file.color?.rgb.b,
            file.lastAccessedAt, file.archivedAt, file.storageUrl, file.thumbnailUrl
          ]
        },
        // Insertar tags si existen
        ...(file.tagIds?.map(tagId => ({
          sql: 'INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)',
          params: [file.id, tagId]
        })) || [])
      ]);

      return file;
    } catch (error) {
      console.error('Error creating file:', error);
      throw new Error(`Error al crear archivo: ${error}`);
    }
  }

  /**
   * Actualizar archivo existente
   */
  async update(id: UUID, input: UpdateFileInput): Promise<File> {
    try {
      const existingFile = await this.findById(id);
      if (!existingFile) {
        throw new Error('Archivo no encontrado');
      }

      const fileModel = FileFactory.fromJSON(existingFile);
      fileModel.update(input);

      const validation = fileModel.validate();
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const file = fileModel.toJSON();

      await this.db.execute(`
        UPDATE files SET 
          updated_at = ?,
          name = ?, 
          folder_id = ?, 
          path = ?, 
          status = ?, 
          visibility = ?,
          description = ?,
          color_hex = ?, 
          color_rgb_r = ?, 
          color_rgb_g = ?, 
          color_rgb_b = ?,
          last_accessed_at = ?,
          archived_at = ?
        WHERE id = ?
      `, [
        file.updatedAt,
        file.name, file.folderId, file.path, file.status, file.visibility, file.description,
        file.color?.hex, file.color?.rgb.r, file.color?.rgb.g, file.color?.rgb.b,
        file.lastAccessedAt, file.archivedAt,
        id
      ]);

      return file;
    } catch (error) {
      console.error('Error updating file:', error);
      throw new Error(`Error al actualizar archivo: ${error}`);
    }
  }

  /**
   * Eliminación lógica (cambiar status a 'deleted')
   */
  async delete(id: UUID): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'UPDATE files SET status = ?, updated_at = ? WHERE id = ?',
        ['deleted', new Date(), id]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Error al eliminar archivo: ${error}`);
    }
  }

  /**
   * Contar archivos con filtros opcionales
   */
  async count(filters?: any): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as total FROM files WHERE status != ?';
      const params: any[] = ['deleted'];

      if (filters?.folderId) {
        sql += ' AND folder_id = ?';
        params.push(filters.folderId);
      }

      const [result] = await this.db.query<{ total: number }>(sql, params);
      return result?.total || 0;
    } catch (error) {
      console.error('Error counting files:', error);
      throw new Error(`Error al contar archivos: ${error}`);
    }
  }

  /**
   * Verificar si existe un archivo
   */
  async exists(id: UUID): Promise<boolean> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM files WHERE id = ? AND status != ?',
        [id, 'deleted']
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Buscar archivos por carpeta
   */
  async findByFolderId(folderId: UUID): Promise<File[]> {
    return this.findAll({ folderId });
  }

  /**
   * Buscar archivos por extensión  
   */
  async findByExtension(extension: FileExtension): Promise<File[]> {
    return this.findAll({ extensions: [extension] });
  }

  /**
   * Buscar archivos por categoría
   */
  async findByCategory(category: string): Promise<File[]> {
    return this.findAll({ category });
  }

  /**
   * Buscar archivos por estado
   */
  async findByStatus(status: string): Promise<File[]> {
    return this.findAll({ status });
  }

  /**
   * Buscar archivos que tengan ciertos tags
   */
  async findByTagIds(tagIds: UUID[]): Promise<File[]> {
    try {
      if (tagIds.length === 0) return [];

      const placeholders = tagIds.map(() => '?').join(',');
      const sql = `
        SELECT DISTINCT f.* FROM files f
        INNER JOIN file_tags ft ON f.id = ft.file_id
        WHERE ft.tag_id IN (${placeholders})
        AND f.status != 'deleted'
        ORDER BY f.created_at DESC
      `;

      const rows = await this.db.query<any>(sql, tagIds);
      return rows.map(row => this.mapRowToFile(row));
    } catch (error) {
      console.error('Error finding files by tags:', error);
      throw new Error(`Error al buscar archivos por tags: ${error}`);
    }
  }

  /**
   * Actualizar tags de un archivo
   */
  async updateTags(fileId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      await this.db.transaction([
        // Eliminar tags existentes
        {
          sql: 'DELETE FROM file_tags WHERE file_id = ?',
          params: [fileId]
        },
        // Insertar nuevos tags
        ...tagIds.map(tagId => ({
          sql: 'INSERT INTO file_tags (file_id, tag_id) VALUES (?, ?)',
          params: [fileId, tagId]
        }))
      ]);
    } catch (error) {
      console.error('Error updating file tags:', error);
      throw new Error(`Error al actualizar tags del archivo: ${error}`);
    }
  }

  /**
   * Búsqueda de archivos por texto
   */
  async search(query: string, filters?: any): Promise<File[]> {
    try {
      let sql = `
        SELECT * FROM files 
        WHERE status != 'deleted' 
        AND (name LIKE ? OR description LIKE ?)
      `;
      const params: any[] = [`%${query}%`, `%${query}%`];

      if (filters) {
        if (filters.folderId) {
          sql += ' AND folder_id = ?';
          params.push(filters.folderId);
        }
        if (filters.category) {
          sql += ' AND category = ?';
          params.push(filters.category);
        }
      }

      sql += ' ORDER BY name ASC';

      const rows = await this.db.query<any>(sql, params);
      return rows.map(row => this.mapRowToFile(row));
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error(`Error al buscar archivos: ${error}`);
    }
  }

  /**
   * Mapear fila de base de datos a objeto File
   */
  private mapRowToFile(row: any): File {
    
    const baseFile = {
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      name: row.name,
      originalName: row.original_name,
      extension: row.extension as FileExtension,
      category: row.category as FileCategory,
      path: row.path,
      status: row.status as FileStatus,
      visibility: row.visibility as FileVisibility,
      tagIds: [], 
    };

    const metadata: FileMetadata = {
      size: row.metadata_size,
      ...(row.metadata_mime_type && { mimeType: row.metadata_mime_type }),
      ...(row.metadata_checksum && { checksum: row.metadata_checksum }),
      ...(row.metadata_image_width && {
        imageMetadata: {
          width: row.metadata_image_width,
          height: row.metadata_image_height,
          ...(row.metadata_image_orientation && { orientation: row.metadata_image_orientation }),
        },
      }),
      ...(row.metadata_video_duration && {
        videoMetadata: {
          duration: row.metadata_video_duration,
          width: row.metadata_video_width,
          height: row.metadata_video_height,
          ...(row.metadata_video_framerate && { framerate: row.metadata_video_framerate }),
        },
      }),
      ...(row.metadata_audio_duration && {
        audioMetadata: {
          duration: row.metadata_audio_duration,
          ...(row.metadata_audio_bitrate && { bitrate: row.metadata_audio_bitrate }),
          ...(row.metadata_audio_sample_rate && { sampleRate: row.metadata_audio_sample_rate }),
        },
      }),
    };

    return {
      ...baseFile,
      metadata,
      
      ...(row.description && { description: row.description }),
      ...(row.folder_id && { folderId: row.folder_id }),
      ...(row.color_hex && {
        color: {
          hex: row.color_hex,
          rgb: {
            r: row.color_rgb_r,
            g: row.color_rgb_g,
            b: row.color_rgb_b,
          },
          isSystem: false,
        } ,
      }),
      ...(row.last_accessed_at && { lastAccessedAt: new Date(row.last_accessed_at) }),
      ...(row.archived_at && { archivedAt: new Date(row.archived_at) }),
      ...(row.storage_url && { storageUrl: row.storage_url }),
      ...(row.thumbnail_url && { thumbnailUrl: row.thumbnail_url }),
    };
  }
}