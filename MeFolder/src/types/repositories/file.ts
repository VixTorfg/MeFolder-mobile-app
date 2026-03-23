import type { FileExtension, UUID } from '../common';
import { File, CreateFileInput, UpdateFileInput } from '../entities/file';
import { BaseRepository } from './base';

export interface FileRepository extends BaseRepository<File, CreateFileInput, UpdateFileInput> {
  findByFolderId(folderId: UUID): Promise<File[]>;
  findByExtension(extension: FileExtension): Promise<File[]>;
  findChildren(folderId: UUID): Promise<File[]>;
  findByTagIds(tagIds: UUID[]): Promise<File[]>;
  findByCategory(category: string): Promise<File[]>;
  findDeletedFiles(): Promise<File[]>;
  findByStatus(status: string): Promise<File[]>; 
  findAll(filters?: any, includeDeleted?: boolean): Promise<File[]>;
  search(query: string, filters?: any): Promise<File[]>; 
  
  create(input: CreateFileInput, folderPath?: string): Promise<File>;
  update(id: UUID, input: UpdateFileInput): Promise<File>;
  updateTags(fileId: UUID, tagIds: UUID[]): Promise<void>;
  updateStatus(fileId: UUID, status: string): Promise<void>;
  renameFile(id: UUID, newName: string, newPath: string): Promise<void>;
  delete(id: UUID): Promise<boolean>;
  permanentDelete(id: UUID): Promise<boolean>;
  count(filters?: any): Promise<number>;
  exists(id: UUID): Promise<boolean>;

  restore(fileId: UUID): Promise<void>;
  
  //TODO
  /*markAsAccessed(fileId: UUID);
  move(fileId, folderId, newPath);
  archive(fileId)
  bulkCreate(files: CreateFileInput[])
  findRecentlyAccessed(limit)
  

  Tipa filter
  */
}