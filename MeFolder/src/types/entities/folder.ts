import { BaseEntity, UUID } from '../common/base';
import { ColorInfo } from '../common/colors';

export type FolderStatus = 'active' | 'archived' | 'deleted';

export type FolderType = 'regular' | 'system' | 'shared';

export type FolderVisibility = 'private' | 'shared' | 'public';

export type FolderSortBy = 'name' | 'date' | 'size' | 'type';
export type FolderSortOrder = 'asc' | 'desc';
export type FolderViewMode = 'list' | 'grid' | 'big_icon' | 'medium_icon' | 'small_icon' | 'content';

export interface FolderViewSettings {
  sortBy: FolderSortBy;
  sortOrder: FolderSortOrder;
  viewMode: FolderViewMode;
  showHiddenFiles: boolean;
}

export interface FolderStats {
  totalFiles: number;
  totalSubfolders: number;
  totalSize: number;        
  lastModified: Date;     
}

export interface Folder extends BaseEntity {
  name: string;
  description?: string;
  
  parentId?: UUID;         
  path: string;             
  level: number;            
  
  status: FolderStatus;
  type: FolderType;
  visibility: FolderVisibility;
  
  color?: ColorInfo;        
  icon?: string;            
  
  tagIds: UUID[];
  
  viewSettings: FolderViewSettings;
  
  lastAccessedAt?: Date;
  archivedAt?: Date;
  
  isFavorite: boolean;
  isProtected: boolean;     
  isSystemFolder: boolean;  
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  parentId?: UUID;
  type?: FolderType;
  visibility?: FolderVisibility;
  color?: ColorInfo;
  icon?: string;
  tagIds?: UUID[];
  viewSettings?: Partial<FolderViewSettings>;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string;
  parentId?: UUID;
  status?: FolderStatus;
  visibility?: FolderVisibility;
  color?: ColorInfo;
  icon?: string;
  tagIds?: UUID[];
  viewSettings?: Partial<FolderViewSettings>;
  isFavorite?: boolean;
  isProtected?: boolean;
}

export interface FolderWithRelations extends Folder {
  parent?: {
    id: UUID;
    name: string;
    path: string;
  };
  children: {
    id: UUID;
    name: string;
    type: 'folder' | 'file';
  }[];
  tags: {
    id: UUID;
    name: string;
    color: ColorInfo;
  }[];
  stats: FolderStats;
}

export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  fileCount: number;
  isExpanded?: boolean;
  isLoading?: boolean;
}