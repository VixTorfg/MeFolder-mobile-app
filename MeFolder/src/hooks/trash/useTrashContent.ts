import { useServices } from "@/providers";
import { FileModel, FolderModel } from "@/models";
import { useTrashStore } from "@/stores/useTrashStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTrashViewSettings } from "./useTrashViewSetting";
import { sortItems } from "@/utils/ui/sort";

const isNestedWithinFolder = (
  itemPath: string,
  folderPath: string,
): boolean => {
  const normalizedFolderPath = folderPath.endsWith("/")
    ? folderPath
    : `${folderPath}/`;

  return itemPath.startsWith(normalizedFolderPath);
};

const buildVisibleTrashItems = (
  folders: FolderModel[],
  files: FileModel[],
): Array<FileModel | FolderModel> => {
  const visibleFolders = folders.filter(
    (candidateFolder) =>
      !folders.some(
        (folder) =>
          folder.id !== candidateFolder.id &&
          isNestedWithinFolder(candidateFolder.path, folder.path),
      ),
  );

  const visibleFiles = files.filter(
    (file) =>
      !visibleFolders.some((folder) =>
        isNestedWithinFolder(file.path, folder.path),
      ),
  );

  return [...visibleFolders, ...visibleFiles];
};

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

          setItems(buildVisibleTrashItems(folders, files));
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
