import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { useNavigationStore } from '@/stores';
import { useAlert, useDatabase, useServices } from '@/providers';
import { useFocusEffect } from 'expo-router';
import { sortItems } from '@/utils';
import { getGridConfig, ViewMode } from '@/utils/ui/responsive';
import type { FolderSortBy, FolderSortOrder, FolderViewMode, ViewOptions } from '@/types';

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
  const [loading, setLoading] = useState(true);
  const [viewOptions, setViewOptions] = useState<ViewOptions>({ showExtension: true, showHiddenFiles: false });

  const gridConfig = getGridConfig(selectedView as ViewMode, width);

  const sortedItems = useMemo(
    () => sortItems(items, orderBy, sortValue),
    [items, sortValue, orderBy]
  );

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;

      const loadContent = async () => {
        setItems([]);
        setLoading(true);
        try {
          const viewConfig = currentFolderId ? await folderService.getFolderViewConfig(currentFolderId) : null;

          if (viewConfig) {
            setSelectedView(viewConfig.viewMode);
            setOrderBy(viewConfig.sortBy);
            setSortValue(viewConfig.sortOrder);
            if (viewConfig.options) {
              setViewOptions(viewConfig.options);
            }
          }

          const [folders, files] = await Promise.all([
            currentFolderId ? folderService.getSubfolders(currentFolderId) : folderService.getSubfolders(),
            currentFolderId ? fileService.getFilesInFolder(currentFolderId) : fileService.getFilesInFolder(),
          ]);

          setItems([...folders, ...files]);
        } catch {
          showAlert({ title: 'Error', message: 'No se pudo cargar el contenido de la carpeta' });
        } finally {
          setLoading(false);
        }
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

  const handleViewOptionsChange = async (options: ViewOptions) => {
    setViewOptions(options);
    if (!currentFolderId || !folderService) return;
    try {
      await folderService.updateFolderViewConfig(currentFolderId, { options });
    } catch {
      showAlert({ title: 'Error', message: 'No se pudo actualizar las opciones de vista' });
    }
  };

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
