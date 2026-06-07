import { useState } from "react";
import { FileModel, FolderModel } from "@/models";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useClipboardStore, useNavigationStore } from "@/stores";
import { useAlert, useServices } from "@/providers";
import { useFileSystem } from "@/hooks/useFileSystem";
import * as Sharing from "expo-sharing";
import type { NewFile } from "@/components/ItemCreator/FileCreator";
import type { NewFolder } from "@/components/ItemCreator/FolderCreator";
import { FileService, FolderService } from "@/services";

interface UseLibraryActionsParams {
  folderService: FolderService;
  fileService: FileService;
  clickedItem: FileModel | FolderModel | null;
  itemsSelected: (FileModel | FolderModel)[];
  clearSelection: () => void;
  setIsRenaming: (value: boolean) => void;
}

export const useLibraryActions = ({
  folderService,
  fileService,
  clickedItem,
  itemsSelected,
  clearSelection,
  setIsRenaming,
}: UseLibraryActionsParams) => {
  const [isPasting, setIsPasting] = useState(false);
  const items = useLibraryStore((state) => state.items);
  const { setItems, addItem, updateItem } = useLibraryStore();
  const { currentFolderId } = useNavigationStore();
  const { copy, cut, paste, hasItems, clearIfContainsIds } =
    useClipboardStore();
  const { services } = useServices();
  const { showAlert } = useAlert();
  const fs = useFileSystem();

  const handleShare = (item: FileModel | FolderModel) => {
    if (!Sharing.isAvailableAsync()) {
      showAlert({
        title: "Compartir no disponible",
        message:
          "La función de compartir no está disponible en este dispositivo.",
      });
      return;
    }

    if (item instanceof FileModel) {
      const fileUri = item.storageUrl;
      if (!fileUri) {
        showAlert({
          title: "Ruta no disponible",
          message: "La ubicación del archivo no está disponible.",
        });
        return;
      }

      Sharing.shareAsync(fileUri)
        .then(() =>
          showAlert({
            title: "Compartir",
            message: "Archivo compartido exitosamente.",
          }),
        )
        .catch((error) =>
          showAlert({
            title: "Error al compartir",
            message: `No se pudo compartir el archivo: ${error.message}`,
          }),
        );
    } else {
      showAlert({
        title: "Compartir carpeta",
        message: "La función de compartir carpetas no está implementada aún.",
      });
    }
  };

  const handleDeleteElements = (
    itemsToDelete?: (FileModel | FolderModel)[],
  ) => {
    const targetItems = itemsToDelete ?? itemsSelected;

    if (targetItems.some((i) => i instanceof FolderModel && i.isProtected)) {
      showAlert({
        title: "Eliminar carpeta protegida",
        message: "No se pueden eliminar carpetas protegidas.",
      });
      return;
    }

    showAlert({
      title: "Confirmar eliminación",
      message: `¿Estás seguro de que deseas eliminar ${targetItems.length} elemento(s)?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const folderIdsToDelete = targetItems
              .filter((i) => i instanceof FolderModel)
              .map((f) => f.id);
            const fileIdsToDelete = targetItems
              .filter((i) => i instanceof FileModel)
              .map((f) => f.id);

            try {
              const successFolders = await Promise.all(
                folderIdsToDelete.map((folderId) =>
                  folderService.deleteFolder(folderId, true),
                ),
              );
              const successFiles = await Promise.all(
                fileIdsToDelete.map((fileId) => fileService.deleteFile(fileId)),
              );

              if (
                successFolders.every((s) => s) &&
                successFiles.every((s) => s)
              ) {
                clearIfContainsIds([...folderIdsToDelete, ...fileIdsToDelete]);
                const newItems = items.filter(
                  (i) => !targetItems.some((s) => s.id === i.id),
                );
                setItems(newItems);
                clearSelection();
              } else {
                showAlert({
                  title: "Error",
                  message:
                    "No se pudieron eliminar todos los elementos seleccionados",
                });
              }
            } catch {
              showAlert({
                title: "Error",
                message: "Ocurrió un error al intentar eliminar los elementos",
              });
            }
          },
        },
      ],
    });
  };

  const handleMakeFavorite = async (item: FileModel) => {
    if (!item) return;

    showAlert({
      title: "Marcar como favorito",
      message: `¿Estás seguro de que quieres marcar "${item.name}" como favorito?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar",
          onPress: async () => {
            try {
              await fileService.markAsFavorite(item.id);
              showAlert({
                title: "Éxito",
                message: `"${item.name}" ha sido marcado como favorito.`,
              });
            } catch (error) {
              showAlert({
                title: "Error",
                message: `No se pudo marcar "${item.name}" como favorito: ${error}`,
              });
            }
          },
        },
      ],
    });
  };

  const [isImporting, setIsImporting] = useState(false);

  const handleSaveFile = async (data: NewFile): Promise<void> => {
    const { files, tags, folderId } = data;
    const resolvedFolderId = folderId ?? currentFolderId;
    setIsImporting(true);
    try {
      const { importedFiles, failed } =
        await services.mediaImportService.importFiles({
          files,
          tagIds: tags,
          folderId: resolvedFolderId,
        });

      importedFiles.forEach((fileItem) => addItem(fileItem));

      if (failed.length > 0) {
        showAlert({
          title: "Error al guardar archivos",
          message: `No se pudieron guardar los siguientes archivos:\n${failed.map((f) => `${f.name}: ${f.error}`).join("\n")}`,
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveFolder = async (data: NewFolder): Promise<void> => {
    const { name, description, color, icon, parentId } = data;
    const resolvedParentId = parentId ?? currentFolderId;

    try {
      const folderResult = await folderService.createFolder({
        name,
        ...(description && { description }),
        ...(color && { color }),
        ...(icon && { icon }),
        visibility: "public",
        ...(resolvedParentId && { parentId: resolvedParentId }),
      });

      const destinationUri = fs.resolveUri(folderResult.path);
      const success = fs.makeDirectory(destinationUri, { intermediates: true });

      if (!success) {
        await folderService.deleteFolder(folderResult.id, true);
        showAlert({
          title: "Error",
          message: "No se pudo crear la carpeta en el sistema de archivos",
        });
        return;
      }
      addItem(folderResult);
    } catch {
      showAlert({ title: "Error", message: "No se pudo crear la carpeta" });
    }
  };

  const handleRename = (newName: string) => {
    showAlert({
      title: "Renombrar archivo",
      message: `¿Estás seguro de que quieres renombrar el archivo a "${newName}"?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Renombrar",
          onPress: async () => {
            if (!newName.trim()) {
              showAlert({
                title: "Error",
                message: "El nombre del archivo no puede estar vacío",
              });
              return;
            }

            if (!clickedItem) return;

            try {
              if (clickedItem instanceof FolderModel) {
                if (clickedItem.isSystemFolder) {
                  showAlert({
                    title: "Error",
                    message: "No se puede modificar una carpeta del sistema",
                  });
                  return;
                }

                if (!folderService) return;
                const result = await folderService.renameFolder(
                  clickedItem.id,
                  newName,
                );
                updateItem(result);
              } else {
                if (!fileService) return;
                const result = await fileService.renameFile(
                  clickedItem?.id,
                  newName,
                );
                updateItem(result);
              }
              setIsRenaming(false);
            } catch {
              showAlert({
                title: "Error",
                message: "No se pudo renombrar el elemento",
              });
            }
          },
        },
      ],
    });
  };

  const handleCopy = (copyItems: (FileModel | FolderModel)[]) => {
    copy(copyItems);
  };

  const handleCut = (cutItems: (FileModel | FolderModel)[]) => {
    cut(cutItems);
  };

  const handlePaste = async () => {
    if (!hasItems()) {
      showAlert({
        title: "Portapapeles vacío",
        message: "No hay elementos para pegar.",
      });
      return;
    }
    setIsPasting(true);
    try {
      const { createdFolders, createdFiles } = await paste(currentFolderId);

      const newItems = [
        ...items.filter((i) => i instanceof FolderModel),
        ...createdFolders,
        ...items.filter((i) => i instanceof FileModel),
        ...createdFiles,
      ];
      setItems(newItems);
    } catch {
      showAlert({
        title: "Error",
        message: "No se pudieron pegar los elementos",
      });
    } finally {
      setIsPasting(false);
    }
  };

  return {
    handleShare,
    handleDeleteElements,
    handleSaveFile,
    handleSaveFolder,
    handleRename,
    handleCopy,
    handleCut,
    handlePaste,
    handleMakeFavorite,
    hasItems,
    isPasting,
    isImporting,
  };
};
