import type { UUID } from '../common';

export interface BaseRepository<T, CreateInput, UpdateInput> {
 
  findById(id: UUID): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  create(input: CreateInput): Promise<T>;
  update(id: UUID, input: UpdateInput): Promise<T>;
  delete(id: UUID): Promise<boolean>;
  
  count(filters?: any): Promise<number>;
  exists(id: UUID): Promise<boolean>;
}