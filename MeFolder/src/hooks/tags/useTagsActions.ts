import { NewTag } from "@/components/TagCreator";
import { useAlert, useServices } from "@/providers";
import { CreateTagInput } from "@/types/entities/tag";
import { useTagsStore } from "@/stores/useTagsStore";

export const useTagsActions = () => {
  const { services } = useServices();
  const tagService = services?.tagService;
  const { showAlert } = useAlert();
  const { addItem, addAlbum } = useTagsStore();

  const handleSaveTag = async (data: NewTag): Promise<void> => {
    if (!tagService) return;

    const { name, description, color, isFavorite, type, priority } = data;
    const input: CreateTagInput = {
      name,
      color,
      type,
      ...(description && { description }),
      ...(isFavorite && { isFavorite }),
      ...(priority && { priority }),
    };

    try {
      if (type === "album") {
        const result = await tagService.createAlbum(input);
        addAlbum(result);
      } else {
        const result = await tagService.createTag(input);
        addItem(result);
      }
    } catch (error) {
      console.warn(`Error al guardar la etiqueta ${name}:`, error);
      showAlert({
        title: "Error al guardar etiqueta",
        message: `No se pudieron guardar la etiqueta. Inténtalo de nuevo.`,
      });
    }
  };

  return {
    handleSaveTag,
  };
};
