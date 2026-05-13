import { FileModel } from "@/models/file";
import { useServices, useAlert } from "@/providers";
import { useTagContentStore } from "@/stores/useTagContentStore";
import * as Sharing from "expo-sharing";

interface UseContentTagsActionsParams {
  clickedItem: FileModel | null;
  itemsSelected: FileModel[];
  clearSelection: () => void;
  setIsRenaming: (value: boolean) => void;
  tagId: string;
}

export const useContentTagActions = ({
  tagId,
  clickedItem,
  itemsSelected,
  clearSelection,
  setIsRenaming,
}: UseContentTagsActionsParams) => {
  const { services } = useServices();
  const tagService = services?.tagService;
  const fileService = services?.fileService;
  const { showAlert } = useAlert();
  const { updateItem, removeItems } = useTagContentStore();

  const handleRename = (newName: string) => {
    if (!newName.trim()) {
      showAlert({
        title: "Error",
        message: "El nombre del archivo no puede estar vacío",
      });
      return;
    }

    if (!clickedItem) return;

    showAlert({
      title: "Renombrar archivo",
      message: `¿Estás seguro de que quieres renombrar el archivo a "${newName}"?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Renombrar",
          onPress: async () => {
            try {
              const updatedFile = await fileService.renameFile(
                clickedItem.id,
                newName,
              );
              updateItem(updatedFile);
              setIsRenaming(false);
            } catch {
              showAlert({
                title: "Error",
                message: "No se pudo renombrar el archivo",
              });
            }
          },
        },
      ],
    });
  };

  const handleDeleteElements = (itemsToDelete?: FileModel[]) => {
    const targetItems = itemsToDelete ?? itemsSelected;

    showAlert({
      title: "Quitar de la etiqueta",
      message: `¿Estás seguro de que deseas quitar ${targetItems.length} elemento(s) de la etiqueta?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const fileIdsToDelete = targetItems
              .filter((i) => i instanceof FileModel)
              .map((f) => f.id);

            try {
              for (const fileId of fileIdsToDelete) {
                await tagService.removeTagFromFile(fileId, tagId);
              }

              removeItems(fileIdsToDelete);
              clearSelection();
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

  const handleShare = (item: FileModel) => {
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

  return {
    handleRename,
    handleShare,
    handleDeleteElements,
  };
};
