import type { FileCategory } from "@/types/common/file-extensions";

export type MediaImportFileType = FileCategory;

export interface MediaImportFile {
  id: string;
  name: string;
  originalName: string;
  uri: string;
  size?: number;
  mimeType?: string;
  type: MediaImportFileType;
  /** Ancho intrínseco en píxeles (precalculado desde MediaLibrary.Asset) */
  width?: number;
  /** Alto intrínseco en píxeles (precalculado desde MediaLibrary.Asset) */
  height?: number;
  /** Duración en segundos (precalculada desde MediaLibrary.Asset, solo video/audio) */
  duration?: number;
}

export interface MediaImportProgress {
  completed: number;
  total: number;
  currentFileName?: string;
}

export interface MediaImportFailure {
  id: string;
  name: string;
  error: string;
}
