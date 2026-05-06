import mime from "mime";
import { SYSTEM_COLORS } from "@/constants/themes/colors";
import { SYSTEM_TAG_IDS } from "@/database/seeds/systemTags";
import { FileModel, TagModel } from "@/models";
import type {
  CreateFileInput,
  FileCategory,
  FileMetadata,
  FSFileInfo,
} from "@/types";
import type { ColorInfo } from "@/types/common/colors";
import { FILE_CATEGORY_MAP } from "@/types/common/file-extensions";
import type { FileExtension } from "@/types/common/file-extensions";
import type {
  MediaImportFailure,
  MediaImportFile,
  MediaImportProgress,
} from "@/types/media";
import type { UUID } from "@/types/common/base";
import { FileService } from "../FileService";
import { TagService } from "../TagService";
import { FileSystemService } from "../filesystem/FileSystemService";
import { MediaService } from "./MediaService";

/**
 * Casos donde la librería `mime` devuelve una extensión incorrecta para la
 * categoría real del archivo.
 */
const MIME_EXT_OVERRIDES: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
};

export interface ImportMediaFilesParams {
  files: MediaImportFile[];
  folderId?: UUID;
  tagIds?: UUID[];
  onProgress?: (progress: MediaImportProgress) => void;
}

export interface ImportMediaFilesResult {
  importedFiles: FileModel[];
  failed: MediaImportFailure[];
}

export interface ImportMediaAlbumParams extends ImportMediaFilesParams {
  albumName: string;
  color?: ColorInfo;
}

export interface ImportMediaAlbumResult extends ImportMediaFilesResult {
  album: TagModel | null;
}

export class MediaImportService {
  private readonly fs = new FileSystemService();
  private readonly media = new MediaService();
  private readonly systemColors = Object.values(SYSTEM_COLORS);

  constructor(
    private readonly fileService: FileService = new FileService(),
    private readonly tagService: TagService = new TagService(),
  ) {}

