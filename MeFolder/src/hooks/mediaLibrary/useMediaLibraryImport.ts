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

interface UseMediaLibraryImportParams {
  folderId?: string;
}

const ALBUM_PAGE_SIZE = 100;

export function useMediaLibraryImport({
  folderId,
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
          files: assets.map(mapAssetToImportFile),
          ...(folderId ? { folderId } : {}),
          onProgress: setProgress,
        });

        return persistImportedFiles(result);
      } finally {
        resetProgress();
      }
    },
    [
      folderId,
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

        const result = await services.mediaImportService.importAlbum({
          albumName: album.title,
          files,
          ...(folderId ? { folderId } : {}),
          onProgress: setProgress,
        });

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

    files.push(...result.assets.map(mapAssetToImportFile));
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

function mapAssetToImportFile(asset: MediaLibrary.Asset): MediaImportFile {
  return {
    id: asset.id,
    name: asset.filename,
    originalName: asset.filename,
    uri: asset.uri,
    type: asset.mediaType === MediaLibrary.MediaType.video ? "video" : "image",
  };
}
