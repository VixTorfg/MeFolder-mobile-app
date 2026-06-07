import { FolderModel, FileModel } from "@/models";
import { useAlert, useServices } from "@/providers";
import { useClipboardStore } from "@/stores";
import { useTrashStore } from "@/stores/useTrashStore";
import * as Sharing from "expo-sharing";
import { getFriendlyErrorMessage } from "@/utils";

export const useTrashActions = (
  itemsSelected: (FileModel | FolderModel)[],
  clearSelection: () => void,
  clickedItem: FileModel | FolderModel | null,
  setIsRenaming: (value: boolean) => void,
) => {
  const { items, setItems, updateItem } = useTrashStore();
  const clearIfContainsIds = useClipboardStore(
    (state) => state.clearIfContainsIds,
  );
  const { services } = useServices();
  const { showAlert } = useAlert();
  const fileService = services?.fileService;
  const folderService = services?.folderService;

  const handlePermanentDelete = (
    itemsToDelete?: (FileModel | FolderModel)[],
  ) => {
    const targetItems = itemsToDelete ?? itemsSelected;
    showAlert({
      title: "Eliminar permanentemente",
      message:
        "¿Estás seguro de que deseas eliminar permanentemente los elementos seleccionados? Esta acción no se puede deshacer.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const deletedIds = targetItems.map((item) => item.id);

            try {
              for (const item of targetItems) {
                if (item instanceof FolderModel) {
                  await folderService.permanentDeleteFolder(item.id);
                } else {
                  await fileService.permanentDeleteFile(item.id);
                }
              }

              clearIfContainsIds(deletedIds);
              const newItems = items.filter((i) => !targetItems.includes(i));
              setItems(newItems);
              clearSelection();
            } catch (error) {
              showAlert({
                title: "Error al eliminar",
                message: getFriendlyErrorMessage(
                  error,
                  "No se pudieron eliminar los elementos seleccionados.",
                ),
              });
            }
          },
        },
      ],
    });
  };

  const handleEmptyTrash = () => {
    showAlert({
      title: "Vaciar papelera",
      message:
        "¿Estás seguro de que deseas vaciar toda la papelera? Esta acción no se puede deshacer.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Vaciar",
          style: "destructive",
          onPress: async () => {
            const filesOnly = items.filter((i) => i instanceof FileModel);
            const foldersOnly = items.filter((i) => i instanceof FolderModel);
            const deletedIds = items.map((item) => item.id);

            try {
              for (const file of filesOnly) {
                await fileService.permanentDeleteFile(file.id);
              }
              for (const folder of foldersOnly) {
                await folderService.permanentDeleteFolder(folder.id);
              }

              clearIfContainsIds(deletedIds);
              setItems([]);
              clearSelection();
            } catch (error) {
              showAlert({
                title: "Error al vaciar papelera",
                message: getFriendlyErrorMessage(
                  error,
                  "No se pudo vaciar la papelera.",
                ),
              });
            }
          },
        },
      ],
    });
  };

  const handleRestoreSelected = async (
    itemsToRestore?: (FileModel | FolderModel)[],
  ) => {
    const targetItems = itemsToRestore ?? itemsSelected;
    showAlert({
      title: "Restaurar elementos",
      message: `¿Estás seguro de que deseas restaurar los elementos seleccionados?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: async () => {
            const allRestoredIds = new Set<string>();

            try {
              for (const item of targetItems) {
                if (item instanceof FolderModel) {
                  const restoredIds = await folderService.restoreFolder(item.id);
                  restoredIds.forEach((id: string) => allRestoredIds.add(id));
                } else {
                  const restoredIds = await fileService.restoreFile(item.id);
                  restoredIds.forEach((id: string) => allRestoredIds.add(id));
                }
              }

              const newItems = items.filter((i) => !allRestoredIds.has(i.id));
              setItems(newItems);
              clearSelection();
            } catch (error) {
              showAlert({
                title: "Error al restaurar",
                message: getFriendlyErrorMessage(
                  error,
                  "No se pudieron restaurar los elementos seleccionados.",
                ),
              });
            }
          },
        },
      ],
    });
  };

  const handleRestoreAll = async () => {
    showAlert({
      title: "Restaurar todo",
      message:
        "¿Estás seguro de que deseas restaurar todos los elementos de la papelera?",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          onPress: async () => {
            const filesOnly = items.filter((i) => i instanceof FileModel);
            const foldersOnly = items.filter((i) => i instanceof FolderModel);

            for (const file of filesOnly) {
              await fileService.restoreFile(file.id);
            }
            for (const folder of foldersOnly) {
              await folderService.restoreFolder(folder.id);
            }

            setItems([]);
            clearSelection();
          },
        },
      ],
    });
  };

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
                title: "Error al marcar favorito",
                message: getFriendlyErrorMessage(
                  error,
                  `No se pudo marcar "${item.name}" como favorito.`,
                ),
              });
            }
          },
        },
      ],
    });
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
            } catch (error) {
              showAlert({
                title: "Error al renombrar",
                message: getFriendlyErrorMessage(
                  error,
                  "No se pudo renombrar el elemento.",
                ),
              });
            }
          },
        },
      ],
    });
  };

  return {
    fileService,
    folderService,
    handlePermanentDelete,
    handleEmptyTrash,
    handleRestoreSelected,
    handleRestoreAll,
    handleShare,
    handleMakeFavorite,
    handleRename,
  };
};
