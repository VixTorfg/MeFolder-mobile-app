import { 
  Tag, 
  CreateTagInput, 
  TagType,
  TagPriority
} from '../types/entities/tag';
import { UUID } from '../types/common/base';
import { ColorInfo } from '../types/common/colors';
import { BaseModel, ValidationResult, ValidationUtils } from './base';

export class TagModel extends BaseModel<Tag> {
  constructor(data: Tag) {
    super(data);
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get color(): ColorInfo {
    return this.data.color;
  }

  get type(): TagType {
    return this.data.type;
  }

  get priority(): TagPriority {
    return this.data.priority;
  }

  get isActive(): boolean {
    return this.data.isActive;
  }

  get usageCount(): number {
    return this.data.usageCount;
  }

  get parentId(): UUID | undefined {
    return this.data.parentId;
  }

  /** Establece nuevo nombre de etiqueta */
  setName(name: string): void {
    this.data.name = name.trim();
    this.data.updatedAt = new Date();
  }

  /** Establece descripción de la etiqueta */
  setDescription(description: string | undefined): void {
    if(description) {
      this.data.description = description.trim();
    } else {
      delete this.data.description;
    }
    this.data.updatedAt = new Date();
  }

  /** Establece color de la etiqueta */
  setColor(color: ColorInfo): void {
    this.data.color = color;
    this.data.updatedAt = new Date();
  }

  /** Establece prioridad de la etiqueta */
  setPriority(priority: TagPriority): void {
    this.data.priority = priority;
    this.data.updatedAt = new Date();
  }

  activate(): void {
    this.data.isActive = true;
    this.data.updatedAt = new Date();
  }

  deactivate(): void {
    this.data.isActive = false;
    this.data.updatedAt = new Date();
  }

  incrementUsage(): void {
    this.data.usageCount += 1;
    this.data.lastUsedAt = new Date();
    this.data.updatedAt = new Date();
  }

  /** Valida datos de la etiqueta */
  validate(): ValidationResult {
    const errors = [];

    const nameError = ValidationUtils.required(this.data.name, 'name');
    if (nameError) errors.push(nameError);

    const nameLengthError = ValidationUtils.minLength(this.data.name, 1, 'name');
    if (nameLengthError) errors.push(nameLengthError);

    const nameMaxLengthError = ValidationUtils.maxLength(this.data.name, 50, 'name');
    if (nameMaxLengthError) errors.push(nameMaxLengthError);

    if (this.data.description) {
      const descMaxLengthError = ValidationUtils.maxLength(this.data.description, 200, 'description');
      if (descMaxLengthError) errors.push(descMaxLengthError);
    }

    if (!this.data.color || !this.data.color.hex) {
      errors.push({
        field: 'color',
        message: 'Color es requerido',
        code: 'REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /** Crea copia del modelo */
  clone(): TagModel {
    return new TagModel({ ...this.data });
  }

  /** Verifica si es etiqueta del sistema */
  isSystemTag(): boolean {
    return this.data.type === 'system';
  }

  /** Verifica si tiene prioridad alta */
  isHighPriority(): boolean {
    return this.data.priority === 'high' || this.data.priority === 'critical';
  }

  /** Verifica si puede eliminarse */
  canBeDeleted(): boolean {
    return this.data.type !== 'system' && this.data.usageCount === 0;
  }
}

export class TagFactory {
  /** Crea nueva etiqueta con configuración por defecto */
  static create(input: CreateTagInput): TagModel {
    const now = new Date();
    const tag: Tag = {
      id: this.generateId(),
      name: input.name.trim(),
      color: input.color,
      type: input.type || 'user',
      priority: input.priority || 'normal',
      isActive: true,
      usageCount: 0,
      children: [],
      createdAt: now,
      updatedAt: now,

      ...(input.description && { description: input.description.trim() }),
      ...(input.parentId && { parentId: input.parentId })
    };

    return new TagModel(tag);
  }

  /** Crea modelo desde datos JSON */
  static fromJSON(data: Tag): TagModel {
    return new TagModel(data);
  }

  /** Genera ID único para etiqueta */
  private static generateId(): UUID {
    return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}