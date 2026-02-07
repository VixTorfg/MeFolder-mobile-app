import type { FileExtension, UUID } from '../common';
import { File, CreateFileInput, UpdateFileInput } from '../entities/file';
import { BaseRepository } from './base';

export interface FileRepository extends BaseRepository<File, CreateFileInput, UpdateFileInput> {
  findByFolderId(folderId: UUID): Promise<File[]>;
  findByExtension(extension: FileExtension): Promise<File[]>;
  findByTagIds(tagIds: UUID[]): Promise<File[]>;
  findByCategory(category: string): Promise<File[]>;
  findByStatus(status: string): Promise<File[]>; 
  findAll(filters?: any): Promise<File[]>;
  search(query: string, filters?: any): Promise<File[]>; 
  
  create(input: CreateFileInput): Promise<File>;
  update(id: UUID, input: UpdateFileInput): Promise<File>;
  updateTags(fileId: UUID, tagIds: UUID[]): Promise<void>;
  delete(id: UUID): Promise<boolean>;
  count(filters?: any): Promise<number>;
  exists(id: UUID): Promise<boolean>;
  
  //TODO
  /*markAsAccessed(fileId: UUID);
  move(fileId, folderId, newPath);
  archive(fileId)
  restore(fileId)
  bulkCreate(files: CreateFileInput[])
  findRecentlyAccessed(limit)
  updateStatus(fileId, status)

  Tipa filter
  */
}