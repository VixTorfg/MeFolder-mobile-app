import { SYSTEM_COLORS } from "@/constants/themes/colors";
import {
  ROOT_FOLDER_ID,
  SYSTEM_GALLERY_FOLDER_ID,
} from "@/database/seeds/systemFolders";
import { FileModel } from "@/models/file";
import type {
  ArchiveCreatedRecord,
  ArchiveOperationError,
  ArchiveOperationResult,
  ArchiveSourceFile,
  ExportAlbumArchiveParams,
  ExportAlbumArchiveSummary,
  ImportAlbumArchiveParams,
  ImportAlbumArchiveSummary,
  UUID,
} from "@/types";
import {
  FILE_CATEGORY_MAP,
  type FileCategory,
  type FileExtension,
} from "@/types/common/file-extensions";
import { FileService } from "../FileService";
import { FolderService } from "../FolderService";
import { FileSystemService } from "../filesystem/FileSystemService";
import {
  MediaImportService,
  type RegisterExistingMediaFile,
} from "../media/MediaImportService";
import { TagService } from "../TagService";
import { ArchiveService } from "./ArchiveService";
import {
  buildArchiveEntries,
  getParentArchivePath,
  indexZipFiles,
  joinArchivePath,
  loadZipFromUri,
  normalizeArchivePath,
  validateArchiveFutureOptions,
} from "./archiveUtils";

const LEGACY_ALBUM_MANIFEST_FILE_NAME = ".album.json";

export class AlbumArchiveService {
  private readonly fs = new FileSystemService();
  private readonly folderService = new FolderService();
  private readonly mediaImportService = new MediaImportService();
  private readonly systemColors = Object.values(SYSTEM_COLORS);

  constructor(
    private readonly archiveService: ArchiveService = new ArchiveService(),
    private readonly tagService: TagService = new TagService(),
    private readonly fileService: FileService = new FileService(),
  ) {}

  async exportAlbum(
    params: ExportAlbumArchiveParams,
  ): Promise<ArchiveOperationResult<ExportAlbumArchiveSummary>> {
    try {
      const album = await this.tagService.getTag(params.albumId);
      if (!album.isAlbum()) {
        return this.fail({
          code: "invalid_archive",
          message: "Solo se pueden exportar álbumes",
        });
      }

      const files = await this.tagService.getFilesInTag(params.albumId);
      const preparedFiles = this.buildArchiveFiles(files);

      const archiveResult = await this.archiveService.createArchiveFromFiles({
        files: preparedFiles,
        outputName: params.outputName ?? album.name,
        destinationFolderId: params.destinationFolderId ?? ROOT_FOLDER_ID,
        ...(params.format ? { format: params.format } : {}),
        ...(params.compressionLevel
          ? { compressionLevel: params.compressionLevel }
          : {}),
        ...(params.futureOptions
          ? { futureOptions: params.futureOptions }
          : {}),
        ...(params.onProgress ? { onProgress: params.onProgress } : {}),
        ...(params.visibility ? { visibility: params.visibility } : {}),
      });

      if (!archiveResult.success || !archiveResult.data) {
        return this.fail({
          code: archiveResult.error?.code ?? "unknown",
          message:
            archiveResult.error?.message ?? "No se pudo crear el ZIP del álbum",
          ...(archiveResult.error?.unsupportedFeatures
            ? {
                unsupportedFeatures: archiveResult.error.unsupportedFeatures,
              }
            : {}),
        });
      }

      const archiveFile = await this.fileService.getFile(
        archiveResult.data.archiveFile.id,
      );
      const archiveUri =
        archiveFile.storageUrl ?? this.fs.resolveUri(archiveFile.path);

      return {
        success: true,
        data: {
          ...archiveResult.data,
          albumId: params.albumId,
          albumName: album.name,
          archiveUri,
        },
      };
    } catch (error) {
      return this.fail({
        code: "unknown",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo exportar el álbum",
      });
    }
  }

