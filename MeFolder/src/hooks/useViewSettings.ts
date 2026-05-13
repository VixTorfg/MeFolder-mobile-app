import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { useAlert, useServices } from "@/providers";
import { getGridConfig, ViewMode } from "@/utils/ui/responsive";
import type {
  FolderSortBy,
  FolderSortOrder,
  FolderViewMode,
  ViewOptions,
  ViewSettings,
} from "@/types";
import type { UUID } from "@/types/common/base";

type ViewSettingsSource = "folder" | "tag";

interface UseViewSettingsParams {
  source: ViewSettingsSource;
  sourceId: UUID | null;
}

export const useViewSettings = ({
  source,
  sourceId,
}: UseViewSettingsParams) => {
  const { services } = useServices();
  const { showAlert } = useAlert();
  const { width } = useWindowDimensions();

  const [selectedView, setSelectedView] = useState<FolderViewMode>("list");
  const [orderBy, setOrderBy] = useState<FolderSortBy>("name");
  const [sortValue, setSortValue] = useState<FolderSortOrder>("asc");
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showExtension: true,
    showHiddenFiles: false,
  });

  const gridConfig = getGridConfig(selectedView as ViewMode, width);

  const loadViewConfig = async () => {
    if (!sourceId) return;

    try {
      let viewConfig: ViewSettings | null = null;

      if (source === "folder") {
        viewConfig =
          await services?.folderService.getFolderViewConfig(sourceId);
      } else {
        viewConfig = await services?.tagService.getTagViewConfig(sourceId);
      }

      if (viewConfig) {
        setSelectedView(viewConfig.viewMode);
        setOrderBy(viewConfig.sortBy);
        setSortValue(viewConfig.sortOrder);
        if (viewConfig.options) {
          setViewOptions(viewConfig.options);
        }
      }
    } catch {
      // Silently use defaults
    }
  };

  const updateViewConfig = async (settings: Partial<ViewSettings>) => {
    if (!sourceId) return;

    try {
      if (source === "folder") {
        await services?.folderService.updateFolderViewConfig(
          sourceId,
          settings,
        );
      } else {
        await services?.tagService.updateTagViewConfig(sourceId, settings);
      }
    } catch {
      showAlert({
        title: "Error",
        message: "No se pudo actualizar la configuración de vista",
      });
    }
  };

  const handleSortItems = async (order: FolderSortOrder, by: FolderSortBy) => {
    await updateViewConfig({ sortBy: by, sortOrder: order });
    setSortValue(order);
    setOrderBy(by);
  };

  const handleViewModeChange = async (selectedModeId: FolderViewMode) => {
    await updateViewConfig({ viewMode: selectedModeId });
    setSelectedView(selectedModeId);
  };

  const handleViewOptionsChange = async (options: ViewOptions) => {
    setViewOptions(options);
    await updateViewConfig({ options });
  };

  return {
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    loadViewConfig,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  };
};
