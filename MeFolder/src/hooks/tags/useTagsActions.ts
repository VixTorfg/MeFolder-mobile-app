import { NewTag } from "@/components/TagCreator";
import { useAlert } from "@/hooks";
import { TagService } from "@/services";
import { CreateTagInput } from "@/types/entities/tag";
import { useTagsStore } from "@/stores/useTagsStore";

interface UseTagsActionsParams {
  tagService: TagService | null;
}

export const useTagsActions = ({ tagService }: UseTagsActionsParams) => {
  const { showAlert } = useAlert();
  const { addItem } = useTagsStore();

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
      const result =
        type === "album"
          ? await tagService.createAlbum(input)
          : await tagService.createTag(input);

      addItem(result);
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
