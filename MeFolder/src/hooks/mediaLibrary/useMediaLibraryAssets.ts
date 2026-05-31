import { useCallback, useEffect, useMemo, useState } from "react";
import * as MediaLibrary from "expo-media-library";
import { useAlert } from "@/providers";

export const MEDIA_LIBRARY_SELECTION_LIMIT = 100;

export type MediaLibraryImportMode = "assets" | "albums";

export function useMediaLibraryAssets(
  initialMode: MediaLibraryImportMode = "assets",
) {
  const { showAlert } = useAlert();
  const [permission, setPermission] =
    useState<MediaLibrary.PermissionResponse | null>(null);
  const [mode, setMode] = useState<MediaLibraryImportMode>(initialMode);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [assetsEndCursor, setAssetsEndCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLimitedAccess = permission?.accessPrivileges === "limited";

  const showExpoGoPermissionAlert = useCallback(() => {
    showAlert({
      title: "Expo Go no puede abrir toda la galería",
      message:
        "En Android, Expo Go ya no puede probar el acceso completo a la galería. Para validar esta funcionalidad usa un development build o una APK instalada.",
    });
  }, [showAlert]);

  const refreshPermission = useCallback(async () => {
    try {
      const nextPermission = await MediaLibrary.getPermissionsAsync(false, [
        "photo",
        "video",
      ]);
      setPermission(nextPermission);
      return nextPermission;
    } catch {
      return null;
    }
  }, []);

  const loadAssets = useCallback(
    async (after?: string) => {
      setIsLoadingAssets(true);
      try {
        const result = await MediaLibrary.getAssetsAsync({
          first: 60,
          ...(after ? { after } : {}),
          mediaType: [
            MediaLibrary.MediaType.photo,
            MediaLibrary.MediaType.video,
          ],
          // `creationTime` se apoya en DATE_TAKEN, que en Android solo rellenan
          // de forma fiable las fotos de la cámara. `modificationTime` (DATE_MODIFIED)
          // existe para todos los archivos, así que devuelve toda la galería.
          sortBy: [MediaLibrary.SortBy.modificationTime],
        });

        setAssets((prev) =>
          after ? [...prev, ...result.assets] : result.assets,
        );
        setAssetsEndCursor(result.endCursor);
        setHasNextPage(result.hasNextPage);
      } catch {
        if (!after) {
          setAssets([]);
        }
        showAlert({
          title: "No se pudieron cargar los archivos",
          message:
            "La galería no devolvió la lista de archivos en este dispositivo.",
        });
      } finally {
        setIsLoadingAssets(false);
      }
    },
    [showAlert],
  );

  const loadAlbums = useCallback(async () => {
    setIsLoadingAlbums(true);
    try {
      const result = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      setAlbums(result.filter((album) => (album.assetCount ?? 0) > 0));
    } catch {
      setAlbums([]);
      showAlert({
        title: "No se pudieron cargar los álbumes",
        message:
          "La galería no devolvió una lista de álbumes válida en este dispositivo.",
      });
    } finally {
      setIsLoadingAlbums(false);
    }
  }, [showAlert]);

  const requestPermission = useCallback(async () => {
    try {
      const nextPermission = await MediaLibrary.requestPermissionsAsync(false, [
        "photo",
        "video",
      ]);
      setPermission(nextPermission);
      return nextPermission;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("Expo Go can no longer provide full access")) {
        showExpoGoPermissionAlert();
      } else {
        showAlert({
          title: "No se pudo pedir acceso a la galería",
          message:
            "Inténtalo de nuevo o concede el permiso desde ajustes del sistema.",
        });
      }

      return await refreshPermission();
    }
  }, [refreshPermission, showAlert, showExpoGoPermissionAlert]);

  const openPermissionsPicker = useCallback(async () => {
    try {
      await MediaLibrary.presentPermissionsPickerAsync(["photo", "video"]);
      const nextPermission = await refreshPermission();

      if (nextPermission?.granted) {
        await Promise.all([loadAssets(), loadAlbums()]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("Expo Go")) {
        showExpoGoPermissionAlert();
        return;
      }

      showAlert({
        title: "No se pudo ampliar el acceso",
        message:
          "Abre los ajustes del sistema y concede acceso completo a fotos y videos para ver toda tu galería.",
      });
    }
  }, [
    loadAlbums,
    loadAssets,
    refreshPermission,
    showAlert,
    showExpoGoPermissionAlert,
  ]);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  useEffect(() => {
    if (!permission?.granted) {
      return;
    }

    void Promise.all([loadAssets(), loadAlbums()]);
  }, [permission?.granted, loadAlbums, loadAssets]);

  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedAssetIds.has(asset.id)),
    [assets, selectedAssetIds],
  );

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId],
  );

  const handleModeChange = useCallback((nextMode: MediaLibraryImportMode) => {
    setMode(nextMode);
    setSelectedAssetIds(new Set());
    setSelectedAlbumId(null);
  }, []);

  const toggleAssetSelection = useCallback(
    (asset: MediaLibrary.Asset) => {
      const isSelected = selectedAssetIds.has(asset.id);

      if (
        !isSelected &&
        selectedAssetIds.size >= MEDIA_LIBRARY_SELECTION_LIMIT
      ) {
        showAlert({
          title: "Límite alcanzado",
          message: `Solo puedes seleccionar hasta ${MEDIA_LIBRARY_SELECTION_LIMIT} archivos a la vez.`,
        });
        return;
      }

      setSelectedAlbumId(null);
      setSelectedAssetIds((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) {
          next.delete(asset.id);
        } else {
          next.add(asset.id);
        }
        return next;
      });
    },
    [selectedAssetIds, showAlert],
  );

  const selectAlbum = useCallback((album: MediaLibrary.Album) => {
    setSelectedAssetIds(new Set());
    setSelectedAlbumId((prev) => (prev === album.id ? null : album.id));
  }, []);

  const loadMoreAssets = useCallback(() => {
    if (!hasNextPage || isLoadingAssets || !assetsEndCursor) {
      return;
    }

    void loadAssets(assetsEndCursor);
  }, [assetsEndCursor, hasNextPage, isLoadingAssets, loadAssets]);

  const refresh = useCallback(async () => {
    if (!permission?.granted) {
      return;
    }

    setIsRefreshing(true);
    try {
      setSelectedAssetIds(new Set());
      setSelectedAlbumId(null);
      await Promise.all([loadAssets(), loadAlbums()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAlbums, loadAssets, permission?.granted]);

  return {
    permission,
    mode,
    assets,
    albums,
    selectedAssets,
    selectedAssetIds,
    selectedAssetCount: selectedAssetIds.size,
    selectedAlbum,
    hasNextPage,
    isLoadingAssets,
    isLoadingAlbums,
    isRefreshing,
    isLimitedAccess,
    requestPermission,
    openPermissionsPicker,
    refreshPermission,
    refresh,
    handleModeChange,
    toggleAssetSelection,
    selectAlbum,
    loadMoreAssets,
    selectionLimit: MEDIA_LIBRARY_SELECTION_LIMIT,
  };
}
