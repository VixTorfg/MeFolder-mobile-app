import { useServices } from "@/providers";
import { useTrashStore } from "@/stores/useTrashStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTrashViewSettings } from "./useTrashViewSetting";
import { sortItems } from "@/utils/ui/sort";

export const useTrashContent = () => {
  const { services } = useServices();
  const items = useTrashStore((state) => state.items);
  const { setItems } = useTrashStore();
  const [loading, setLoading] = useState(true);

  const {
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  } = useTrashViewSettings();

  const sortedItems = useMemo(
    () => sortItems(items, orderBy, sortValue),
    [items, sortValue, orderBy],
  );

  useFocusEffect(
    useCallback(() => {
      const loadContent = async () => {
        setLoading(true);

        try {
          const folderService = services?.folderService;
          const fileService = services?.fileService;

          const folders = await folderService.getDeletedFolders();
          const files = await fileService.getDeletedFiles();

          setItems([...folders, ...files]);
        } catch (error) {
          console.error("Error loading trash content:", error);
        } finally {
          setLoading(false);
        }
      };

      loadContent();
    }, []),
  );

  return {
    items,
    loading,
    viewOptions,
    gridConfig,
    selectedView,
    sortedItems,
    orderBy,
    sortValue,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  };
};
