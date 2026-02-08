import { BaseEntity, UUID } from '../common/base';
import { ColorInfo } from '../common/colors';

export type TagType = 'system' | 'user' | 'automatic';

export type TagPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Tag extends BaseEntity {
  name: string;
  description?: string;
  color: ColorInfo;
  type: TagType;
  priority: TagPriority;
  isActive: boolean;
  
  usageCount: number;        
  lastUsedAt?: Date;         
  
  parentId?: UUID;
  children?: UUID[];
}

export interface CreateTagInput {
  name: string;
  description?: string;
  color: ColorInfo;
  type?: TagType;           
  priority?: TagPriority;   
  parentId?: UUID;
}

export interface UpdateTagInput {
  name?: string;
  description?: string;
  color?: ColorInfo;
  priority?: TagPriority;
  isActive?: boolean;
  parentId?: UUID;
}

export interface TagWithRelations extends Tag {
  parent?: Tag;
  childrenList: Tag[];
  fileCount: number;        
  folderCount: number;      
}