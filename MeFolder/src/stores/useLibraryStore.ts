import { FileModel, FolderModel } from '@/models';
import { create } from 'zustand';

interface LibraryActions {
    items: (FileModel | FolderModel)[];
    setItems: (items: (FileModel | FolderModel)[]) => void;
    updateItem: (updatedItem: FileModel | FolderModel) => void;
    removeItem: (itemId: string) => void;
    addItem: (item: FileModel | FolderModel) => void;
}

interface LibraryState {
    items: (FileModel | FolderModel)[];
}

type LibraryStore = LibraryState & LibraryActions;

const initialState = {
    items: []
};

export const useLibraryStore = create<LibraryStore>((set) => ({
    ...initialState,

    setItems: (items) => set({ items }),

    updateItem: (updatedItem) => {
        set(state => ({
            items: state.items.map(item => item.id === updatedItem.id ? updatedItem : item)
        }));
    },

    removeItem: (itemId) => {
        set(state => ({
            items: state.items.filter(item => item.id !== itemId)
        }));
    },

    addItem: (item) => {
        set(state => ({
            items: [...state.items, item]
        }));
    }
}))