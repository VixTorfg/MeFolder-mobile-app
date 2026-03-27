import { NewTag } from '@/components/TagCreator';
import { useAlert } from '@/hooks';
import { TagModel } from '@/models/tag';
import { TagService } from '@/services';
import { CreateTagInput} from '@/types/entities/tag';

interface UseTagsActionsParams {
  tagService: TagService | null;
  onTagCreated?: (tag: TagModel) => void;
}

export const useTagsActions = ({
  tagService,
  onTagCreated
}: UseTagsActionsParams) => {
  const { showAlert } = useAlert();

  const handleSaveTag = async (data: NewTag): Promise<void> => {
     if (!tagService) return;

    const { name, description, color, isFavorite, type} = data;
    const input: CreateTagInput = { 
      name, 
      color,  
      type, 
      ...(description && { description }), 
      ...(isFavorite && { isFavorite })
      };

      try {

        const result = type === 'album'
          ? await tagService.createAlbum(input)
          : await tagService.createTag(input);

        onTagCreated?.(result);
      } catch (error) {
        console.warn(`Error al guardar la etiqueta ${name}:`, error);
        showAlert({
          title: 'Error al guardar etiqueta',
          message: `No se pudieron guardar la etiqueta. Inténtalo de nuevo.`,
        });
      }
    }


  return {
    handleSaveTag,
  };
};
