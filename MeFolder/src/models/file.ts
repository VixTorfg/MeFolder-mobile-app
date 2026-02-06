import { 
  File, 
  CreateFileInput, 
  FileStatus,
  FileVisibility,
  FileMetadata
} from '../types/entities/file';
import { FileExtension, FileCategory, FILE_CATEGORY_MAP } from '../types/common/file-extensions';
import { UUID } from '../types/common/base';
import { ColorInfo } from '../types/common/colors';
import { BaseModel, ValidationResult, ValidationUtils } from './base';
import { formatFileSize } from '../utils';

export class FileModel extends BaseModel<File> {
  constructor(data: File) {
    super(data);
  }

  get name(): string {
    return this.data.name;
  }

  get originalName(): string {
    return this.data.originalName;
  }

  get extension(): FileExtension {
    return this.data.extension;
  }

  get category(): FileCategory {
    return this.data.category;
  }

  get folderId(): UUID | undefined {
    return this.data.folderId;
  }

  get path(): string {
    return this.data.path;
  }

  get status(): FileStatus {
    return this.data.status;
  }

  get visibility(): FileVisibility {
    return this.data.visibility;
  }

  get metadata(): FileMetadata {
    return this.data.metadata;
  }

  get size(): number {
    return this.data.metadata.size;
  }

  get tagIds(): UUID[] {
    return [...this.data.tagIds];
  }

  get color(): ColorInfo | undefined {
    return this.data.color;
  }

  setName(name: string): void {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('El nombre no puede estar vacío');
    
    this.data.name = cleanName;
    this.updatePath();
  }

  setFolder(folderId: UUID | undefined, folderPath?: string): void {
    if (folderId) {
      this.data.folderId = folderId;
    } else {
      delete this.data.folderId;
    }
    this.updatePath(folderPath);
  }

  setStatus(status: FileStatus): void {
    this.data.status = status;
    this.data.updatedAt = new Date();

    if (status === 'archived') {
      this.data.archivedAt = new Date();
    }
  }

  setVisibility(visibility: FileVisibility): void {
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

  setDescription(description: string | undefined): void {
    const trimmed = description?.trim();
    if (trimmed) {
      this.data.description = trimmed;
    } else {
      delete this.data.description;
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

  markAsAccessed(): void {
    this.data.lastAccessedAt = new Date();
  }

  private updatePath(folderPath?: string): void {
    if (this.data.folderId && folderPath) {
      this.data.path = `${folderPath}/${this.data.name}`;
    } else {
      this.data.path = this.data.name;
    }
    this.data.updatedAt = new Date();
  }

  validate(): ValidationResult {
    const errors = [];

    const nameError = ValidationUtils.required(this.data.name, 'name');
    if (nameError) errors.push(nameError);

    const nameLengthError = ValidationUtils.maxLength(this.data.name, 255, 'name');
    if (nameLengthError) errors.push(nameLengthError);

    const maxSize = 100 * 1024 * 1024;
    const sizeError = ValidationUtils.fileSize(this.data.metadata.size, maxSize, 'file');
    if (sizeError) errors.push(sizeError);

    if (!this.data.extension) {
      errors.push({
        field: 'extension',
        message: 'Extensión de archivo es requerida',
        code: 'REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  clone(): FileModel {
    return new FileModel({ ...this.data });
  }

  isImage(): boolean {
    return this.data.category === 'image';
  }

  isVideo(): boolean {
    return this.data.category === 'video';
  }

  isDocument(): boolean {
    return this.data.category === 'document';
  }

  isArchived(): boolean {
    return this.data.status === 'archived';
  }

  isDeleted(): boolean {
    return this.data.status === 'deleted';
  }

  canBeDeleted(): boolean {
    return this.data.status === 'active' || this.data.status === 'archived';
  }

  getFormattedSize(): string {
    return formatFileSize(this.data.metadata.size);
  }
}

export class FileFactory {
  static create(input: CreateFileInput): FileModel {
    const now = new Date();
    const category = FILE_CATEGORY_MAP[input.extension] || 'other';
    
    const file: File = {
      id: this.generateId(),
      name: input.name.trim(),
      originalName: input.originalName.trim(),
      extension: input.extension,
      category,
      path: input.folderId ? `${input.folderId}/${input.name}` : input.name,
      status: 'active',
      visibility: input.visibility || 'private',
      metadata: input.metadata,
      tagIds: input.tagIds || [],
      createdAt: now,
      updatedAt: now,

      ...(input.folderId && { folderId: input.folderId }),
      ...(input.color && { color: input.color }),
      ...(input.description?.trim() && { description: input.description.trim() }),
      ...(input.storageUrl && { storageUrl: input.storageUrl }),
      ...(input.thumbnailUrl && { thumbnailUrl: input.thumbnailUrl }),
    };

    return new FileModel(file);
  }

  static fromJSON(data: File): FileModel {
    return new FileModel(data);
  }

  private static generateId(): UUID {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}