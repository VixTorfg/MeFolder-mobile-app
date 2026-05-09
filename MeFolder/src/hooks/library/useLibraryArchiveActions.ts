import { useCallback, useState } from "react";
import { FileModel, FolderModel } from "@/models";
import { useAlert, useServices } from "@/providers";
import { useNavigationStore } from "@/stores";
import { useLibraryStore } from "@/stores/useLibraryStore";
import type {
  ArchiveOperationError,
  ArchiveProgress,
  ArchiveSourceFile,
} from "@/types";

type PendingArchiveAction =
  | {
      type: "compress";
      item: FileModel | FolderModel;
    }
  | {
      type: "extract";
      item: FileModel;
    }
  | null;

interface ArchiveDialogState {
  isVisible: boolean;
  action: "compress" | "extract" | null;
  item: FileModel | FolderModel | null;
  extractHere: boolean;
}

interface ArchiveLoadingState {
  isVisible: boolean;
  title: string;
  message: string;
  progress: ArchiveProgress | null;
}

export const useLibraryArchiveActions = () => {
  const { services } = useServices();
  const { showAlert } = useAlert();
  const { currentFolderId } = useNavigationStore();
  const { addItem } = useLibraryStore();
  const [pendingAction, setPendingAction] =
    useState<PendingArchiveAction>(null);
  const [extractHere, setExtractHere] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState<ArchiveLoadingState>({
    isVisible: false,
    title: "",
    message: "",
    progress: null,
  });

  const showArchiveError = useCallback(
    (error: ArchiveOperationError | undefined, title: string) => {
      showAlert({
        title,
        message:
          error?.message ??
          "Ha ocurrido un error inesperado durante la operación.",
      });
    },
    [showAlert],
  );

  const toArchiveSourceFile = useCallback(
    (file: FileModel): ArchiveSourceFile => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      extension: file.extension,
      path: file.path,
      metadata: file.metadata,
      ...(file.folderId ? { folderId: file.folderId } : {}),
      ...(file.visibility ? { visibility: file.visibility } : {}),
      ...(file.storageUrl ? { storageUrl: file.storageUrl } : {}),
    }),
    [],
  );

  const removeExtension = useCallback((name: string): string => {
    const dotIndex = name.lastIndexOf(".");
    return dotIndex > 0 ? name.slice(0, dotIndex) : name;
  }, []);

  const hideLoading = useCallback(() => {
    setArchiveLoading({
      isVisible: false,
      title: "",
      message: "",
      progress: null,
    });
  }, []);

  const updateLoading = useCallback(
    (title: string, progress: ArchiveProgress, fallbackMessage: string) => {
      const processed = Math.min(
        progress.totalEntries,
        Math.max(progress.processedEntries, 0),
      );
      const detail = progress.currentEntryName
        ? `Procesando ${processed} de ${progress.totalEntries}: ${progress.currentEntryName}`
        : `Procesando ${processed} de ${progress.totalEntries}`;

      setArchiveLoading({
        isVisible: true,
        title,
        message: progress.totalEntries > 0 ? detail : fallbackMessage,
        progress,
      });
    },
    [],
  );

  const addExtractedRootItems = useCallback(
    async (createdFolderIds: string[], createdFileIds: string[]) => {
      const [folders, files] = await Promise.all([
        Promise.all(
          createdFolderIds.map((folderId) =>
            services.folderService.getFolder(folderId),
          ),
        ),
        Promise.all(
          createdFileIds.map((fileId) => services.fileService.getFile(fileId)),
        ),
      ]);

      folders
        .filter((folder) => folder.parentId === currentFolderId)
        .forEach((folder) => addItem(folder));

      files
        .filter((file) => file.folderId === currentFolderId)
        .forEach((file) => addItem(file));
    },
    [addItem, currentFolderId, services.fileService, services.folderService],
  );

  const handleCompressItem = useCallback(
    async (item: FileModel | FolderModel | null) => {
      if (!item) return;

      setArchiveLoading({
        isVisible: true,
        title: "Comprimiendo",
        message: "Preparando los archivos para crear el ZIP...",
        progress: null,
      });

      try {
        const result =
          item instanceof FolderModel
            ? await services.archiveService.createArchiveFromFolder({
                sourceFolderId: item.id,
                destinationFolderId: currentFolderId,
                onProgress: (progress) => {
                  updateLoading("Comprimiendo", progress, "Creando el ZIP...");
                },
              })
            : await services.archiveService.createArchiveFromFiles({
                files: [toArchiveSourceFile(item)],
                outputName: removeExtension(item.name),
                destinationFolderId: currentFolderId,
                onProgress: (progress) => {
                  updateLoading("Comprimiendo", progress, "Creando el ZIP...");
                },
              });

        if (!result.success || !result.data) {
          showArchiveError(result.error, "No se pudo comprimir");
          return;
        }

        const createdArchive = await services.fileService.getFile(
          result.data.archiveFile.id,
        );
        addItem(createdArchive);

        showAlert({
          title: "Compresión completada",
          message: `Se ha creado ${createdArchive.name} correctamente.`,
        });
      } catch {
        showAlert({
          title: "No se pudo comprimir",
          message: "Ha ocurrido un error inesperado al comprimir el elemento.",
        });
      } finally {
        hideLoading();
      }
    },
    [
      addItem,
      currentFolderId,
      hideLoading,
      removeExtension,
      services.archiveService,
      services.fileService,
      showAlert,
      showArchiveError,
      toArchiveSourceFile,
      updateLoading,
    ],
  );

  const handleExtractItem = useCallback(
    async (
      item: FileModel | FolderModel | null,
      shouldExtractHere: boolean,
    ) => {
      if (!(item instanceof FileModel)) return;

      const extractionMode = shouldExtractHere
        ? "extract_here"
        : "create_folder";

      setArchiveLoading({
        isVisible: true,
        title: "Descomprimiendo",
        message: "Preparando el contenido del ZIP...",
        progress: null,
      });

      try {
        const result = await services.archiveService.extractArchive({
          archiveFile: toArchiveSourceFile(item),
          parentFolderId: currentFolderId,
          mode: extractionMode,
          onProgress: (progress) => {
            updateLoading(
              "Descomprimiendo",
              progress,
              "Extrayendo archivos...",
            );
          },
        });

        if (!result.success || !result.data) {
          showArchiveError(result.error, "No se pudo descomprimir");
          return;
        }

        if (extractionMode === "create_folder") {
          const createdFolder = await services.folderService.getFolder(
            result.data.destinationFolder.id,
          );
          addItem(createdFolder);

          showAlert({
            title: "Extracción completada",
            message: `Se ha extraído el contenido en ${createdFolder.name}.`,
          });
          return;
        }

        await addExtractedRootItems(
          result.data.createdFolders.map((folder) => folder.id),
          result.data.createdFiles.map((file) => file.id),
        );

        showAlert({
          title: "Extracción completada",
          message: `Se ha extraído el contenido de ${item.name} en la carpeta actual.`,
        });
      } catch {
        showAlert({
          title: "No se pudo descomprimir",
          message:
            "Ha ocurrido un error inesperado al descomprimir el archivo.",
        });
      } finally {
        hideLoading();
      }
    },
    [
      addExtractedRootItems,
      addItem,
      currentFolderId,
      hideLoading,
      services.archiveService,
      services.folderService,
      showAlert,
      showArchiveError,
      toArchiveSourceFile,
      updateLoading,
    ],
  );

  const requestCompressItem = useCallback(
    (item: FileModel | FolderModel | null) => {
      if (!item) return;

      setPendingAction({ type: "compress", item });
    },
    [],
  );

  const requestExtractItem = useCallback(
    (item: FileModel | FolderModel | null) => {
      if (!(item instanceof FileModel)) return;

      setExtractHere(false);
      setPendingAction({ type: "extract", item });
    },
    [],
  );

  const closeArchiveDialog = useCallback(() => {
    setPendingAction(null);
    setExtractHere(false);
  }, []);

  const confirmArchiveAction = useCallback(async () => {
    if (!pendingAction) return;

    const action = pendingAction;
    const shouldExtractHere = extractHere;
    closeArchiveDialog();

    if (action.type === "compress") {
      await handleCompressItem(action.item);
      return;
    }

    await handleExtractItem(action.item, shouldExtractHere);
  }, [
    closeArchiveDialog,
    extractHere,
    handleCompressItem,
    handleExtractItem,
    pendingAction,
  ]);

  const archiveDialog: ArchiveDialogState = {
    isVisible: pendingAction !== null,
    action: pendingAction?.type ?? null,
    item: pendingAction?.item ?? null,
    extractHere,
  };

  return {
    archiveDialog,
    archiveLoading,
    closeArchiveDialog,
    confirmArchiveAction,
    requestCompressItem,
    requestExtractItem,
    setExtractHere,
  };
};
