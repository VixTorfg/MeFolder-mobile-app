import { BaseEntity, UUID } from '../common/base';
import { FileExtension, FileCategory, FileTypeInfo } from '../common/file-extensions';
import { ColorInfo } from '../common/colors';

export type FileStatus = 'active' | 'archived' | 'deleted' | 'processing';

export type FileVisibility = 'private' | 'shared' | 'public';

export interface FileMetadata {
  size: number;             
  mimeType?: string;        
  checksum?: string;        
  
  imageMetadata?: {
    width: number;
    height: number;
    orientation?: number;
  };
  
  videoMetadata?: {
    duration: number;       
    width: number;
    height: number;
    framerate?: number;
  };
  
  audioMetadata?: {
    duration: number;       
    bitrate?: number;
    sampleRate?: number;
  };
}

export interface File extends BaseEntity {
  name: string;
  originalName: string;     
  extension: FileExtension;
  category: FileCategory;
  
  folderId?: UUID;         
  path: string;             
  
  status: FileStatus;
  visibility: FileVisibility;
   
  metadata: FileMetadata;
  
  color?: ColorInfo;        
  description?: string;  
  
  tagIds: UUID[];
  
  lastAccessedAt?: Date;
  archivedAt?: Date;
  
  storageUrl?: string;      // URL real del archivo
  thumbnailUrl?: string;    // URL de miniatura
}

export interface CreateFileInput {
  name: string;
  originalName: string;
  extension: FileExtension;
  folderId?: UUID;
  visibility?: FileVisibility;
  metadata: FileMetadata;
  color?: ColorInfo;
  description?: string;
  tagIds?: UUID[];
  storageUrl?: string;
  thumbnailUrl?: string;
}

export interface UpdateFileInput {
  name?: string;
  folderId?: UUID;
  status?: FileStatus;
  visibility?: FileVisibility;
  color?: ColorInfo;
  description?: string;
  tagIds?: UUID[];
}

/** 
 *Archivo con información completa
 */
export interface FileWithRelations extends File {
  folder?: {
    id: UUID;
    name: string;
    path: string;
  };
  tags: {
    id: UUID;
    name: string;
    color: ColorInfo;
  }[];
  typeInfo: FileTypeInfo;
}