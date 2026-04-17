import { useEffect, useMemo } from "react";
import { useViewSettings } from "../useViewSettings";
import { useGalleryContent } from "../gallery/useGalleryContent";
import { FileModel } from "@/models";
import { sortItems } from "@/utils/ui/sort";

export const useFilesInTag = ({ tagId }: { tagId: string }) => {
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
  } = useViewSettings({ source: "tag", sourceId: tagId });

  const { items, loadMore, isLoading } = useGalleryContent({
    tagId: tagId as string,
    pageSize: 100,
  });

  const sortedItems = useMemo(
    () => sortItems(items, orderBy, sortValue) as FileModel[],
    [items, sortValue, orderBy],
  );

  useEffect(() => {
    loadViewConfig();
  }, [tagId]);

  return {
    loadMore,
    sortedItems,
    loading: isLoading,
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
