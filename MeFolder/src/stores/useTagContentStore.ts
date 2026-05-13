import { FileModel } from "@/models";
import { create } from "zustand";

interface TagContentActions {
  setItems: (items: FileModel[]) => void;
  updateItem: (updatedItem: FileModel) => void;
  removeItem: (itemId: string) => void;
  removeItems: (itemIds: string[]) => void;
  clear: () => void;
}

interface TagContentState {
  items: FileModel[];
}

type TagContentStore = TagContentState & TagContentActions;

const initialState: TagContentState = {
  items: [],
};

export const useTagContentStore = create<TagContentStore>((set) => ({
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

  removeItems: (itemIds) => {
    set((state) => ({
      items: state.items.filter((item) => !itemIds.includes(item.id)),
    }));
  },

  clear: () => set(initialState),
}));
