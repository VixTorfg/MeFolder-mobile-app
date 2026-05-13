import { Database } from "../sqlite/Database";
import { Tag, TagType, TagPriority } from "../../types/entities/tag";
import {
  File,
  FileStatus,
  FileVisibility,
  FileMetadata,
} from "../../types/entities/file";
import {
  FileExtension,
  FileCategory,
} from "../../types/common/file-extensions";
import { ColorInfo } from "../../types/common/colors";
import { UUID } from "../../types/common/base";
import {
  TagAssignmentRepository,
  TagAssignmentStats,
  TagWithUsage,
} from "../../types/repositories/tag";

/**
 * Implementación del repositorio de asignaciones de etiquetas.
 * Maneja relaciones entre etiquetas y archivos/carpetas
 */
export class TagAssignmentRepositoryImplementation implements TagAssignmentRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Asignar etiquetas a un archivo
   */
  async assignTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      if (tagIds.length === 0) return;

      const existingTagIds = await this.getFileTagIds(fileId);
      const newTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

      if (newTagIds.length === 0) return;

      const queries = newTagIds.map((tagId) => ({
        sql: "INSERT INTO file_tags (file_id, tag_id, created_at) VALUES (?, ?, ?)",
        params: [fileId, tagId, new Date().getTime()],
      }));

      await this.db.transaction(queries);
    } catch (error) {
      console.error("Error assigning tags to file:", error);
      throw new Error(`Error al asignar etiquetas al archivo: ${error}`);
    }
  }

  /**
   * Asignar etiquetas a archivos bulk
   */
  async bulkAssignTagToFiles(fileIds: UUID[], tagId: UUID): Promise<void> {
    try {
      if (fileIds.length === 0) return;

      const now = new Date().getTime();
      const CHUNK_SIZE = 300; // ~900 params, bajo el límite de 999

      for (let i = 0; i < fileIds.length; i += CHUNK_SIZE) {
        const chunk = fileIds.slice(i, i + CHUNK_SIZE);
        const params: any[] = [];
        const placeholders: string[] = [];

        for (const fileId of chunk) {
          params.push(fileId, tagId, now);
          placeholders.push("(?, ?, ?)");
        }

        await this.db.execute(
          `INSERT OR IGNORE INTO file_tags (file_id, tag_id, created_at) VALUES ${placeholders.join(",")}`,
          params,
        );
      }
    } catch (error) {
      console.error("Error bulk assigning tags to files:", error);
      throw new Error(`Error al asignar etiquetas a archivos: ${error}`);
    }
  }

  /**
   * Remover etiquetas de un archivo
   */
  async removeTagsFromFile(fileId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      if (tagIds.length === 0) return;

      const placeholders = tagIds.map(() => "?").join(",");
      console.log(
        `DELETE FROM file_tags WHERE file_id = ? AND tag_id IN (${placeholders})`,
        [fileId, ...tagIds],
      );
      await this.db.execute(
        `DELETE FROM file_tags WHERE file_id = ? AND tag_id IN (${placeholders})`,
        [fileId, ...tagIds],
      );
    } catch (error) {
      console.error("Error removing tags from file:", error);
      throw new Error(`Error al remover etiquetas del archivo: ${error}`);
    }
  }

  /**
   * Obtener IDs de etiquetas de un archivo
   */
  async getFileTagIds(fileId: UUID): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ tag_id: UUID }>(
        "SELECT tag_id FROM file_tags WHERE file_id = ?",
        [fileId],
      );
      return rows.map((row) => row.tag_id);
    } catch (error) {
      console.error("Error getting file tag ids:", error);
      throw new Error(`Error al obtener etiquetas del archivo: ${error}`);
    }
  }

  /**
   * Obtener objetos Tag completos de un archivo
   */
  async getFileTags(fileId: UUID): Promise<Tag[]> {
    try {
      const rows = await this.db.query<any>(
        `
        SELECT t.* FROM tags t
        INNER JOIN file_tags ft ON t.id = ft.tag_id
        WHERE ft.file_id = ? AND t.is_active = ?
        ORDER BY t.name
      `,
        [fileId, true],
      );

      return rows.map((row) => this.mapRowToTag(row));
    } catch (error) {
      console.error("Error getting file tags:", error);
      throw new Error(`Error al obtener etiquetas del archivo: ${error}`);
    }
  }

  /**
   * Obtener archivos que tienen una etiqueta específica
   */
  async getTaggedFiles(tagId: UUID): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ file_id: UUID }>(
        "SELECT file_id FROM file_tags WHERE tag_id = ?",
        [tagId],
      );
      return rows.map((row) => row.file_id);
    } catch (error) {
      console.error("Error getting tagged files:", error);
      throw new Error(`Error al obtener archivos con etiqueta: ${error}`);
    }
  }

  /**
   * Obtener archivos que tienen una etiqueta específica paginados
   */
  async getTaggedFilesPaginated(
    tagId: UUID,
    page: number,
    pageSize: number,
  ): Promise<File[]> {
    try {
      const offset = (page - 1) * pageSize;
      const rows = await this.db.query<any>(
        `SELECT f.* FROM files f
         INNER JOIN file_tags ft ON f.id = ft.file_id
         WHERE ft.tag_id = ?
         ORDER BY f.created_at DESC
         LIMIT ? OFFSET ?`,
        [tagId, pageSize, offset],
      );

      return rows.map((row) => this.mapRowToFile(row));
    } catch (error) {
      console.error("Error getting tagged files paginated:", error);
      throw new Error(`Error al obtener archivos con etiqueta: ${error}`);
    }
  }

  /**
   * Contar uso de etiqueta en archivos
   */
  async getTagUsageInFiles(tagId: UUID): Promise<number> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        "SELECT COUNT(*) as count FROM file_tags WHERE tag_id = ?",
        [tagId],
      );
      return result?.count || 0;
    } catch (error) {
      console.error("Error getting tag usage in files:", error);
      return 0;
    }
  }

  /**
   * Limpiar etiquetas no utilizadas
   */
  async cleanupUnusedTags(): Promise<UUID[]> {
    try {
      const rows = await this.db.query<{ id: UUID }>(
        `
        SELECT t.id FROM tags t
        LEFT JOIN file_tags ft ON t.id = ft.tag_id
        WHERE t.is_active = ? 
        AND t.type != 'system'
        AND ft.tag_id IS NULL
      `,
        [true],
      );

      const unusedTagIds = rows.map((row) => row.id);

      if (unusedTagIds.length > 0) {
        const placeholders = unusedTagIds.map(() => "?").join(",");
        await this.db.execute(
          `UPDATE tags SET is_active = ?, updated_at = ? WHERE id IN (${placeholders})`,
          [false, new Date().getTime(), ...unusedTagIds],
        );
      }

      return unusedTagIds;
    } catch (error) {
      console.error("Error cleaning unused tags:", error);
      throw new Error(`Error al limpiar etiquetas no utilizadas: ${error}`);
    }
  }

  /**
   * Remover todas las etiquetas de un archivo
   */
  async removeAllTagsFromFile(fileId: UUID): Promise<void> {
    try {
      await this.db.execute("DELETE FROM file_tags WHERE file_id = ?", [
        fileId,
      ]);
    } catch (error) {
      console.error("Error removing all tags from file:", error);
      throw new Error(
        `Error al remover todas las etiquetas del archivo: ${error}`,
      );
    }
  }

  /**
   * Obtener estadísticas de asignación de una etiqueta
   */
  async getTagAssignmentStats(tagId: UUID): Promise<TagAssignmentStats> {
    try {
      const filesCount = await this.getTagUsageInFiles(tagId);

      // Obtener fecha de último uso
      const [lastUsedResult] = await this.db.query<{ last_used: string }>(
        `
        SELECT MAX(created_at) as last_used FROM file_tags WHERE tag_id = ?
      `,
        [tagId],
      );

      return {
        tagId,
        filesCount,
        totalUsage: filesCount,
        ...(lastUsedResult?.last_used && {
          lastUsed: new Date(lastUsedResult.last_used),
        }),
      };
    } catch (error) {
      console.error("Error getting tag assignment stats:", error);
      throw new Error(`Error al obtener estadísticas de la etiqueta: ${error}`);
    }
  }

  /**
   * Obtener etiquetas populares con información de uso
   */
  async getPopularTags(limit: number): Promise<TagWithUsage[]> {
    try {
      const rows = await this.db.query<any>(
        `
        SELECT 
          t.*,
          COALESCE(file_usage.count, 0) as files_usage,
          COALESCE(file_usage.count, 0) as total_usage
        FROM tags t
        LEFT JOIN (
          SELECT tag_id, COUNT(*) as count 
          FROM file_tags 
          GROUP BY tag_id
        ) file_usage ON t.id = file_usage.tag_id
        WHERE t.is_active = ?
        ORDER BY total_usage DESC, t.name ASC
        LIMIT ?
      `,
        [true, limit],
      );

      // Calcular porcentaje de uso total
      const totalAssignments = rows.reduce(
        (sum, row) => sum + row.total_usage,
        0,
      );

      return rows.map((row) => ({
        ...this.mapRowToTag(row),
        filesUsage: row.files_usage,
        totalUsage: row.total_usage,
        usagePercentage:
          totalAssignments > 0 ? (row.total_usage / totalAssignments) * 100 : 0,
      }));
    } catch (error) {
      console.error("Error getting popular tags:", error);
      throw new Error(`Error al obtener etiquetas populares: ${error}`);
    }
  }

  /**
   * Mapear fila de base de datos a objeto File
   */
  private mapRowToFile(row: any): File {
    const metadata: FileMetadata = {
      size: row.metadata_size,
      ...(row.metadata_mime_type && { mimeType: row.metadata_mime_type }),
      ...(row.metadata_checksum && { checksum: row.metadata_checksum }),
      ...(row.metadata_image_width && {
        imageMetadata: {
          width: row.metadata_image_width,
          height: row.metadata_image_height,
          ...(row.metadata_image_orientation && {
            orientation: row.metadata_image_orientation,
          }),
        },
      }),
      ...(row.metadata_video_duration && {
        videoMetadata: {
          duration: row.metadata_video_duration,
          width: row.metadata_video_width,
          height: row.metadata_video_height,
          ...(row.metadata_video_framerate && {
            framerate: row.metadata_video_framerate,
          }),
        },
      }),
      ...(row.metadata_audio_duration && {
        audioMetadata: {
          duration: row.metadata_audio_duration,
          ...(row.metadata_audio_bitrate && {
            bitrate: row.metadata_audio_bitrate,
          }),
          ...(row.metadata_audio_sample_rate && {
            sampleRate: row.metadata_audio_sample_rate,
          }),
        },
      }),
    };

    return {
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
      metadata,
      tagIds: [],
      ...(row.folder_id && { folderId: row.folder_id }),
      ...(row.color_hex && {
        color: {
          hex: row.color_hex,
          rgb: { r: row.color_rgb_r, g: row.color_rgb_g, b: row.color_rgb_b },
          isSystem: false,
          isFavorite: false,
        } as ColorInfo,
      }),
      ...(row.last_accessed_at && {
        lastAccessedAt: new Date(row.last_accessed_at),
      }),
      ...(row.archived_at && { archivedAt: new Date(row.archived_at) }),
      ...(row.storage_url && { storageUrl: row.storage_url }),
      ...(row.thumbnail_url && { thumbnailUrl: row.thumbnail_url }),
    };
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
        isSystem: row.type === "system",
      },
      usageCount: row.usage_count,

      ...(row.description && { description: row.description }),
      ...(row.parent_id && { parentId: row.parent_id }),
      ...(row.last_used_at && { lastUsedAt: new Date(row.last_used_at) }),
    };
  }
}
