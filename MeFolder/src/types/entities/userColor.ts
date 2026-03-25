import { BaseEntity } from '../common/base';
import { ColorInfo } from '../common/colors';

export interface UserColor extends ColorInfo, BaseEntity {}

export type CreateUserColorInput = ColorInfo;

export interface UpdateUserColorInput {
  name?: string;
  hex?: string;
  rgb?: { r: number; g: number; b: number };
  isFavorite?: boolean;
}
