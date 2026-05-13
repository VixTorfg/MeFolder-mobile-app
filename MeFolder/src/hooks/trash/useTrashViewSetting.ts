import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { getGridConfig, ViewMode } from "@/utils/ui/responsive";
import type {
  FolderSortBy,
  FolderSortOrder,
  FolderViewMode,
  ViewOptions,
} from "@/types";

export const useTrashViewSettings = () => {
  const { width } = useWindowDimensions();

  const [selectedView, setSelectedView] = useState<FolderViewMode>("list");
  const [orderBy, setOrderBy] = useState<FolderSortBy>("name");
  const [sortValue, setSortValue] = useState<FolderSortOrder>("asc");
  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    showExtension: true,
    showHiddenFiles: false,
  });

  const gridConfig = getGridConfig(selectedView as ViewMode, width);

  const handleSortItems = async (order: FolderSortOrder, by: FolderSortBy) => {
    setSortValue(order);
    setOrderBy(by);
  };

  const handleViewModeChange = async (selectedModeId: FolderViewMode) => {
    setSelectedView(selectedModeId);
  };

  const handleViewOptionsChange = async (options: ViewOptions) => {
    setViewOptions(options);
  };

  return {
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  };
};
