import { Database } from '../sqlite/Database';
import { TagFactory } from '../../models/tag';
import { 
  Tag, 
  CreateTagInput, 
  UpdateTagInput, 
  TagType,
  TagPriority
} from '../../types/entities/tag';
import { UUID } from '../../types/common/base';
import { ColorInfo } from '../../types/common/colors';
import { TagRepository, TagTreeNode } from '../../types/repositories/tag';

/**
 * Implementación del repositorio de etiquetas.
 * Maneja operaciones CRUD y gestión jerárquica de etiquetas
 */
export class TagRepositoryImplementation implements TagRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Buscar etiqueta por ID
   */
  async findById(id: UUID): Promise<Tag | null> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT * FROM tags WHERE id = ? AND is_active = ?',
        [id, true]
      );

      return row ? this.mapRowToTag(row) : null;
    } catch (error) {
      console.error('Error finding tag by id:', error);
      throw new Error(`Error al buscar etiqueta: ${error}`);
    }
  }

  /**
   * Buscar etiqueta por nombre
   */
  async findByName(name: string): Promise<Tag | null> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT * FROM tags WHERE name = ? AND is_active = ?',
        [name, true]
      );

      return row ? this.mapRowToTag(row) : null;
    } catch (error) {
      console.error('Error finding tag by name:', error);
      throw new Error(`Error al buscar etiqueta por nombre: ${error}`);
    }
  }

  /**
   * Obtener todas las etiquetas con filtros opcionales
   */
  async findAll(filters?: any): Promise<Tag[]> {
    try {
      let sql = 'SELECT * FROM tags WHERE is_active = ?';
      const params: any[] = [true];

      if (filters) {
        if (filters.type) {
          sql += ' AND type = ?';
          params.push(filters.type);
        }
        if (filters.priority) {
          sql += ' AND priority = ?';
          params.push(filters.priority);
        }
        if (filters.parentId) {
          sql += ' AND parent_id = ?';
          params.push(filters.parentId);
        }
        if (filters.minUsage !== undefined) {
          sql += ' AND usage_count >= ?';
          params.push(filters.minUsage);
        }
      }

      sql += ' ORDER BY usage_count DESC, name ASC';

      if (filters?.limit) {
        sql += ' LIMIT ?';
        params.push(filters.limit);
        if (filters?.offset) {
          sql += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const rows = await this.db.query<any>(sql, params);
      return rows.map(row => this.mapRowToTag(row));
    } catch (error) {
      console.error('Error finding all tags:', error);
      throw new Error(`Error al buscar etiquetas: ${error}`);
    }
  }

  /**
   * Crear nueva etiqueta
   */
  async create(input: CreateTagInput): Promise<Tag> {
    try {
      const tagModel = TagFactory.create(input);
      const tag = tagModel.toJSON();

      const validation = tagModel.validate();
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      await this.db.execute(`
        INSERT INTO tags (
          id, created_at, updated_at,
          name, description, type, priority, is_active,
          color_hex, color_rgb_r, color_rgb_g, color_rgb_b,
          usage_count, last_used_at, parent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tag.id, tag.createdAt, tag.updatedAt,
        tag.name, tag.description, tag.type, tag.priority, tag.isActive,
        tag.color.hex, tag.color.rgb.r, tag.color.rgb.g, tag.color.rgb.b,
        tag.usageCount, tag.lastUsedAt, tag.parentId
      ]);

      return tag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw new Error(`Error al crear etiqueta: ${error}`);
    }
  }

  /**
   * Actualizar etiqueta existente
   */
  async update(id: UUID, input: UpdateTagInput): Promise<Tag> {
    try {
      const existingTag = await this.findById(id);
      if (!existingTag) {
        throw new Error('Etiqueta no encontrada');
      }

      const tagModel = TagFactory.fromJSON(existingTag);
      tagModel.update(input);

      const validation = tagModel.validate();
      if (!validation.isValid) {
        throw new Error(`Validación fallida: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const tag = tagModel.toJSON();

      await this.db.execute(`
        UPDATE tags SET 
          updated_at = ?,
          name = ?, 
          description = ?,
          type = ?,
          priority = ?,
          color_hex = ?, 
          color_rgb_r = ?, 
          color_rgb_g = ?, 
          color_rgb_b = ?,
          parent_id = ?
        WHERE id = ?
      `, [
        tag.updatedAt,
        tag.name, tag.description, tag.type, tag.priority,
        tag.color.hex, tag.color.rgb.r, tag.color.rgb.g, tag.color.rgb.b,
        tag.parentId, id
      ]);

      return tag;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw new Error(`Error al actualizar etiqueta: ${error}`);
    }
  }

  /**
   * Desactivar etiqueta (soft delete)
   */
  async delete(id: UUID): Promise<boolean> {
    try {
      const result = await this.db.execute(
        'UPDATE tags SET is_active = ?, updated_at = ? WHERE id = ?',
        [false, new Date(), id]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw new Error(`Error al eliminar etiqueta: ${error}`);
    }
  }

  /**
   * Buscar etiquetas por tipo
   */
  async findByType(type: TagType): Promise<Tag[]> {
    return this.findAll({ type });
  }

  /**
   * Buscar etiquetas por prioridad
   */
  async findByPriority(priority: TagPriority): Promise<Tag[]> {
    return this.findAll({ priority });
  }

  /**
   * Buscar etiquetas hijas de una etiqueta padre
   */
  async findByParentId(parentId: UUID): Promise<Tag[]> {
    return this.findAll({ parentId });
  }

  /**
   * Buscar etiquetas por uso mínimo
   */
  async findByUsageCount(minUsage: number): Promise<Tag[]> {
    return this.findAll({ minUsage });
  }

  /**
   * Obtener etiquetas más usadas
   */
  async findMostUsed(limit: number): Promise<Tag[]> {
    return this.findAll({ 
      limit,
      minUsage: 0 // Para ordenar por usage_count DESC
    });
  }

  /**
   * Obtener etiquetas del sistema
   */
  async findSystemTags(): Promise<Tag[]> {
    return this.findByType('system');
  }

  /**
   * Obtener etiquetas activas
   */
  async findActiveTags(): Promise<Tag[]> {
    return this.findAll();
  }

  /**
   * Búsqueda de etiquetas por texto
   */
  async search(query: string, filters?: any): Promise<Tag[]> {
    try {
      let sql = `
        SELECT * FROM tags 
        WHERE is_active = ? 
        AND (name LIKE ? OR description LIKE ?)
      `;
      const params: any[] = [true, `%${query}%`, `%${query}%`];

      if (filters?.type) {
        sql += ' AND type = ?';
        params.push(filters.type);
      }

      sql += ' ORDER BY usage_count DESC, name ASC';

      const rows = await this.db.query<any>(sql, params);
      return rows.map(row => this.mapRowToTag(row));
    } catch (error) {
      console.error('Error searching tags:', error);
      throw new Error(`Error al buscar etiquetas: ${error}`);
    }
  }

  /**
   * Actualizar contador de uso
   */
  async updateUsageCount(tagId: UUID, increment: number): Promise<void> {
    try {
      await this.db.execute(`
        UPDATE tags SET 
          usage_count = usage_count + ?,
          last_used_at = ?,
          updated_at = ?
        WHERE id = ?
      `, [increment, new Date(), new Date(), tagId]);
    } catch (error) {
      console.error('Error updating usage count:', error);
      throw new Error(`Error al actualizar contador de uso: ${error}`);
    }
  }

  /**
   * Incrementar uso de etiqueta
   */
  async incrementUsage(tagId: UUID): Promise<void> {
    await this.updateUsageCount(tagId, 1);
  }

  /**
   * Decrementar uso de etiqueta
   */
  async decrementUsage(tagId: UUID): Promise<void> {
    await this.updateUsageCount(tagId, -1);
  }

  /**
   * Actualizar fecha de último uso
   */
  async updateLastUsed(tagId: UUID): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE tags SET last_used_at = ?, updated_at = ? WHERE id = ?',
        [new Date(), new Date(), tagId]
      );
    } catch (error) {
      console.error('Error updating last used:', error);
      throw new Error(`Error al actualizar último uso: ${error}`);
    }
  }

  /**
   * Crear jerarquía de etiquetas
   */
  async createHierarchy(parentId: UUID, childIds: UUID[]): Promise<void> {
    try {
      const updates = childIds.map(childId => ({
        sql: 'UPDATE tags SET parent_id = ?, updated_at = ? WHERE id = ?',
        params: [parentId, new Date(), childId]
      }));

      await this.db.transaction(updates);
    } catch (error) {
      console.error('Error creating hierarchy:', error);
      throw new Error(`Error al crear jerarquía: ${error}`);
    }
  }

  /**
   * Obtener jerarquía completa de una etiqueta
   */
  async getHierarchy(tagId: UUID): Promise<Tag[]> {
    try {
      const sql = `
        WITH RECURSIVE tag_hierarchy AS (
          SELECT * FROM tags WHERE id = ? AND is_active = ?
          UNION ALL
          SELECT t.* FROM tags t
          INNER JOIN tag_hierarchy th ON t.parent_id = th.id
          WHERE t.is_active = ?
        )
        SELECT * FROM tag_hierarchy ORDER BY name
      `;

      const rows = await this.db.query<any>(sql, [tagId, true, true]);
      return rows.map(row => this.mapRowToTag(row));
    } catch (error) {
      console.error('Error getting hierarchy:', error);
      throw new Error(`Error al obtener jerarquía: ${error}`);
    }
  }

  /**
   * Obtener árbol completo de etiquetas
   */
  async getTagTree(): Promise<TagTreeNode[]> {
    try {
      const rootTags = await this.findAll({ parentId: null });
      const tree: TagTreeNode[] = [];

      for (const tag of rootTags) {
        const node = await this.buildTagTreeNode(tag);
        tree.push(node);
      }

      return tree;
    } catch (error) {
      console.error('Error getting tag tree:', error);
      throw new Error(`Error al obtener árbol de etiquetas: ${error}`);
    }
  }

  /**
   * Crear múltiples etiquetas en lote
   */
  async bulkCreate(inputs: CreateTagInput[]): Promise<Tag[]> {
    try {
      const tags: Tag[] = [];
      const queries = [];

      for (const input of inputs) {
        const tagModel = TagFactory.create(input);
        const tag = tagModel.toJSON();

        const validation = tagModel.validate();
        if (!validation.isValid) {
          throw new Error(`Validación fallida para "${input.name}": ${validation.errors.map(e => e.message).join(', ')}`);
        }

        tags.push(tag);
        queries.push({
          sql: `INSERT INTO tags (
            id, created_at, updated_at, name, description, type, priority, is_active,
            color_hex, color_rgb_r, color_rgb_g, color_rgb_b, usage_count, last_used_at, parent_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            tag.id, tag.createdAt, tag.updatedAt, tag.name, tag.description,
            tag.type, tag.priority, tag.isActive, tag.color.hex,
            tag.color.rgb.r, tag.color.rgb.g, tag.color.rgb.b,
            tag.usageCount, tag.lastUsedAt, tag.parentId
          ]
        });
      }

      await this.db.transaction(queries);
      return tags;
    } catch (error) {
      console.error('Error bulk creating tags:', error);
      throw new Error(`Error al crear etiquetas en lote: ${error}`);
    }
  }

  /**
   * Eliminar múltiples etiquetas en lote
   */
  async bulkDelete(ids: UUID[]): Promise<number> {
    try {
      if (ids.length === 0) return 0;

      const placeholders = ids.map(() => '?').join(',');
      const result = await this.db.execute(
        `UPDATE tags SET is_active = ?, updated_at = ? WHERE id IN (${placeholders})`,
        [false, new Date(), ...ids]
      );

      return result.changes;
    } catch (error) {
      console.error('Error bulk deleting tags:', error);
      throw new Error(`Error al eliminar etiquetas en lote: ${error}`);
    }
  }

  /**
   * Contar etiquetas
   */
  async count(filters?: any): Promise<number> {
    try {
      let sql = 'SELECT COUNT(*) as total FROM tags WHERE is_active = ?';
      const params: any[] = [true];

      if (filters?.type) {
        sql += ' AND type = ?';
        params.push(filters.type);
      }

      const [result] = await this.db.query<{ total: number }>(sql, params);
      return result?.total || 0;
    } catch (error) {
      console.error('Error counting tags:', error);
      throw new Error(`Error al contar etiquetas: ${error}`);
    }
  }

  /**
   * Verificar si existe una etiqueta
   */
  async exists(id: UUID): Promise<boolean> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM tags WHERE id = ? AND is_active = ?',
        [id, true]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking tag existence:', error);
      return false;
    }
  }

  /**
   * Verificar si existe etiqueta por nombre
   */
  async existsByName(name: string): Promise<boolean> {
    try {
      const [result] = await this.db.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM tags WHERE name = ? AND is_active = ?',
        [name, true]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking tag existence by name:', error);
      return false;
    }
  }

  /**
   * Construir nodo del árbol de etiquetas recursivamente
   */
  private async buildTagTreeNode(tag: Tag): Promise<TagTreeNode> {
    const children = await this.findByParentId(tag.id);
    const childNodes: TagTreeNode[] = [];

    for (const child of children) {
      const childNode = await this.buildTagTreeNode(child);
      childNodes.push(childNode);
    }

    return {
      tag,
      children: childNodes,
      totalUsage: tag.usageCount + childNodes.reduce((sum, child) => sum + child.totalUsage, 0)
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
        isSystem: row.type === 'system',
      } as ColorInfo,
      usageCount: row.usage_count,
      
      ...(row.description && { description: row.description }),
      ...(row.parent_id && { parentId: row.parent_id }),
      ...(row.last_used_at && { lastUsedAt: new Date(row.last_used_at) }),
    };
  }
}