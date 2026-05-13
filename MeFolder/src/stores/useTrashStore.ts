import { FileModel, FolderModel } from "@/models";
import { create } from "zustand";

interface TrashActions {
  items: (FileModel | FolderModel)[];
  setItems: (items: (FileModel | FolderModel)[]) => void;
  updateItem: (updatedItem: FileModel | FolderModel) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: FileModel | FolderModel) => void;
}

interface TrashState {
  items: (FileModel | FolderModel)[];
}

type TrashStore = TrashState & TrashActions;

const initialState = {
  items: [],
};

export const useTrashStore = create<TrashStore>((set) => ({
  ...initialState,

  setItems: (items) => set({ items }),

  updateItem: (updatedItem) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
  },

  addItem: (item) => {
    set((state) => ({
      items: [...state.items, item],
    }));
  },
}));
