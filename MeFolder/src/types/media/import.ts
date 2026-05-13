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
