import type { UUID } from "../common";
import {
  Folder,
  CreateFolderInput,
  UpdateFolderInput,
} from "../entities/folder";
import { BaseRepository } from "./base";

export interface FolderRepository extends BaseRepository<
  Folder,
  CreateFolderInput,
  UpdateFolderInput
> {
  findByFolderId(folderId: UUID): Promise<Folder[]>;
  findChildren(folderId: UUID): Promise<Folder[]>;
  findByVisibility(visibility: string): Promise<Folder[]>;
  findByStatus(status: string): Promise<Folder[]>;
  findByLevel(level: number): Promise<Folder[]>;
  findDeletedFolders(): Promise<Folder[]>;
  findAll(filters?: any, includeDeleted?: boolean): Promise<Folder[]>;
  getFolderViewConfig(folderId: UUID): Promise<Folder["viewSettings"] | null>;
  search(query: string, filters?: any): Promise<Folder[]>;

  updateStatus(folderId: UUID, status: string): Promise<void>;
  updateViewConfig(
    folderId: UUID,
    viewSettings: Partial<Folder["viewSettings"]>,
  ): Promise<void>;
  delete(id: UUID): Promise<boolean>;
  permanentDelete(id: UUID): Promise<boolean>;
  count(filters?: any): Promise<number>;
  exists(id: UUID): Promise<boolean>;
  update(id: UUID, input: UpdateFolderInput): Promise<Folder>;
  create(input: CreateFolderInput): Promise<Folder>;

  restore(folderId: UUID): Promise<void>;
}
