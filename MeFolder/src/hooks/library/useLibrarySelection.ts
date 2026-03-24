import { useState } from 'react';
import { FileModel, FolderModel } from '@/models';
import type { OptionsType } from '@/types';
import { OptionsIds } from '@/types';

export const useLibrarySelection = (items: (FileModel | FolderModel)[]) => {
  const [itemsSelected, setItemsSelected] = useState<(FileModel | FolderModel)[]>([]);

  const selectionMode = itemsSelected.length > 0;

  const toggleSelection = (item: FileModel | FolderModel) => {
    setItemsSelected(prev =>
      prev.some(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const clearSelection = () => setItemsSelected([]);

  const handleOnSelectOption = (option: OptionsType) => {
    switch (option.id) {
      case OptionsIds.SELECT_ALL:
        setItemsSelected(items.filter(i => i.visibility === 'public'));
        break;
      case OptionsIds.NO_SELECT:
        setItemsSelected([]);
        break;
      case OptionsIds.INVERT_SELECT:
        setItemsSelected(prev => {
          const selectedIds = new Set(prev.map(item => item.id));
          return items.filter(item => !selectedIds.has(item.id) && item.visibility === 'public');
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
