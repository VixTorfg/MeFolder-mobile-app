import {
  UserColor,
  CreateUserColorInput,
  UpdateUserColorInput,
} from "../entities/userColor";
import { BaseRepository } from "./base";

/**
 * Repositorio para operaciones CRUD de colores personalizados del usuario
 */
export interface UserColorRepository extends BaseRepository<
  UserColor,
  CreateUserColorInput,
  UpdateUserColorInput
> {
  findByHex(hex: string): Promise<UserColor | null>;
  findFavorites(): Promise<UserColor[]>;
  existsByHex(hex: string): Promise<boolean>;
}
