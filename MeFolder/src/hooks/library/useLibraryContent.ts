import { useCallback, useMemo, useState } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useNavigationStore } from "@/stores";
import { useAlert, useServices } from "@/providers";
import { useFocusEffect } from "expo-router";
import { sortItems } from "@/utils";
import { useViewSettings } from "@/hooks/useViewSettings";

export const useLibraryContent = () => {
  const { services } = useServices();
  const folderService = services?.folderService;
  const fileService = services?.fileService;

  const items = useLibraryStore((state) => state.items);
  const { setItems } = useLibraryStore();
  const { currentFolderId } = useNavigationStore();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);

  const {
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    loadViewConfig,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  } = useViewSettings({ source: "folder", sourceId: currentFolderId });

  const sortedItems = useMemo(
    () => sortItems(items, orderBy, sortValue),
    [items, sortValue, orderBy],
  );

  useFocusEffect(
    useCallback(() => {
      const loadContent = async () => {
        setItems([]);
        setLoading(true);
        try {
          await loadViewConfig();

          const [folders, files] = await Promise.all([
            currentFolderId
              ? folderService.getSubfolders(currentFolderId)
              : folderService.getSubfolders(),
            currentFolderId
              ? fileService.getFilesInFolder(currentFolderId)
              : fileService.getFilesInFolder(),
          ]);

          setItems([...folders, ...files]);
        } catch {
          showAlert({
            title: "Error",
            message: "No se pudo cargar el contenido de la carpeta",
          });
        } finally {
          setLoading(false);
        }
      };

      loadContent();
    }, [currentFolderId]),
  );

  return {
    items,
    sortedItems,
    loading,
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    folderService,
    fileService,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  };
};
