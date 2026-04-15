import { BaseService } from "./base/BaseService";
import { CreateTagInput, TagType } from "../types/entities/tag";
import { UUID } from "../types/common/base";
import { ColorInfo } from "../types/common/colors";
import { TagModel, TagFactory } from "../models/tag";
import { SYSTEM_ALBUM_TAG_ID } from "../database/seeds/systemTags";
import { FileModel } from "@/models";

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
  async createTag(input: CreateTagInput): Promise<TagModel> {
    try {
      this.ensureDbInitialized();

      // Validar que no existe otro tag con el mismo nombre
      await this.validateUniqueTagName(input.name);

      // Crear tag usando el repositorio
      const tag = await this.tagRepo.create(input);
      return TagFactory.fromJSON(tag);
    } catch (error) {
      return this.handleError(error, "crear tag");
    }
  }

  /**
   * Obtener tag por ID
   */
  async getTag(tagId: UUID): Promise<TagModel> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) {
        throw new Error("Tag no encontrado");
      }

      return TagFactory.fromJSON(tag);
    } catch (error) {
      return this.handleError(error, "obtener tag");
    }
  }

  /**
   * Obtener todos los tags activos
   */
  async getAllTags(): Promise<TagModel[]> {
    try {
      this.ensureDbInitialized();

      const tags = await this.tagRepo.findAll({ status: "active" });
      return tags.map((t) => TagFactory.fromJSON(t));
    } catch (error) {
      return this.handleError(error, "obtener todos los tags");
    }
  }

  async getAllTagsWithoutAlbum(): Promise<TagModel[]> {
    try {
      this.ensureDbInitialized();

      const tags = await this.tagRepo.findAll({
        status: "active",
        excludedType: "album",
      });
      return tags.map((t) => TagFactory.fromJSON(t));
    } catch (error) {
      return this.handleError(error, "obtener todos los tags");
    }
  }

  /**
   * Buscar tags por nombre (búsqueda parcial)
   */
  async searchTagsByName(query: string): Promise<TagModel[]> {
    try {
      this.ensureDbInitialized();

      if (!query.trim()) {
        return await this.getAllTags();
      }

      const tags = await this.tagRepo.search(query);
      return tags.map((t) => TagFactory.fromJSON(t));
    } catch (error) {
      return this.handleError(error, "buscar tags");
    }
  }

  /**
   * Obtener tags por tipo
   */
  async getTagsByType(type: TagType): Promise<TagModel[]> {
    try {
      this.ensureDbInitialized();

      const tags = await this.tagRepo.findAll({
        type,
        status: "active",
      });
      return tags.map((t) => TagFactory.fromJSON(t));
    } catch (error) {
      return this.handleError(error, "obtener tags por tipo");
    }
  }

  /**
   * Renombrar tag
   */
  async renameTag(tagId: UUID, newName: string): Promise<TagModel> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error("Tag no encontrado");

      // Validar que no existe otro tag con el nuevo nombre
      await this.validateUniqueTagName(newName, tagId);

      // Actualizar nombre
      const updated = await this.tagRepo.update(tagId, {
        name: newName,
      });
      return TagFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "renombrar tag");
    }
  }

  /**
   * Actualizar color del tag
   */
  async updateTagColor(tagId: UUID, color: ColorInfo): Promise<TagModel> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error("Tag no encontrado");

      const updated = await this.tagRepo.update(tagId, { color });
      return TagFactory.fromJSON(updated);
    } catch (error) {
      return this.handleError(error, "actualizar color del tag");
    }
  }

  /**
   * Eliminar tag (soft delete)
   */
  async deleteTag(tagId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error("Tag no encontrado");

      // No permitir eliminar tags del sistema
      if (tag.type === "system") {
        throw new Error("No se pueden eliminar tags del sistema");
      }

      // Cambiar status a inactivo
      await this.tagRepo.update(tagId, {
        isActive: false,
      });

      return true;
    } catch (error) {
      return this.handleError(error, "eliminar tag");
    }
  }

  /**
   * Asignar tags a un archivo
   */
  async addTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<void> {
    try {
      this.ensureDbInitialized();
      await this.tagAssignmentRepo.assignTagsToFile(fileId, tagIds);
    } catch (error) {
      return this.handleError(error, "asignar tags al archivo");
    }
  }

  async bulkAddTagsToFiles(fileIds: UUID[], tagId: UUID): Promise<void> {
    try {
      this.ensureDbInitialized();
      await this.tagAssignmentRepo.bulkAssignTagToFiles(fileIds, tagId);
    } catch (error) {
      return this.handleError(error, "asignar tags a archivos");
    }
  }

  /**
   *  Obtener files de un tag específico con paginación
   */
  async getFilesInTagPaginated(
    tagId: UUID,
    page: number,
    pageSize: number,
  ): Promise<FileModel[]> {
    try {
      this.ensureDbInitialized();
      const files = await this.tagAssignmentRepo.getTaggedFilesPaginated(
        tagId,
        page,
        pageSize,
      );
      return files.map((f) => new FileModel(f));
    } catch (error) {
      return this.handleError(error, "obtener archivos en tag paginados");
    }
  }

  /**
   * Obtener tags más utilizados
   */
  async getPopularTags(limit: number = 10): Promise<TagModel[]> {
    try {
      this.ensureDbInitialized();

      const tags = await this.tagRepo.findMostUsed(limit);
      return tags.map((t) => TagFactory.fromJSON(t));
    } catch (error) {
      return this.handleError(error, "obtener tags populares");
    }
  }

  /**
   * Obtener estadísticas de uso de un tag
   */
  async getTagUsageCount(tagId: UUID): Promise<number> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error("Tag no encontrado");

      // Contar archivos que usan este tag
      const fileCount = await this.tagAssignmentRepo.getTagUsageInFiles(tagId);

      return fileCount;
    } catch (error) {
      return this.handleError(error, "obtener estadísticas del tag");
    }
  }

  /**
   * Obtener archivos asociados a un tag
   */
  async getFilesWithTag(tagId: UUID): Promise<UUID[]> {
    try {
      this.ensureDbInitialized();

      const tag = await this.tagRepo.findById(tagId);
      if (!tag) throw new Error("Tag no encontrado");

      return await this.tagAssignmentRepo.getTaggedFiles(tagId);
    } catch (error) {
      return this.handleError(error, "obtener archivos con tag");
    }
  }

  /**
   * Limpiar tags no utilizados (maintenance)
   */
  async cleanupUnusedTags(): Promise<number> {
    try {
      this.ensureDbInitialized();

      const allTags = await this.tagRepo.findAll({
        type: "user", // Solo tags de usuario
        status: "active",
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
      return this.handleError(error, "limpiar tags no utilizados");
    }
  }

  /**
   * Crear nuevo álbum (tag de tipo album, hijo de sys_album)
   */
  async createAlbum(
    input: Omit<CreateTagInput, "type" | "parentId">,
  ): Promise<TagModel> {
    try {
      this.ensureDbInitialized();

      await this.validateUniqueTagName(input.name);

      const tag = await this.tagRepo.create({
        ...input,
        type: "album",
        parentId: SYSTEM_ALBUM_TAG_ID,
      });

      return TagFactory.fromJSON(tag);
    } catch (error) {
      return this.handleError(error, "crear álbum");
    }
  }

  /**
   * Obtener todos los álbumes (hijos de sys_album)
   */
  async getAllAlbums(): Promise<TagModel[]> {
    try {
      this.ensureDbInitialized();

      const albums = await this.tagRepo.findByParentId(SYSTEM_ALBUM_TAG_ID);
      return albums.map((t) => TagFactory.fromJSON(t));
    } catch (error) {
      return this.handleError(error, "obtener álbumes");
    }
  }

  // ===== MÉTODOS PRIVADOS DE VALIDACIÓN =====

  /** Validar que no existe otro tag con el mismo nombre */
  private async validateUniqueTagName(
    name: string,
    excludeTagId?: UUID,
  ): Promise<void> {
    const existing = await this.tagRepo.findByName(name);

    if (existing && existing.id !== excludeTagId) {
      throw new Error(`Ya existe un tag con el nombre "${name}"`);
    }
  }
}
