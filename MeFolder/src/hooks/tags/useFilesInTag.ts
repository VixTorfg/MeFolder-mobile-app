import { useMemo } from "react";
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
    // loadViewConfig,
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

  // loadViewConfig es async — no se puede llamar directamente en el cuerpo
  // del componente porque React no permite que el render sea asíncrono.
  // Llamarlo suelto ("loadViewConfig()") lanzaría una promesa no controlada en
  // cada render y posibles race-conditions. Un useEffect garantiza que solo se
  // ejecute al montar (o cuando cambie tagId).
  //
  // Descomentar cuando la columna "view" exista en tags:
  // import { useEffect } from "react";
  // + descomentar loadViewConfig en useViewSettings
  // useEffect(() => {
  //   loadViewConfig();
  // }, [tagId]);

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