  async importAlbumArchive(
    params: ImportAlbumArchiveParams,
  ): Promise<ArchiveOperationResult<ImportAlbumArchiveSummary>> {
    let createdAlbumId: UUID | null = null;
    let createdFolderId: UUID | null = null;

    try {
      const optionError = validateArchiveFutureOptions(params.futureOptions);
      if (optionError) {
        return this.fail(optionError);
      }

      const albumName = this.removeExtension(params.archiveFile.name).trim();
      const destinationParentId =
        params.destinationFolderId ?? SYSTEM_GALLERY_FOLDER_ID;

      params.onProgress?.({
        phase: "inspect",
        processedEntries: 0,
        totalEntries: 1,
        currentEntryName: params.archiveFile.name,
      });

      const availabilityError = await this.ensureImportAvailability(
        albumName,
        destinationParentId,
      );
      if (availabilityError) {
        return this.fail(availabilityError);
      }

      const zipResult = await loadZipFromUri(this.fs, params.archiveFile.uri);
      if (!zipResult.success || !zipResult.data) {
        return this.fail(
          zipResult.error ?? {
            code: "invalid_archive",
            message: "No se pudo leer el ZIP del álbum",
          },
        );
      }

      const zip = zipResult.data;
      const entries = buildArchiveEntries(zip, (path) =>
        this.shouldSkipImportEntry(path),
      );
      const directoryEntries = entries.filter(
        (entry) => entry.type === "directory",
      );
      const fileEntries = entries.filter((entry) => entry.type === "file");

      if (fileEntries.length === 0) {
        return this.fail({
          code: "invalid_archive",
          message: "El ZIP no contiene archivos importables",
        });
      }

      const destinationFolder = await this.folderService.createFolder({
        name: albumName,
        parentId: destinationParentId,
      });
      createdFolderId = destinationFolder.id;

      const destinationFolderUri = this.fs.resolveUri(destinationFolder.path);
      const ensureRootResult = this.fs.ensureDirectory(destinationFolderUri);
      if (!ensureRootResult.success) {
        throw new Error(
          ensureRootResult.error ??
            "No se pudo preparar la carpeta destino del álbum importado",
        );
      }

      const album = await this.tagService.createAlbum({
        name: albumName,
        color: this.pickRandomSystemColor(),
      });
      createdAlbumId = album.id;

      const folderMap = new Map<string, ArchiveCreatedRecord>();
      const indexedFiles = indexZipFiles(zip, (path) =>
        this.shouldSkipImportEntry(path),
      );
      const extractedFiles: RegisterExistingMediaFile[] = [];
      const totalEntries = directoryEntries.length + fileEntries.length * 2;
      let processedEntries = 0;

      for (const directoryEntry of directoryEntries) {
        const parentArchivePath = getParentArchivePath(directoryEntry.path);
        const parentFolderId = parentArchivePath
          ? folderMap.get(parentArchivePath)?.id
          : destinationFolder.id;

        if (!parentFolderId) {
          throw new Error(
            `No se pudo resolver la carpeta padre para ${directoryEntry.path}`,
          );
        }

        const createdFolder = await this.folderService.createFolder({
          name: directoryEntry.name,
          parentId: parentFolderId,
        });

        const createdFolderUri = this.fs.resolveUri(createdFolder.path);
        const ensureResult = this.fs.ensureDirectory(createdFolderUri);
        if (!ensureResult.success) {
          throw new Error(
            ensureResult.error ??
              `No se pudo crear el directorio ${directoryEntry.name}`,
          );
        }

        folderMap.set(directoryEntry.path, {
          id: createdFolder.id,
          name: createdFolder.name,
          path: createdFolder.path,
        });

        processedEntries += 1;
        params.onProgress?.({
          phase: "extract",
          processedEntries,
          totalEntries,
          currentEntryName: directoryEntry.path,
        });
      }

      for (const fileEntry of fileEntries) {
        const zipEntry = indexedFiles.get(fileEntry.path);
        if (!zipEntry) {
          throw new Error(
            `No se encontró la entrada ${fileEntry.path} dentro del ZIP`,
          );
        }

        const parentArchivePath = getParentArchivePath(fileEntry.path);
        const parentFolderId = parentArchivePath
          ? folderMap.get(parentArchivePath)?.id
          : destinationFolder.id;
        const parentFolderPath = parentArchivePath
          ? folderMap.get(parentArchivePath)?.path
          : destinationFolder.path;

        if (!parentFolderId || !parentFolderPath) {
          throw new Error(
            `No se pudo resolver la carpeta padre para ${fileEntry.path}`,
          );
        }

        const targetUri = this.fs.resolveUri(
          joinArchivePath(parentFolderPath, fileEntry.name),
        );
        const base64Content = await zipEntry.async("base64");
        const writeResult = this.fs.writeFile({
          uri: targetUri,
          content: base64Content,
          encoding: "base64",
        });

        if (!writeResult.success) {
          throw new Error(
            writeResult.error ?? `No se pudo escribir ${fileEntry.name}`,
          );
        }

        extractedFiles.push({
          id: fileEntry.path,
          name: fileEntry.name,
          originalName: fileEntry.name,
          uri: targetUri,
          type: this.resolveFileCategory(fileEntry.name),
          folderId: parentFolderId,
          visibility: params.visibility ?? "public",
          tagIds: [album.id],
        });

        processedEntries += 1;
        params.onProgress?.({
          phase: "extract",
          processedEntries,
          totalEntries,
          currentEntryName: fileEntry.path,
        });
      }

      const persistedFiles =
        await this.mediaImportService.registerExistingFiles({
          files: extractedFiles,
          onProgress: (progress) => {
            params.onProgress?.({
              phase: "extract",
              processedEntries:
                directoryEntries.length +
                fileEntries.length +
                progress.completed,
              totalEntries,
              ...(progress.currentFileName
                ? { currentEntryName: progress.currentFileName }
                : {}),
            });
          },
        });

      if (persistedFiles.failed.length > 0) {
        throw new Error(
          persistedFiles.failed[0]?.error ??
            "No se pudieron registrar todos los archivos del ZIP",
        );
      }

      params.onProgress?.({
        phase: "extract",
        processedEntries: totalEntries,
        totalEntries,
        currentEntryName: albumName,
      });

      return {
        success: true,
        data: {
          albumId: album.id,
          albumName: album.name,
          destinationFolder: {
            id: destinationFolder.id,
            name: destinationFolder.name,
            path: destinationFolder.path,
          },
          importedFileCount: persistedFiles.importedFiles.length,
          thumbnailCount: persistedFiles.importedFiles.filter((file) =>
            Boolean(file.thumbnailUrl),
          ).length,
        },
      };
    } catch (error) {
      if (createdFolderId) {
        try {
          await this.folderService.permanentDeleteFolder(createdFolderId);
        } catch {
          // Ignorado: el rollback es best-effort.
        }
      }

      if (createdAlbumId) {
        try {
          await this.tagService.deleteTag(createdAlbumId);
        } catch {
          // Ignorado: el rollback es best-effort.
        }
      }

      return this.fail({
        code: "unknown",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo importar el álbum desde ZIP",
      });
    }
  }

