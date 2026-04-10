import { TagModel } from "@/models/tag";
import { create } from "zustand";

interface TagActions {
  items: TagModel[];
  setItems: (items: TagModel[]) => void;
  updateItem: (updatedItem: TagModel) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: TagModel) => void;
}

interface TagState {
  items: TagModel[];
}

type TagStore = TagState & TagActions;

const initialState = {
  items: [],
};

export const useTagsStore = create<TagStore>((set) => ({
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
