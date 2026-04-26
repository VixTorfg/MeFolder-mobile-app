import { BaseEntity } from "../common/base";
import { ColorInfo } from "../common/colors";

export interface UserColor extends Omit<ColorInfo, "id">, BaseEntity {}

export type CreateUserColorInput = Omit<ColorInfo, "id">;

export interface UpdateUserColorInput {
  name?: string;
  hex?: string;
  rgb?: { r: number; g: number; b: number };
  isFavorite?: boolean;
}
