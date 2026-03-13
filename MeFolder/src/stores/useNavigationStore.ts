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
  /** Nombre de la carpeta actual */
  currentFolderName: string;
  /** Navegar hacia una carpeta hija */
  navigateTo: (id: string, name: string) => void;
  /** Navegar a un segmento por índice (breadcrumb click) */
  navigateToIndex: (index: number) => void;
  /** Volver a la raíz */
  navigateToRoot: () => void;
  /** Volver a la carpeta anterior */
  navigateBack: () => void;
  /** Renombrar un segmento (útil al renombrar carpeta sin recargar) */
  renameSegment: (id: string, newName: string) => void;
}

const ROOT_SEGMENT: PathSegment = { id: ROOT_FOLDER_ID, name: 'Inicio' };

export const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
  segments: [ROOT_SEGMENT],
  currentFolderId: ROOT_FOLDER_ID,
  currentFolderName: ROOT_SEGMENT.name,

  navigateTo: (id, name) =>
    set((state) => ({
      segments: [...state.segments, { id, name }],
      currentFolderId: id,
      currentFolderName: name,
    })),

  navigateToIndex: (index) =>
    set((state) => {
      const segment = state.segments[index];
      if (!segment) return state;
      return {
        segments: state.segments.slice(0, index + 1),
        currentFolderId: segment.id,
        currentFolderName: segment.name,
      };
    }),

  navigateToRoot: () =>
    set({
      segments: [ROOT_SEGMENT],
      currentFolderId: ROOT_FOLDER_ID,
      currentFolderName: ROOT_SEGMENT.name,
    }),

  renameSegment: (id, newName) =>
    set((state) => ({
      segments: state.segments.map((seg) =>
        seg.id === id ? { ...seg, name: newName } : seg
      ),
      currentFolderName: state.currentFolderId === id ? newName : state.currentFolderName,
    })),

  navigateBack: () =>
    set((state) => {
      const newSegments = state.segments.slice(0, -1);
      const lastSegment = newSegments[newSegments.length - 1];
      return {
        segments: newSegments,
        currentFolderId: lastSegment?.id || ROOT_FOLDER_ID,
        currentFolderName: lastSegment?.name || ROOT_SEGMENT.name,
      };
    }),
}));
