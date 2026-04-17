import { useState } from "react";
import type { OptionsType } from "@/types";
import { OptionsIds } from "@/types";
import type { UUID } from "@/types/common/base";

interface Selectable {
  id: UUID;
  visibility?: string;
}

export const useSelection = <T extends Selectable>(items: T[]) => {
  const [itemsSelected, setItemsSelected] = useState<T[]>([]);

  const selectionMode = itemsSelected.length > 0;

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
    handleOnSelectOption,
  };
};
