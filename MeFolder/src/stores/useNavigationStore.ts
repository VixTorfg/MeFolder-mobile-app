import { create } from 'zustand';
import { ROOT_FOLDER_ID } from '@/database/seeds/systemFolders';

export interface PathSegment {
  id: string;
  name: string;
}

interface NavigationState {
  segments: PathSegment[];
  currentFolderId: string;
}

interface NavigationActions {
  /** Navegar hacia una carpeta hija */
  navigateTo: (id: string, name: string) => void;
  /** Navegar a un segmento por índice (breadcrumb click) */
  navigateToIndex: (index: number) => void;
  /** Volver a la raíz */
  navigateToRoot: () => void;
  /** Renombrar un segmento (útil al renombrar carpeta sin recargar) */
  renameSegment: (id: string, newName: string) => void;
}

const ROOT_SEGMENT: PathSegment = { id: ROOT_FOLDER_ID, name: 'Inicio' };

export const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
  segments: [ROOT_SEGMENT],
  currentFolderId: ROOT_FOLDER_ID,

  navigateTo: (id, name) =>
    set((state) => ({
      segments: [...state.segments, { id, name }],
      currentFolderId: id,
    })),

  navigateToIndex: (index) =>
    set((state) => {
      const segment = state.segments[index];
      if (!segment) return state;
      return {
        segments: state.segments.slice(0, index + 1),
        currentFolderId: segment.id,
      };
    }),

  navigateToRoot: () =>
    set({
      segments: [ROOT_SEGMENT],
      currentFolderId: ROOT_FOLDER_ID,
    }),

  renameSegment: (id, newName) =>
    set((state) => ({
      segments: state.segments.map((seg) =>
        seg.id === id ? { ...seg, name: newName } : seg
      ),
    })),
}));
