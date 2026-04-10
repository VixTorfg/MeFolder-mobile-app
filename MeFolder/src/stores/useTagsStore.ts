import { TagModel } from "@/models/tag";
import { create } from "zustand";

interface TagActions {
  setItems: (items: TagModel[]) => void;
  updateItem: (updatedItem: TagModel) => void;
  removeItem: (itemId: string) => void;
  addItem: (item: TagModel) => void;

  setAlbums: (albums: TagModel[]) => void;
  addAlbum: (album: TagModel) => void;
  updateAlbum: (updatedAlbum: TagModel) => void;
  removeAlbum: (albumId: string) => void;
}

interface TagState {
  items: TagModel[];
  albums: TagModel[];
}

type TagStore = TagState & TagActions;

const initialState: TagState = {
  items: [],
  albums: [],
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

  setAlbums: (albums) => set({ albums }),

  addAlbum: (album) => {
    set((state) => ({
      albums: [...state.albums, album],
    }));
  },

  updateAlbum: (updatedAlbum) => {
    set((state) => ({
      albums: state.albums.map((a) =>
        a.id === updatedAlbum.id ? updatedAlbum : a,
      ),
    }));
  },

  removeAlbum: (albumId) => {
    set((state) => ({
      albums: state.albums.filter((a) => a.id !== albumId),
    }));
  },
}));
