import type { UUID } from '../common';
import { Folder, CreateFolderInput, UpdateFolderInput } from '../entities/folder';
import { BaseRepository } from './base';

export interface FolderRepository extends BaseRepository<Folder, CreateFolderInput, UpdateFolderInput> {
  findByFolderId(folderId: UUID): Promise<Folder[]>;
  findByTagIds(tagIds: UUID[]): Promise<Folder[]>;
  findByVisibility(visibility: string): Promise<Folder[]>;
  findByStatus(status: string): Promise<Folder[]>;
  findByLevel(level: number): Promise<Folder[]>;
  findAll(filters?: any): Promise<Folder[]>;
  search(query: string, filters?: any): Promise<Folder[]>;  
  
  updateTags(folderId: UUID, tagIds: UUID[]): Promise<void>;
  delete(id: UUID): Promise<boolean>;
  count(filters?: any): Promise<number>;
  exists(id: UUID): Promise<boolean>;
  update(id: UUID, input: UpdateFolderInput): Promise<Folder>;
  create(input: CreateFolderInput): Promise<Folder>;
}
