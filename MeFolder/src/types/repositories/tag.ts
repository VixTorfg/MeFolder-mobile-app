import type { UUID } from "../common";
import {
  Tag,
  CreateTagInput,
  UpdateTagInput,
  TagPriority,
  TagType,
} from "../entities/tag";
import { BaseRepository } from "./base";

/**
 * Repositorio base para operaciones CRUD de etiquetas
 */
export interface TagRepository extends BaseRepository<
  Tag,
  CreateTagInput,
  UpdateTagInput
> {
  findByName(name: string): Promise<Tag | null>;
  findByType(type: TagType): Promise<Tag[]>;
  findByPriority(priority: TagPriority): Promise<Tag[]>;
  findByParentId(parentId: UUID): Promise<Tag[]>;
  findByUsageCount(minUsage: number): Promise<Tag[]>;
  findMostUsed(limit: number): Promise<Tag[]>;
  findSystemTags(): Promise<Tag[]>;
  findActiveTags(): Promise<Tag[]>;
  search(query: string, filters?: any): Promise<Tag[]>;

  updateUsageCount(tagId: UUID, increment: number): Promise<void>;
  incrementUsage(tagId: UUID): Promise<void>;
  decrementUsage(tagId: UUID): Promise<void>;
  updateLastUsed(tagId: UUID): Promise<void>;

  createHierarchy(parentId: UUID, childIds: UUID[]): Promise<void>;
  getHierarchy(tagId: UUID): Promise<Tag[]>;
  getTagTree(): Promise<TagTreeNode[]>;

  bulkCreate(inputs: CreateTagInput[]): Promise<Tag[]>;
  bulkDelete(ids: UUID[]): Promise<number>;

  count(filters?: any): Promise<number>;
  exists(id: UUID): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}

/**
 * Repositorio para asignación de etiquetas a archivos
 */
export interface TagAssignmentRepository {
  // Operaciones para archivos
  assignTagsToFile(fileId: UUID, tagIds: UUID[]): Promise<void>;
  removeTagsFromFile(fileId: UUID, tagIds: UUID[]): Promise<void>;
  getFileTagIds(fileId: UUID): Promise<UUID[]>;
  getFileTags(fileId: UUID): Promise<Tag[]>;

  // Consultas
  getTaggedFiles(tagId: UUID): Promise<UUID[]>;
  getTagUsageInFiles(tagId: UUID): Promise<number>;

  // Operaciones de limpieza
  cleanupUnusedTags(): Promise<UUID[]>;
  removeAllTagsFromFile(fileId: UUID): Promise<void>;

  // Estadísticas
  getTagAssignmentStats(tagId: UUID): Promise<TagAssignmentStats>;
  getPopularTags(limit: number): Promise<TagWithUsage[]>;
}

/**
 * Nodo del árbol jerárquico de etiquetas
 */
export interface TagTreeNode {
  tag: Tag;
  children: TagTreeNode[];
  totalUsage: number;
  isExpanded?: boolean;
}

/**
 * Estadísticas de asignación de una etiqueta
 */
export interface TagAssignmentStats {
  tagId: UUID;
  filesCount: number;
  totalUsage: number;
  lastUsed?: Date;
}

/**
 * Etiqueta con información de uso
 */
export interface TagWithUsage extends Tag {
  filesUsage: number;
  totalUsage: number;
  usagePercentage: number;
}
