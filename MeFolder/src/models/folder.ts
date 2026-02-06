import { 
  Folder, 
  CreateFolderInput, 
  FolderStatus,
  FolderType,
  FolderVisibility,
  FolderViewSettings,
} from '../types/entities/folder';
import { UUID } from '../types/common/base';
import { ColorInfo } from '../types/common/colors';
import { BaseModel, ValidationResult, ValidationUtils } from './base';

export class FolderModel extends BaseModel<Folder> {
  constructor(data: Folder) {
    super(data);
  }

  get name(): string {
    return this.data.name;
  }

  get description(): string | undefined {
    return this.data.description;
  }

  get parentId(): UUID | undefined {
    return this.data.parentId;
  }

  get path(): string {
    return this.data.path;
  }

  get level(): number {
    return this.data.level;
  }

  get status(): FolderStatus {
    return this.data.status;
  }

  get type(): FolderType {
    return this.data.type;
  }

  get visibility(): FolderVisibility {
    return this.data.visibility;
  }

  get color(): ColorInfo | undefined {
    return this.data.color;
  }

  get icon(): string | undefined {
    return this.data.icon;
  }

  get tagIds(): UUID[] {
    return [...this.data.tagIds];
  }

  get viewSettings(): FolderViewSettings {
    return { ...this.data.viewSettings };
  }

  get isFavorite(): boolean {
    return this.data.isFavorite;
  }

  get isProtected(): boolean {
    return this.data.isProtected;
  }

  get isSystemFolder(): boolean {
    return this.data.isSystemFolder;
  }

  setName(name: string): void {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('El nombre no puede estar vacío');
    
    this.data.name = cleanName;
    this.updatePath();
  }

  setDescription(description: string | undefined): void {
    if (description) {
        this.data.description = description.trim();
    } else {
        delete this.data.description;
    }
    this.data.updatedAt = new Date();
  }

  setParent(parentId: UUID | undefined, parentPath?: string): void {
    if (parentId === this.data.id) {
      throw new Error('Una carpeta no puede ser su propia carpeta padre');
    }

    if (parentId){
        this.data.parentId = parentId;
        this.data.level = parentId ? (parentPath?.split('/').length || 0) + 1 : 0;
    }else{
        delete this.data.parentId;
        this.data.level = 0;
    } 
    this.updatePath(parentPath);
  }

  setStatus(status: FolderStatus): void {
    if (this.data.isProtected && status === 'deleted') {
      throw new Error('No se puede eliminar una carpeta protegida');
    }

    this.data.status = status;
    this.data.updatedAt = new Date();

    if (status === 'archived') {
      this.data.archivedAt = new Date();
    }
  }

  setVisibility(visibility: FolderVisibility): void {
    this.data.visibility = visibility;
    this.data.updatedAt = new Date();
  }

  setColor(color: ColorInfo | undefined): void {
    if (color) {
      this.data.color = color;
    } else {
      delete this.data.color;
    }
    this.data.updatedAt = new Date();
  }

  setIcon(icon: string | undefined): void {
    if (icon) {
        this.data.icon = icon.trim();
    } else {
        delete this.data.icon;
    }
    this.data.updatedAt = new Date();
  }

  addTag(tagId: UUID): void {
    if (!this.data.tagIds.includes(tagId)) {
      this.data.tagIds.push(tagId);
      this.data.updatedAt = new Date();
    }
  }

  removeTag(tagId: UUID): void {
    const index = this.data.tagIds.indexOf(tagId);
    if (index > -1) {
      this.data.tagIds.splice(index, 1);
      this.data.updatedAt = new Date();
    }
  }

  setTags(tagIds: UUID[]): void {
    this.data.tagIds = [...tagIds];
    this.data.updatedAt = new Date();
  }

  toggleFavorite(): void {
    this.data.isFavorite = !this.data.isFavorite;
    this.data.updatedAt = new Date();
  }

