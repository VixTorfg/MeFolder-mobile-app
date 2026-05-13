import { create } from "zustand";
import { FileModel, FolderModel } from "@/models";
import { UUID } from "@/types/common/base";
import { FileService, FolderService } from "@/services";

type ClipboardMode = "copy" | "cut" | null;

interface ClipboardState {
  clipboardItems: (FileModel | FolderModel)[];
  clipboardMode: ClipboardMode;
}

interface ClipboardActions {
  copy: (items: (FileModel | FolderModel)[]) => void;
  cut: (items: (FileModel | FolderModel)[]) => void;
  paste: (
    destinationFolderId: UUID,
  ) => Promise<{ createdFolders: FolderModel[]; createdFiles: FileModel[] }>;
  clear: () => void;
  clearIfContainsIds: (itemIds: UUID[]) => void;
  hasItems: () => boolean;
  isCut: () => boolean;
  isCopy: () => boolean;
}

type ClipboardStore = ClipboardState & ClipboardActions;

const initialState: ClipboardState = {
  clipboardItems: [],
  clipboardMode: null,
};

export const useClipboardStore = create<ClipboardStore>((set, get) => ({
  ...initialState,

  copy: (items) =>
    set({
      clipboardItems: items,
      clipboardMode: "copy",
    }),

  cut: (items) =>
    set({
      clipboardItems: items,
      clipboardMode: "cut",
    }),

  paste: async (
    destinationFolderId: UUID,
  ): Promise<{ createdFolders: FolderModel[]; createdFiles: FileModel[] }> => {
    const { clipboardItems, clipboardMode } = get();

    let createdFolders: FolderModel[] = [];
    let createdFiles: FileModel[] = [];

    if (clipboardItems.length === 0 || !clipboardMode)
      return { createdFolders: [], createdFiles: [] };

    const fileService = new FileService();
    const folderService = new FolderService();

    const folderItems = clipboardItems.filter(
      (item) => item instanceof FolderModel,
    ) as FolderModel[];
    const fileItems = clipboardItems.filter(
      (item) => item instanceof FileModel,
    ) as FileModel[];

    const [existingFolders, existingFiles] = await Promise.all([
      Promise.all(
        folderItems.map((folder) => folderService.folderExists(folder.id)),
      ),
      Promise.all(fileItems.map((file) => fileService.fileExists(file.id))),
    ]);

    if (
      existingFolders.some((exists) => !exists) ||
      existingFiles.some((exists) => !exists)
    ) {
      set(initialState);
      throw new Error(
        "El portapapeles contiene elementos que ya no existen o fueron eliminados.",
      );
    }

    if (clipboardMode === "copy") {
      if (folderItems.length > 0)
        createdFolders = await Promise.all(
          folderItems.map((folder) =>
            folderService.copyFolder(folder.id, destinationFolderId),
          ),
        );

      if (fileItems.length > 0)
        createdFiles = await Promise.all(
          fileItems.map((file) =>
            fileService.copyFile(file.id, destinationFolderId),
          ),
        );

      return { createdFolders, createdFiles };
    } else {
      if (folderItems.length > 0)
        createdFolders = await Promise.all(
          folderItems.map((folder) =>
            folderService.moveFolder(folder.id, destinationFolderId),
          ),
        );

      if (fileItems.length > 0)
        createdFiles = await Promise.all(
          fileItems.map((file) =>
            fileService.moveFile(file.id, destinationFolderId),
          ),
        );

      set(initialState);

      return { createdFolders, createdFiles };
    }
  },

  clear: () => set(initialState),

  clearIfContainsIds: (itemIds) => {
    if (itemIds.length === 0) return;

    const clipboardIds = new Set(get().clipboardItems.map((item) => item.id));
    if (itemIds.some((id) => clipboardIds.has(id))) {
      set(initialState);
    }
  },

  hasItems: () => get().clipboardItems.length > 0,

  isCut: () => get().clipboardMode === "cut",

  isCopy: () => get().clipboardMode === "copy",
}));
