import type { UUID } from "../common/base";
import type { FileExtension } from "../common/file-extensions";
import type { FileMetadata, FileVisibility } from "../entities/file";

export type ArchiveFormat = Extract<
  FileExtension,
  "zip" | "rar" | "7z" | "tar" | "gz"
>;

export type SupportedArchiveFormat = "zip";

export type ArchiveCompressionLevel = "none" | "fast" | "normal" | "best";

export type ArchiveExtractMode = "extract_here" | "create_folder";

export type ArchivePhase = "inspect" | "compress" | "extract";

export type ArchiveEntryType = "file" | "directory";

export type ArchiveConflictType =
  | "output_archive_exists"
  | "destination_folder_exists"
  | "root_file_exists"
  | "root_folder_exists"
  | "unsupported_format"
  | "unsupported_option";

export type ArchiveUnsupportedFeature =
  | "password"
  | "encryption"
  | "partial_extraction"
  | "advanced_overwrite_mode";

export interface ArchiveFutureOptions {
  password?: string | undefined;
  encryption?: "zipcrypto" | "aes128" | "aes256" | undefined;
  partialEntries?: string[] | undefined;
  overwriteMode?: "overwrite" | "rename" | "skip" | undefined;
}

export interface ArchiveProgress {
  phase: ArchivePhase;
  processedEntries: number;
  totalEntries: number;
  currentEntryName?: string | undefined;
}

export interface ArchiveSourceFile {
  id: UUID;
  name: string;
  originalName: string;
  extension: FileExtension;
  path: string;
  metadata: FileMetadata;
  archivePath?: string | undefined;
  folderId?: UUID | undefined;
  visibility?: FileVisibility | undefined;
  storageUrl?: string | undefined;
}

export interface ArchiveVirtualEntry {
  path: string;
  content: string;
  encoding?: "utf8" | "base64" | undefined;
}

export interface ArchiveEntryDescriptor {
  path: string;
  name: string;
  type: ArchiveEntryType;
  depth: number;
  size?: number | undefined;
}

export interface ArchiveConflict {
  type: ArchiveConflictType;
  message: string;
  path: string;
  name?: string | undefined;
}

export interface ArchiveOperationError {
  code: ArchiveConflictType | "invalid_archive" | "unknown";
  message: string;
  unsupportedFeatures?: ArchiveUnsupportedFeature[] | undefined;
}

export interface ArchiveOperationResult<T> {
  success: boolean;
  data?: T | undefined;
  error?: ArchiveOperationError | undefined;
}

export interface ArchiveBaseParams {
  format?: ArchiveFormat | undefined;
  compressionLevel?: ArchiveCompressionLevel | undefined;
  futureOptions?: ArchiveFutureOptions | undefined;
  onProgress?: ((progress: ArchiveProgress) => void) | undefined;
}

export interface CreateArchiveFromFolderParams extends ArchiveBaseParams {
  sourceFolderId: UUID;
  destinationFolderId?: UUID | undefined;
  outputName?: string | undefined;
  visibility?: FileVisibility | undefined;
}

export interface CreateArchiveFromFilesParams extends ArchiveBaseParams {
  files: ArchiveSourceFile[];
  outputName: string;
  destinationFolderId?: UUID | undefined;
  rootFolderName?: string | undefined;
  virtualEntries?: ArchiveVirtualEntry[] | undefined;
  visibility?: FileVisibility | undefined;
}

export interface ExportAlbumArchiveParams extends ArchiveBaseParams {
  albumId: UUID;
  outputName?: string | undefined;
  destinationFolderId?: UUID | undefined;
  visibility?: FileVisibility | undefined;
}

export interface ImportAlbumArchiveSource {
  name: string;
  uri: string;
  mimeType?: string | undefined;
}

export interface ImportAlbumArchiveParams extends ArchiveBaseParams {
  archiveFile: ImportAlbumArchiveSource;
  destinationFolderId?: UUID | undefined;
  visibility?: FileVisibility | undefined;
}

export interface InspectArchiveParams {
  archiveFile: ArchiveSourceFile;
  parentFolderId: UUID;
  mode: ArchiveExtractMode;
  createFolderName?: string | undefined;
  futureOptions?: ArchiveFutureOptions | undefined;
}

export interface ExtractArchiveParams extends InspectArchiveParams {
  onProgress?: ((progress: ArchiveProgress) => void) | undefined;
}

export interface ArchiveInspection {
  format: ArchiveFormat;
  supported: boolean;
  hasSingleRootDirectory: boolean;
  suggestedContainerName: string;
  rootDirectoryName?: string | undefined;
  rootEntries: ArchiveEntryDescriptor[];
  entries: ArchiveEntryDescriptor[];
  conflicts: ArchiveConflict[];
  unsupportedFeatures: ArchiveUnsupportedFeature[];
  canExtract: boolean;
}

export interface ArchiveCreatedRecord {
  id: UUID;
  name: string;
  path: string;
}

export interface ArchiveCreationSummary {
  archiveFile: ArchiveCreatedRecord;
  entryCount: number;
  format: ArchiveFormat;
}

export interface ExportAlbumArchiveSummary extends ArchiveCreationSummary {
  albumId: UUID;
  albumName: string;
  archiveUri: string;
}

export interface ImportAlbumArchiveSummary {
  albumId: UUID;
  albumName: string;
  destinationFolder: ArchiveCreatedRecord;
  importedFileCount: number;
  thumbnailCount: number;
}

export interface ArchiveExtractionSummary {
  destinationFolder: ArchiveCreatedRecord;
  createdFolders: ArchiveCreatedRecord[];
  createdFiles: ArchiveCreatedRecord[];
  inspection: ArchiveInspection;
}