  async importFiles({
    files,
    folderId,
    tagIds = [],
    onProgress,
  }: ImportMediaFilesParams): Promise<ImportMediaFilesResult> {
    const importedFiles: FileModel[] = [];
    const failed: MediaImportFailure[] = [];
    const total = files.length;

    onProgress?.({ completed: 0, total });

    if (files.length === 0) {
      return { importedFiles, failed };
    }

    const targetPath = await this.fileService.resolveStoragePath(folderId);
    const targetDirUri = this.fs.resolveUri(targetPath);
    const ensured = this.fs.ensureDirectory(targetDirUri);

    if (!ensured.success) {
      throw new Error(
        ensured.error ?? "No se pudo preparar el directorio destino",
      );
    }

    for (const [index, file] of files.entries()) {
      let copiedUri: string | null = null;

      try {
        const resolvedExt = this.resolveExtension(file.mimeType, file.name);
        const fileNameWithExt = this.buildFileName(file.name, resolvedExt);
        const destinationUri = this.fs.resolveUri(
          `${targetPath}/${fileNameWithExt}`,
        );

        const copyResult = this.fs.copyFile({
          from: file.uri,
          to: destinationUri,
        });

        if (!copyResult.success || !copyResult.toUri) {
          failed.push({
            id: file.id,
            name: file.name,
            error: copyResult.error ?? "Error al copiar el archivo",
          });
          onProgress?.({
            completed: index + 1,
            total,
            currentFileName: file.name,
          });
          continue;
        }

        copiedUri = copyResult.toUri;
        const metadata = this.fs.getFileInfo(copiedUri);

        if (!metadata.success || !metadata.data) {
          throw new Error(
            metadata.error ?? "No se pudo obtener información del archivo",
          );
        }

        const fileMetadata = await this.buildFileMetadata(
          file.type,
          copiedUri,
          metadata.data,
          file.mimeType,
        );

        let thumbnailUrl: string | undefined;
        if (file.type === "image" || file.type === "video") {
          const thumbId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          thumbnailUrl =
            (await this.media.generateThumbnail(
              copiedUri,
              thumbId,
              file.type,
            )) ?? undefined;
        }

        const fileResult = await this.fileService.createFile({
          name: file.name,
          originalName: file.originalName,
          extension: (resolvedExt ||
            metadata.data.extension ||
            "") as CreateFileInput["extension"],
          visibility: "public",
          metadata: fileMetadata,
          tagIds: this.buildTagIds(file.type, tagIds),
          storageUrl: copiedUri,
          ...(folderId ? { folderId } : {}),
          ...(thumbnailUrl ? { thumbnailUrl } : {}),
        });

        importedFiles.push(fileResult);
      } catch (error) {
        if (copiedUri) {
          this.fs.deleteFile(copiedUri);
        }

        failed.push({
          id: file.id,
          name: file.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      onProgress?.({
        completed: index + 1,
        total,
        currentFileName: file.name,
      });
    }

    return { importedFiles, failed };
  }

  async importAlbum({
    albumName,
    color,
    files,
    folderId,
    tagIds = [],
    onProgress,
  }: ImportMediaAlbumParams): Promise<ImportMediaAlbumResult> {
    if (files.length === 0) {
      return {
        album: null,
        importedFiles: [],
        failed: [],
      };
    }

    const album = await this.tagService.createAlbum({
      name: albumName,
      color: color ?? this.pickRandomSystemColor(),
      description: `Importado desde MediaLibrary: ${albumName}`,
    });

    const result = await this.importFiles({
      files,
      tagIds: [...tagIds, album.id],
      ...(folderId ? { folderId } : {}),
      ...(onProgress ? { onProgress } : {}),
    });

    if (result.importedFiles.length === 0 && result.failed.length > 0) {
      await this.tagService.deleteTag(album.id);
      return {
        ...result,
        album: null,
      };
    }

    return {
      ...result,
      album,
    };
  }

  private pickRandomSystemColor(): ColorInfo {
    const randomIndex = Math.floor(Math.random() * this.systemColors.length);
    return this.systemColors[randomIndex] ?? SYSTEM_COLORS.yellow;
  }

  private async buildFileMetadata(
    category: FileCategory,
    uri: string,
    fsInfo: FSFileInfo,
    fileMimeType?: string,
  ): Promise<FileMetadata> {
    const mimeType = fileMimeType || fsInfo.mimeType || "";
    const base: FileMetadata = {
      size: fsInfo.size ?? 0,
      ...(mimeType ? { mimeType } : {}),
      ...(fsInfo.md5 ? { checksum: fsInfo.md5 } : {}),
    };

    switch (category) {
      case "video": {
        const videoMeta = await this.media.getVideoMetadata(uri);
        if (videoMeta.success && videoMeta.data) {
          return { ...base, videoMetadata: videoMeta.data };
        }
        return base;
      }
      case "audio": {
        const audioMeta = await this.media.getAudioMetadata(uri);
        if (audioMeta.success && audioMeta.data) {
          return { ...base, audioMetadata: audioMeta.data };
        }
        return base;
      }
      case "image": {
        const imageMeta = await this.media.getImageMetadata(uri);
        if (imageMeta.success && imageMeta.data) {
          return { ...base, imageMetadata: imageMeta.data };
        }
        return base;
      }
      default:
        return base;
    }
  }

  private buildTagIds(type: MediaImportFile["type"], tagIds: UUID[]): UUID[] {
    const allTags = [...tagIds];

    switch (type) {
      case "image":
        allTags.push(SYSTEM_TAG_IDS.photo, SYSTEM_TAG_IDS.album);
        break;
      case "video":
        allTags.push(SYSTEM_TAG_IDS.video, SYSTEM_TAG_IDS.album);
        break;
      case "audio":
        allTags.push(SYSTEM_TAG_IDS.audio);
        break;
      case "document":
        allTags.push(SYSTEM_TAG_IDS.document);
        break;
      default:
        break;
    }

    return Array.from(new Set(allTags));
  }

  private buildFileName(fileName: string, resolvedExt: string): string {
    const dotIndex = fileName.lastIndexOf(".");
    const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;

    return resolvedExt ? `${baseName}.${resolvedExt}` : fileName;
  }

  private resolveExtension(
    mimeType: string | undefined,
    fileName: string,
  ): string {
    const nameExt =
      fileName.lastIndexOf(".") > 0
        ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
        : "";

    if (!mimeType) {
      return nameExt;
    }

    const mimeNorm = mimeType.toLowerCase();

    if (MIME_EXT_OVERRIDES[mimeNorm]) {
      return MIME_EXT_OVERRIDES[mimeNorm];
    }

    const extFromMime = mime.getExtension(mimeType) ?? "";
    if (extFromMime) {
      const catFromMime = FILE_CATEGORY_MAP[extFromMime as FileExtension];
      const mimePrefix = `${mimeNorm.split("/")[0]}/`;
      const expectedCat: Record<string, FileCategory> = {
        "image/": "image",
        "video/": "video",
        "audio/": "audio",
      };
      const expected = expectedCat[mimePrefix];

      if (!expected || catFromMime === expected) {
        return extFromMime;
      }
    }

    return nameExt;
  }
}
