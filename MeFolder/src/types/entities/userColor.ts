import { BaseEntity } from '../common/base';
import { ColorInfo } from '../common/colors';

export interface UserColor extends BaseEntity {
  name?: string;
  color: ColorInfo;
  isFavorite: boolean;
}

export interface CreateUserColorInput {
  name?: string;
  color: ColorInfo;
  isFavorite?: boolean;
}

export interface UpdateUserColorInput {
  name?: string;
  color?: ColorInfo;
  isFavorite?: boolean;
}
