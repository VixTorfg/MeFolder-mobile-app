import { 
  BaseEntity, 
  UUID,  
  UpdateInput 
} from '../types/common/base';
import { formatFileSize } from '../utils';

export abstract class BaseModel<T extends BaseEntity> {
  protected data: T;

  constructor(data: T) {
    this.data = { ...data };
  }

  get id(): UUID {
    return this.data.id;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  toJSON(): T {
    return { ...this.data };
  }

  update(input: UpdateInput<T>): void {
    this.data = {
      ...this.data,
      ...input,
      updatedAt: new Date(),
    };
  }

  abstract validate(): ValidationResult;

  abstract clone(): BaseModel<T>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export class ValidationUtils {
  static required(value: any, fieldName: string): ValidationError | null {
    if (value === null || value === undefined || value === '') {
      return {
        field: fieldName,
        message: `${fieldName} es requerido`,
        code: 'REQUIRED'
      };
    }
    return null;
  }

  static minLength(value: string, min: number, fieldName: string): ValidationError | null {
    if (value && value.length < min) {
      return {
        field: fieldName,
        message: `${fieldName} debe tener al menos ${min} caracteres`,
        code: 'MIN_LENGTH'
      };
    }
    return null;
  }

  static maxLength(value: string, max: number, fieldName: string): ValidationError | null {
    if (value && value.length > max) {
      return {
        field: fieldName,
        message: `${fieldName} no puede tener más de ${max} caracteres`,
        code: 'MAX_LENGTH'
      };
    }
    return null;
  }

  static email(value: string, fieldName: string): ValidationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return {
        field: fieldName,
        message: `${fieldName} debe ser un email válido`,
        code: 'INVALID_EMAIL'
      };
    }
    return null;
  }

  static fileSize(size: number, maxSize: number, fieldName: string): ValidationError | null {
    if (size > maxSize) {
      return {
        field: fieldName,
        message: `El archivo es demasiado grande. Máximo: ${formatFileSize(maxSize)}`,
        code: 'FILE_TOO_LARGE'
      };
    }
    return null;
  }
}