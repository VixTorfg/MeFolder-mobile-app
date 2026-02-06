import { UUID } from '../common/base';
import { FileExtension, FileCategory } from '../common/file-extensions';
import { TagPriority } from '../entities/tag';

// Tipos de filtros disponibles
export interface SearchFilters {
  // Filtros de texto
  query?: string;           // Búsqueda por nombre
  
  // Filtros de archivos
  extensions?: FileExtension[];
  categories?: FileCategory[];
  sizeRange?: {
    min?: number;          // bytes
    max?: number;          // bytes
  };
  
  // Filtros de fecha
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  
  // Filtros de tags
  tagIds?: UUID[];
  tagMode?: 'any' | 'all'; // Si debe tener cualquier tag o todos
  
  // Filtros de ubicación
  folderIds?: UUID[];      // Buscar solo en estas carpetas
  includeSubfolders?: boolean;
  
  // Filtros de estado
  statuses?: ('active' | 'archived')[];
  
  // Filtros de metadatos
  hasColor?: boolean;      // Tiene color personalizado
  hasTags?: boolean;       // Tiene al menos un tag
  hasDescription?: boolean; // Tiene descripción
}

// Opciones de ordenamiento
export interface SortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'lastAccessedAt';
  order: 'asc' | 'desc';
}

// Parámetros completos de búsqueda
export interface SearchParams {
  filters: SearchFilters;
  sort: SortOptions;
  pagination: {
    limit: number;
    offset: number;
  };
}

// Resultado de búsqueda con metadata
export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  searchTime: number;      // tiempo en ms
  filters: SearchFilters;  // filtros aplicados
}

// Sugerencia de búsqueda
export interface SearchSuggestion {
  type: 'file' | 'folder' | 'tag' | 'query';
  value: string;
  label: string;
  metadata?: {
    count?: number;        // cuántos resultados tiene
    icon?: string;         // icono sugerido
  };
}