import { useCallback, useMemo, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { useServices } from "@/providers";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useTagsStore } from "@/stores/useTagsStore";
import type { MediaImportFile, MediaImportProgress } from "@/types/media";
import type {
  ImportMediaAlbumResult,
  ImportMediaFilesResult,
} from "@/services/media/MediaImportService";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

interface UseMediaLibraryImportParams {
  folderId?: string;
  albumId?: string;
}

const ALBUM_PAGE_SIZE = 100;

export function useMediaLibraryImport({
  folderId,
  albumId,
}: UseMediaLibraryImportParams) {
  const { services } = useServices();
  const addLibraryItem = useLibraryStore((state) => state.addItem);
  const addAlbum = useTagsStore((state) => state.addAlbum);

  const [isImporting, setIsImporting] = useState(false);
  const [progressTitle, setProgressTitle] = useState("Importando archivos");
  const [progress, setProgress] = useState<MediaImportProgress>({
    completed: 0,
    total: 0,
  });

  const resetProgress = useCallback(() => {
    setIsImporting(false);
    setProgressTitle("Importando archivos");
    setProgress({ completed: 0, total: 0 });
  }, []);

  const persistImportedFiles = useCallback(
    (filesResult: ImportMediaFilesResult) => {
      filesResult.importedFiles.forEach((fileItem) => addLibraryItem(fileItem));
      return filesResult;
    },
    [addLibraryItem],
  );

  const importSelectedAssets = useCallback(
    async (assets: MediaLibrary.Asset[]): Promise<ImportMediaFilesResult> => {
      setIsImporting(true);
      setProgressTitle("Importando archivos");

      try {
        const result = await services.mediaImportService.importFiles({
          files: await Promise.all(assets.map(mapAssetToImportFile)),
          ...(folderId ? { folderId } : {}),
          ...(albumId ? { tagIds: [albumId] } : {}),
          onProgress: setProgress,
        });

        return persistImportedFiles(result);
      } finally {
        resetProgress();
      }
    },
    [
      folderId,
      albumId,
      persistImportedFiles,
      resetProgress,
      services.mediaImportService,
    ],
  );

  const importAlbum = useCallback(
    async (album: MediaLibrary.Album): Promise<ImportMediaAlbumResult> => {
      setIsImporting(true);
      setProgressTitle(`Preparando álbum: ${album.title}`);

      try {
        const files = await loadAlbumFiles(album, setProgress);

        setProgressTitle(`Importando álbum: ${album.title}`);

        const result: ImportMediaAlbumResult = albumId
          ? {
              album: null,
              ...(await services.mediaImportService.importFiles({
                files,
                ...(folderId ? { folderId } : {}),
                tagIds: [albumId],
                onProgress: setProgress,
              })),
            }
          : {
              album: null,
              ...(await services.mediaImportService.importFiles({
                files,
                ...(folderId ? { folderId } : {}),
                onProgress: setProgress,
              })),
            };

        persistImportedFiles(result);
        if (result.album) {
          addAlbum(result.album);
        }

        return result;
      } finally {
        resetProgress();
      }
    },
    [
      addAlbum,
      albumId,
      folderId,
      persistImportedFiles,
      resetProgress,
      services.mediaImportService,
    ],
  );

  return useMemo(
    () => ({
      isImporting,
      progressTitle,
      progress,
      importSelectedAssets,
      importAlbum,
    }),
    [importAlbum, importSelectedAssets, isImporting, progress, progressTitle],
  );
}

async function loadAlbumFiles(
  album: MediaLibrary.Album,
  onProgress: (progress: MediaImportProgress) => void,
): Promise<MediaImportFile[]> {
  const files: MediaImportFile[] = [];
  let after: string | undefined;
  let total = album.assetCount ?? 0;
  let hasMore = true;

  while (hasMore) {
    const result = await MediaLibrary.getAssetsAsync({
      album: album.id,
      first: ALBUM_PAGE_SIZE,
      ...(after ? { after } : {}),
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy: [MediaLibrary.SortBy.creationTime],
    });

    if (total === 0) {
      total = result.totalCount;
    }

    files.push(...(await Promise.all(result.assets.map(mapAssetToImportFile))));
    onProgress({
      completed: files.length,
      total,
      currentFileName: album.title,
    });

    hasMore = result.hasNextPage;
    after = result.endCursor;
  }

  return files;
}

async function mapAssetToImportFile(
  asset: MediaLibrary.Asset,
): Promise<MediaImportFile> {
  let uri = asset.uri;

  if (uri.startsWith("ph://") || uri.startsWith("assets-library://")) {
    const info = await MediaLibrary.getAssetInfoAsync(asset, {
      shouldDownloadFromNetwork: true,
    });
    if (!info.localUri) {
      throw new Error(
        `No se pudo resolver el archivo local de "${asset.filename}"`,
      );
    }
    uri = info.localUri;
  }

  const isVideo = asset.mediaType === MediaLibrary.MediaType.video;
  let name = asset.filename;

  // iOS: las fotos de la cámara son HEIC/HEIF. Convertir a JPEG al importar.
  if (!isVideo && isHeic(name, uri)) {
    const converted = await convertHeicToJpeg(uri);
    uri = converted.uri;
    name = swapExtToJpg(name);
  }

  return {
    id: asset.id,
    name,
    originalName: asset.filename,
    uri,
    type: isVideo ? "video" : "image",
  };
}

function isHeic(filename: string, uri: string): boolean {
  return /\.(heic|heif)$/i.test(filename) || /\.(heic|heif)$/i.test(uri);
}

function swapExtToJpg(filename: string): string {
  return filename.replace(/\.(heic|heif)$/i, ".jpg");
}

async function convertHeicToJpeg(sourceUri: string): Promise<{ uri: string }> {
  const context = ImageManipulator.manipulate(sourceUri);
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.9, // 0.9 conserva buena calidad; baja si quieres archivos más ligeros
  });
  return { uri: saved.uri };
}
