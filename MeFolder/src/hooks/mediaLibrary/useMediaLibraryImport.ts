import { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { useServices } from "@/providers";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useTagsStore } from "@/stores/useTagsStore";
import type {
  MediaImportFailure,
  MediaImportFile,
  MediaImportProgress,
} from "@/types/media";
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
        const settled = await mapWithConcurrencySettled(
          assets,
          mapAssetToImportFile,
          IMPORT_CONCURRENCY,
        );
        const { files, preFailures } = partitionSettled(assets, settled);

        const result = await services.mediaImportService.importFiles({
          files,
          ...(folderId ? { folderId } : {}),
          ...(albumId ? { tagIds: [albumId] } : {}),
          onProgress: setProgress,
        });

        return persistImportedFiles({
          ...result,
          failed: [...preFailures, ...result.failed],
        });
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
        const { files, preFailures: albumPreFailures } = await loadAlbumFiles(
          album,
          setProgress,
        );

        setProgressTitle(`Importando álbum: ${album.title}`);

        const importResult = albumId
          ? await services.mediaImportService.importFiles({
              files,
              ...(folderId ? { folderId } : {}),
              tagIds: [albumId],
              onProgress: setProgress,
            })
          : await services.mediaImportService.importFiles({
              files,
              ...(folderId ? { folderId } : {}),
              onProgress: setProgress,
            });

        const result: ImportMediaAlbumResult = {
          album: null,
          ...importResult,
          failed: [...albumPreFailures, ...importResult.failed],
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
): Promise<{ files: MediaImportFile[]; preFailures: MediaImportFailure[] }> {
  const files: MediaImportFile[] = [];
  const albumPreFailures: MediaImportFailure[] = [];
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

    const settled = await mapWithConcurrencySettled(
      result.assets,
      mapAssetToImportFile,
      IMPORT_CONCURRENCY,
    );
    const { files: pageFiles, preFailures: pageFailures } = partitionSettled(
      result.assets,
      settled,
    );
    files.push(...pageFiles);
    albumPreFailures.push(...pageFailures);
    onProgress({
      completed: files.length,
      total,
      currentFileName: album.title,
    });

    hasMore = result.hasNextPage;
    after = result.endCursor;
  }

  return { files, preFailures: albumPreFailures };
}

/** Máximo de conversiones/resoluciones simultáneas. En Android limitamos para no saturar. */
const IMPORT_CONCURRENCY = Platform.OS === "android" ? 3 : 8;

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

  // Android: HEIC/HEIF no está soportado nativamente. Convertir a JPEG.
  // iOS: expo-image renderiza HEIC nativo; se mantiene sin conversión.
  if (Platform.OS === "android" && !isVideo && isHeic(name, uri)) {
    try {
      const converted = await convertHeicToJpeg(uri);
      uri = converted.uri;
      name = swapExtToJpg(name);
    } catch (err) {
      throw new Error(
        `No se pudo convertir "${name}" a JPEG: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  return {
    id: asset.id,
    name,
    originalName: asset.filename,
    uri,
    type: isVideo ? "video" : "image",
    ...(asset.width > 0 ? { width: asset.width } : {}),
    ...(asset.height > 0 ? { height: asset.height } : {}),
    ...(asset.duration > 0 ? { duration: asset.duration } : {}),
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
    compress: 0.9,
  });
  return { uri: saved.uri };
}

/**
 * Ejecuta `fn` sobre cada elemento con un máximo de `concurrency` ejecuciones
 * simultáneas. Devuelve un PromiseSettledResult[] para que los fallos
 * individuales no anulen el lote completo.
 */
async function mapWithConcurrencySettled<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<PromiseSettledResult<R>[]> {
  if (items.length === 0) return [];
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let index = 0;

  async function runNext(): Promise<void> {
    if (index >= items.length) return;
    const current = index++;
    try {
      results[current] = {
        status: "fulfilled",
        value: await fn(items[current]!),
      };
    } catch (e) {
      results[current] = { status: "rejected", reason: e };
    }
    await runNext();
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, runNext),
  );
  return results;
}

/** Separa los resultados settled en archivos OK y fallos previos al importService. */
function partitionSettled(
  assets: MediaLibrary.Asset[],
  settled: PromiseSettledResult<MediaImportFile>[],
): { files: MediaImportFile[]; preFailures: MediaImportFailure[] } {
  const files: MediaImportFile[] = [];
  const preFailures: MediaImportFailure[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      files.push(result.value);
    } else {
      preFailures.push({
        id: assets[i]!.id,
        name: assets[i]!.filename,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  });

  return { files, preFailures };
}
