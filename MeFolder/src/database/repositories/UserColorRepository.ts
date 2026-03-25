import { Database } from '../sqlite/Database';
import { 
  UserColor, 
  CreateUserColorInput, 
  UpdateUserColorInput 
} from '../../types/entities/userColor';
import { UUID } from '../../types/common/base';
import { ColorInfo } from '../../types/common/colors';
import { UserColorRepository } from '../../types/repositories/userColor';

/**
 * Implementación del repositorio de colores personalizados del usuario.
 * Maneja operaciones CRUD para la tabla user_colors
 */
export class UserColorRepositoryImplementation implements UserColorRepository {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async findById(id: UUID): Promise<UserColor | null> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT * FROM user_colors WHERE id = ?',
        [id]
      );
      return row ? this.mapRowToUserColor(row) : null;
    } catch (error) {
      console.error('Error finding user color by id:', error);
      throw new Error(`Error al buscar color: ${error}`);
    }
  }

  async findByHex(hex: string): Promise<UserColor | null> {
    try {
      const normalizedHex = hex.toUpperCase();
      const [row] = await this.db.query<any>(
        'SELECT * FROM user_colors WHERE UPPER(color_hex) = ?',
        [normalizedHex]
      );
      return row ? this.mapRowToUserColor(row) : null;
    } catch (error) {
      console.error('Error finding user color by hex:', error);
      throw new Error(`Error al buscar color por hex: ${error}`);
    }
  }

  async findAll(): Promise<UserColor[]> {
    try {
      const rows = await this.db.query<any>(
        'SELECT * FROM user_colors ORDER BY created_at DESC'
      );
      return rows.map(row => this.mapRowToUserColor(row));
    } catch (error) {
      console.error('Error finding all user colors:', error);
      throw new Error(`Error al buscar colores: ${error}`);
    }
  }

  async findFavorites(): Promise<UserColor[]> {
    try {
      const rows = await this.db.query<any>(
        'SELECT * FROM user_colors WHERE is_favorite = ? ORDER BY created_at DESC',
        [true]
      );
      return rows.map(row => this.mapRowToUserColor(row));
    } catch (error) {
      console.error('Error finding favorite colors:', error);
      throw new Error(`Error al buscar colores favoritos: ${error}`);
    }
  }

  async create(input: CreateUserColorInput): Promise<UserColor> {
    try {
      const now = new Date();
      const id = this.generateId();

      const userColor: UserColor = {
        id,
        createdAt: now,
        updatedAt: now,
        color: input.color,
        isFavorite: input.isFavorite ?? false,
        ...(input.name && { name: input.name.trim() }),
      };

      await this.db.execute(`
        INSERT INTO user_colors (
          id, created_at, updated_at,
          name, color_hex, color_rgb_r, color_rgb_g, color_rgb_b,
          is_favorite
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userColor.id, userColor.createdAt, userColor.updatedAt,
        userColor.name ?? null,
        userColor.color.hex,
        userColor.color.rgb.r, userColor.color.rgb.g, userColor.color.rgb.b,
        userColor.isFavorite,
      ]);

      return userColor;
    } catch (error) {
      console.error('Error creating user color:', error);
      throw new Error(`Error al crear color: ${error}`);
    }
  }

  async update(id: UUID, input: UpdateUserColorInput): Promise<UserColor> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Color no encontrado');
      }

      const updated: UserColor = {
        ...existing,
        updatedAt: new Date(),
        ...(input.name !== undefined && { name: input.name?.trim() }),
        ...(input.color && { color: input.color }),
        ...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
      };

      await this.db.execute(`
        UPDATE user_colors SET
          updated_at = ?,
          name = ?,
          color_hex = ?,
          color_rgb_r = ?,
          color_rgb_g = ?,
          color_rgb_b = ?,
          is_favorite = ?
        WHERE id = ?
      `, [
        updated.updatedAt,
        updated.name ?? null,
        updated.color.hex,
        updated.color.rgb.r, updated.color.rgb.g, updated.color.rgb.b,
        updated.isFavorite,
        id,
      ]);

      return updated;
    } catch (error) {
      console.error('Error updating user color:', error);
      throw new Error(`Error al actualizar color: ${error}`);
    }
  }

  async delete(id: UUID): Promise<boolean> {
    try {
      await this.db.execute(
        'DELETE FROM user_colors WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error deleting user color:', error);
      throw new Error(`Error al eliminar color: ${error}`);
    }
  }

  async count(): Promise<number> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT COUNT(*) as total FROM user_colors'
      );
      return row?.total ?? 0;
    } catch (error) {
      console.error('Error counting user colors:', error);
      throw new Error(`Error al contar colores: ${error}`);
    }
  }

  async exists(id: UUID): Promise<boolean> {
    try {
      const [row] = await this.db.query<any>(
        'SELECT 1 FROM user_colors WHERE id = ?',
        [id]
      );
      return !!row;
    } catch (error) {
      console.error('Error checking user color existence:', error);
      throw new Error(`Error al verificar existencia de color: ${error}`);
    }
  }

  async existsByHex(hex: string): Promise<boolean> {
    try {
      const normalizedHex = hex.toUpperCase();
      const [row] = await this.db.query<any>(
        'SELECT 1 FROM user_colors WHERE UPPER(color_hex) = ?',
        [normalizedHex]
      );
      return !!row;
    } catch (error) {
      console.error('Error checking user color hex existence:', error);
      throw new Error(`Error al verificar existencia de color: ${error}`);
    }
  }

  private mapRowToUserColor(row: any): UserColor {
    return {
      id: row.id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      name: row.name ?? undefined,
      color: {
        hex: row.color_hex,
        rgb: {
          r: row.color_rgb_r,
          g: row.color_rgb_g,
          b: row.color_rgb_b,
        },
        isSystem: false,
      } as ColorInfo,
      isFavorite: Boolean(row.is_favorite),
    };
  }

  private generateId(): UUID {
    return `ucolor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
