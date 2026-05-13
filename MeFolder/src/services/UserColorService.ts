import { BaseService } from "./base/BaseService";
import {
  CreateUserColorInput,
  UpdateUserColorInput,
  UserColor,
} from "../types/entities/userColor";
import { UUID } from "../types/common/base";

/**
 * Servicio para gestionar los colores personalizados del usuario.
 *
 * Funciones:
 * - Crear color personalizado
 * - Obtener todos los colores
 * - Obtener colores favoritos
 * - Actualizar color (nombre, favorito)
 * - Eliminar color
 * - Verificar existencia por hex
 */
export class UserColorService extends BaseService {
  /**
   * Crear nuevo color personalizado
   */
  async createColor(input: CreateUserColorInput): Promise<UserColor> {
    try {
      this.ensureDbInitialized();

      const exists = await this.userColorRepo.existsByHex(input.hex);
      if (exists) {
        throw new Error("Ya existe un color con ese valor hex");
      }

      return await this.userColorRepo.create(input);
    } catch (error) {
      return this.handleError(error, "crear color");
    }
  }

  /**
   * Obtener color por ID
   */
  async getColor(colorId: UUID): Promise<UserColor> {
    try {
      this.ensureDbInitialized();

      const color = await this.userColorRepo.findById(colorId);
      if (!color) {
        throw new Error("Color no encontrado");
      }

      return color;
    } catch (error) {
      return this.handleError(error, "obtener color");
    }
  }

  /**
   * Verificar si se ha alcanzado el número máximo de colores
   * @returns true if the maximum has been reached
   */
  async checkMaxColor(): Promise<boolean> {
    return 30 < (await this.getColorCount());
  }

  /**
   * Obtener todos los colores del usuario
   */
  async getAllColors(): Promise<UserColor[]> {
    try {
      this.ensureDbInitialized();
      return await this.userColorRepo.findAll();
    } catch (error) {
      return this.handleError(error, "obtener colores");
    }
  }

  /**
   * Obtener colores marcados como favoritos
   */
  async getFavoriteColors(): Promise<UserColor[]> {
    try {
      this.ensureDbInitialized();
      return await this.userColorRepo.findFavorites();
    } catch (error) {
      return this.handleError(error, "obtener colores favoritos");
    }
  }

  /**
   * Actualizar nombre o estado favorito de un color
   */
  async updateColor(
    colorId: UUID,
    input: UpdateUserColorInput,
  ): Promise<UserColor> {
    try {
      this.ensureDbInitialized();

      if (input.hex) {
        const existing = await this.userColorRepo.findByHex(input.hex);
        if (existing && existing.id !== colorId) {
          throw new Error("Ya existe otro color con ese valor hex");
        }
      }

      return await this.userColorRepo.update(colorId, input);
    } catch (error) {
      return this.handleError(error, "actualizar color");
    }
  }

  /**
   * Alternar estado favorito de un color
   */
  async toggleFavorite(colorId: UUID): Promise<UserColor> {
    try {
      this.ensureDbInitialized();

      const color = await this.userColorRepo.findById(colorId);
      if (!color) {
        throw new Error("Color no encontrado");
      }

      return await this.userColorRepo.update(colorId, {
        isFavorite: !color.isFavorite,
      });
    } catch (error) {
      return this.handleError(error, "alternar favorito de color");
    }
  }

  /**
   * Eliminar color personalizado
   */
  async deleteColor(colorId: UUID): Promise<boolean> {
    try {
      this.ensureDbInitialized();
      return await this.userColorRepo.delete(colorId);
    } catch (error) {
      return this.handleError(error, "eliminar color");
    }
  }

  /**
   * Verificar si un color hex ya existe
   */
  async colorExists(hex: string): Promise<boolean> {
    try {
      this.ensureDbInitialized();
      return await this.userColorRepo.existsByHex(hex);
    } catch (error) {
      return this.handleError(error, "verificar existencia de color");
    }
  }

  /**
   * Obtener cantidad de colores del usuario
   */
  async getColorCount(): Promise<number> {
    try {
      this.ensureDbInitialized();
      return await this.userColorRepo.count();
    } catch (error) {
      return this.handleError(error, "contar colores");
    }
  }
}