  updateViewSettings(settings: Partial<FolderViewSettings>): void {
    this.data.viewSettings = {
      ...this.data.viewSettings,
      ...settings
    };
    this.data.updatedAt = new Date();
  }

  markAsAccessed(): void {
    this.data.lastAccessedAt = new Date();
  }

  protect(): void {
    this.data.isProtected = true;
    this.data.updatedAt = new Date();
  }

  unprotect(): void {
    if (this.data.isSystemFolder) {
      throw new Error('No se puede desproteger una carpeta del sistema');
    }
    this.data.isProtected = false;
    this.data.updatedAt = new Date();
  }

  private updatePath(parentPath?: string): void {
    if (this.data.parentId && parentPath) {
      this.data.path = `${parentPath}/${this.data.name}`;
    } else {
      this.data.path = this.data.name;
    }
    this.data.updatedAt = new Date();
  }

  validate(): ValidationResult {
    const errors = [];

    const nameError = ValidationUtils.required(this.data.name, 'name');
    if (nameError) errors.push(nameError);

    const nameLengthError = ValidationUtils.minLength(this.data.name, 1, 'name');
    if (nameLengthError) errors.push(nameLengthError);

    const nameMaxLengthError = ValidationUtils.maxLength(this.data.name, 100, 'name');
    if (nameMaxLengthError) errors.push(nameMaxLengthError);

    if (this.data.description) {
      const descMaxLengthError = ValidationUtils.maxLength(this.data.description, 500, 'description');
      if (descMaxLengthError) errors.push(descMaxLengthError);
    }

    const invalidChars = /[<>:"/\\|?*]/;
    if (this.data.name && invalidChars.test(this.data.name)) {
      errors.push({
        field: 'name',
        message: 'El nombre contiene caracteres no válidos',
        code: 'INVALID_CHARACTERS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  clone(): FolderModel {
    return new FolderModel({ ...this.data });
  }

  isRoot(): boolean {
    return !this.data.parentId;
  }

  isSystemType(): boolean {
    return this.data.type === 'system';
  }

  isShared(): boolean {
    return this.data.type === 'shared' || this.data.visibility !== 'private';
  }

  canBeDeleted(): boolean {
    return !this.data.isProtected && 
           !this.data.isSystemFolder && 
           this.data.status !== 'deleted';
  }

  canBeRenamed(): boolean {
    return !this.data.isSystemFolder;
  }

  canBeMoved(): boolean {
    return !this.data.isSystemFolder && !this.data.isProtected;
  }

  getDepthLevel(): number {
    return this.data.path.split('/').length - 1;
  }
}

export class FolderFactory {
  static create(input: CreateFolderInput): FolderModel {
    const now = new Date();
    
    const folder: Folder = {
      id: this.generateId(),
      name: input.name.trim(),
      path: input.parentId ? `${input.parentId}/${input.name}` : input.name,
      level: 0,
      status: 'active',
      type: input.type || 'regular',
      visibility: input.visibility || 'private',
      tagIds: input.tagIds || [],
      viewSettings: {
        sortBy: 'name',
        sortOrder: 'asc',
        viewMode: 'list',
        showHiddenFiles: false,
        ...input.viewSettings
      },
      isFavorite: false,
      isProtected: false,
      isSystemFolder: input.type === 'system',
      createdAt: now,
      updatedAt: now,

      ...(input.parentId && { parentId: input.parentId }),
      ...(input.color && { color: input.color }),
      ...(input.description?.trim() && { description: input.description.trim() }),
      ...(input.icon && { icon: input.icon }),
    };

    return new FolderModel(folder);
  }

  static createRoot(): FolderModel {
    return this.create({
      name: 'Root',
      type: 'system'
    });
  }

  static createSystemFolder(name: string, icon?: string): FolderModel {
    const folder = this.create({
      name,
      type: 'system',
      ...(icon && { icon })
    });
    
    folder.protect();
    
    return folder;
  }

  static fromJSON(data: Folder): FolderModel {
    return new FolderModel(data);
  }

  private static generateId(): UUID {
    return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}