  private buildArchiveFiles(files: FileModel[]): ArchiveSourceFile[] {
    const normalizedPaths = files.map((file) => this.normalizePath(file.path));
    const baseDirectory = this.findCommonBaseDirectory(normalizedPaths);
    const usedArchivePaths = new Set<string>();

    return files.map((file) => {
      const archivePath = this.ensureUniqueArchivePath(
        this.buildRelativeArchivePath(
          this.normalizePath(file.path),
          baseDirectory,
        ),
        usedArchivePaths,
      );

      return {
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        extension: file.extension,
        path: file.path,
        metadata: file.metadata,
        archivePath,
        ...(file.folderId ? { folderId: file.folderId } : {}),
        ...(file.visibility ? { visibility: file.visibility } : {}),
        ...(file.storageUrl ? { storageUrl: file.storageUrl } : {}),
      };
    });
  }

  private async ensureImportAvailability(
    albumName: string,
    destinationParentId: UUID,
  ): Promise<ArchiveOperationError | null> {
    const normalizedName = albumName.trim();
    if (!normalizedName) {
      return {
        code: "invalid_archive",
        message: "El álbum importado debe tener un nombre válido",
      };
    }

    const albums = await this.tagService.getAllAlbums();
    const existingAlbum = albums.find((album) => album.name === normalizedName);
    if (existingAlbum) {
      return {
        code: "unknown",
        message: `Ya existe un álbum con el nombre "${normalizedName}"`,
      };
    }

    const folders = await this.folderService.getSubfolders(destinationParentId);
    const existingFolder = folders.find(
      (folder) => folder.name === normalizedName,
    );
    if (existingFolder) {
      return {
        code: "destination_folder_exists",
        message:
          "No es posible importar el álbum porque ya existe una carpeta con ese nombre en Galería",
      };
    }

    return null;
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\\/g, "/")
      .replace(/^\/+|\/+$/g, "")
      .trim();
  }

  private shouldSkipImportEntry(path: string): boolean {
    const normalizedPath = normalizeArchivePath(path);
    return (
      normalizedPath === LEGACY_ALBUM_MANIFEST_FILE_NAME ||
      normalizedPath.endsWith(`/${LEGACY_ALBUM_MANIFEST_FILE_NAME}`) ||
      normalizedPath.startsWith(".thumbnails/") ||
      normalizedPath.includes("/.thumbnails/")
    );
  }

  private findCommonBaseDirectory(paths: string[]): string {
    if (paths.length === 0) {
      return "";
    }

    const directorySegments = paths.map((path) =>
      (getParentArchivePath(path) ?? "").split("/").filter(Boolean),
    );
    const commonSegments: string[] = [];
    const minLength = Math.min(
      ...directorySegments.map((segments) => segments.length),
    );

    for (let index = 0; index < minLength; index += 1) {
      const segment = directorySegments[0]?.[index];
      if (!segment) {
        break;
      }

      if (directorySegments.every((segments) => segments[index] === segment)) {
        commonSegments.push(segment);
        continue;
      }

      break;
    }

    return commonSegments.join("/");
  }

  private buildRelativeArchivePath(
    filePath: string,
    baseDirectory: string,
  ): string {
    if (!baseDirectory) {
      return filePath.split("/").pop() ?? filePath;
    }

    const prefix = `${baseDirectory}/`;
    if (filePath.startsWith(prefix)) {
      return filePath.slice(prefix.length);
    }

    return filePath.split("/").pop() ?? filePath;
  }

  private ensureUniqueArchivePath(
    path: string,
    usedPaths: Set<string>,
  ): string {
    const normalizedPath = normalizeArchivePath(path);
    const parentPath = getParentArchivePath(normalizedPath);
    const fileName = normalizedPath.split("/").pop() ?? normalizedPath;
    const dotIndex = fileName.lastIndexOf(".");
    const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
    const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";

    let candidateName = fileName;
    let candidatePath = normalizedPath;
    let index = 2;

    while (usedPaths.has(candidatePath)) {
      candidateName = `${baseName} (${index})${extension}`;
      candidatePath = parentPath
        ? joinArchivePath(parentPath, candidateName)
        : candidateName;
      index += 1;
    }

    usedPaths.add(candidatePath);
    return candidatePath;
  }

  private resolveFileCategory(fileName: string): FileCategory {
    const extension = this.getExtensionFromName(fileName);
    return FILE_CATEGORY_MAP[extension as FileExtension] ?? "other";
  }

  private getExtensionFromName(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex <= 0) {
      return "";
    }

    return fileName.slice(dotIndex + 1).toLowerCase();
  }

  private removeExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  }

  private pickRandomSystemColor() {
    const randomIndex = Math.floor(Math.random() * this.systemColors.length);
    return this.systemColors[randomIndex] ?? SYSTEM_COLORS.yellow;
  }

  private fail<T>(error: ArchiveOperationError): ArchiveOperationResult<T> {
    return { success: false, error };
  }
}
