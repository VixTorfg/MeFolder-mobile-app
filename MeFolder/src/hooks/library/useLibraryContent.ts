import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { FileModel, FolderModel } from '@/models';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { useNavigationStore } from '@/stores';
import { useAlert, useDatabase, useServices } from '@/providers';
import { useFocusEffect } from 'expo-router';
import { sortItems } from '@/utils';
import { getGridConfig, ViewMode } from '@/utils/ui/responsive';
import type { FolderSortBy, FolderSortOrder, FolderViewMode } from '@/types';

export const useLibraryContent = () => {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const folderService = services?.folderService;
  const fileService = services?.fileService;

  const items = useLibraryStore(state => state.items);
  const { setItems } = useLibraryStore();
  const { currentFolderId } = useNavigationStore();
  const { showAlert } = useAlert();
  const { width } = useWindowDimensions();

  const [selectedView, setSelectedView] = useState<FolderViewMode>('list');
  const [orderBy, setOrderBy] = useState<FolderSortBy>('name');
  const [sortValue, setSortValue] = useState<FolderSortOrder>('asc');

  const isEmpty = items.length === 0;
  const gridConfig = getGridConfig(selectedView as ViewMode, width);

  const sortedItems = useMemo(
    () => sortItems(items, orderBy, sortValue),
    [items, sortValue, orderBy]
  );

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;

      const loadContent = async () => {
        let folders: FolderModel[] = [];
        let files: FileModel[] = [];

        const viewConfig = currentFolderId ? await folderService.getFolderViewConfig(currentFolderId) : null;

        if (viewConfig) {
          setSelectedView(viewConfig.viewMode);
          setOrderBy(viewConfig.sortBy);
          setSortValue(viewConfig.sortOrder);
        }

        if (currentFolderId) {
          folders = await folderService.getSubfolders(currentFolderId);
          files = await fileService.getFilesInFolder(currentFolderId);
        } else {
          folders = await folderService.getSubfolders();
          files = await fileService.getFilesInFolder();
        }

        setItems([...folders, ...files]);
      };

      loadContent();
    }, [isReady, currentFolderId])
  );

  const handleSortItems = async (order: FolderSortOrder, by: FolderSortBy) => {
    if (!currentFolderId || !folderService) return;

    try {
      await folderService.updateFolderViewConfig(currentFolderId, { sortBy: by, sortOrder: order });
      setSortValue(order);
      setOrderBy(by);
    } catch {
      showAlert({ title: 'Error', message: 'No se pudo actualizar la configuración de ordenamiento' });
    }
  };

  const handleViewModeChange = async (selectedModeId: FolderViewMode) => {
    if (!currentFolderId || !folderService) return;
    try {
      await folderService.updateFolderViewConfig(currentFolderId, { viewMode: selectedModeId });
      setSelectedView(selectedModeId);
    } catch {
      showAlert({ title: 'Error', message: 'No se pudo actualizar el modo de vista' });
    }
  };

  return {
    items,
    sortedItems,
    isEmpty,
    selectedView,
    orderBy,
    sortValue,
    gridConfig,
    folderService,
    fileService,
    handleSortItems,
    handleViewModeChange,
  };
};
