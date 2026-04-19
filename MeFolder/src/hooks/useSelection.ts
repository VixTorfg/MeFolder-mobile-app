import { useCallback, useEffect, useState } from "react";
import type { OptionsType } from "@/types";
import { OptionsIds } from "@/types";
import type { UUID } from "@/types/common/base";
import { useServices } from "@/providers";
import { FolderModel, TagModel } from "@/models";

interface Selectable {
  id: UUID;
  visibility?: string;
}

type SelectionContext = "folder" | "tag";

export const useSelection = <T extends Selectable>(
  items: T[],
  currentId?: string,
  context: SelectionContext = "folder",
) => {
  const { services } = useServices();
  const [itemsSelected, setItemsSelected] = useState<T[]>([]);
  const [currentData, setCurrentData] = useState<FolderModel | TagModel | null>(
    null,
  );
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);

  const selectionMode = itemsSelected.length > 0;

  useEffect(() => {
    const loadData = async () => {
      if (!currentId) return;
      if (context === "tag") {
        const data = await services.tagService.getTag(currentId);
        setCurrentData(data);
      } else {
        const data = await services.folderService.getFolder(currentId);
        setCurrentData(data);
      }
    };
    loadData();
  }, [currentId, context]);

  const refreshCurrentData = useCallback(async () => {
    if (!currentId) return;
    if (context === "tag") {
      const data = await services.tagService.getTag(currentId);
      setCurrentData(data);
    } else {
      const data = await services.folderService.getFolder(currentId);
      setCurrentData(data);
    }
  }, [currentId, context]);

  const openPropertyMenu = useCallback(async () => {
    await refreshCurrentData();
    setShowPropertyMenu(true);
  }, [refreshCurrentData]);

  const closePropertyMenu = useCallback(() => {
    setShowPropertyMenu(false);
  }, []);

  const toggleSelection = (item: T) => {
    setItemsSelected((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item],
    );
  };

  const clearSelection = () => setItemsSelected([]);

  const handleOnSelectOption = (option: OptionsType) => {
    switch (option.id) {
      case OptionsIds.SELECT_ALL:
        setItemsSelected(
          items.filter(
            (i) => !("visibility" in i) || i.visibility === "public",
          ),
        );
        break;
      case OptionsIds.NO_SELECT:
        setItemsSelected([]);
        break;
      case OptionsIds.INVERT_SELECT:
        setItemsSelected((prev) => {
          const selectedIds = new Set(prev.map((item) => item.id));
          return items.filter(
            (item) =>
              !selectedIds.has(item.id) &&
              (!("visibility" in item) || item.visibility === "public"),
          );
        });
        break;
      case OptionsIds.PROPERTIES:
        openPropertyMenu();
        break;
      case OptionsIds.SETTINGS:
        break;
    }
  };

  return {
    itemsSelected,
    selectionMode,
    toggleSelection,
    clearSelection,
    currentData,
    showPropertyMenu,
    openPropertyMenu,
    closePropertyMenu,
    handleOnSelectOption,
  };
};
