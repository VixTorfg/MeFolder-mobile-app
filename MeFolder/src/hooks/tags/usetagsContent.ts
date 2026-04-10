import { useCallback, useState } from "react";
import { useAlert, useDatabase, useServices } from "@/providers";
import { useFocusEffect } from "expo-router";
import { useTagsStore } from "@/stores/useTagsStore";

export const useTagsContent = () => {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const tagService = services?.tagService;

  const items = useTagsStore((state) => state.items);
  const albums = useTagsStore((state) => state.albums);
  const { setItems, setAlbums } = useTagsStore();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;

      const loadContent = async () => {
        setLoading(true);
        try {
          const [tags, albumList] = await Promise.all([
            tagService.getAllTagsWithoutAlbum(),
            tagService.getAlbums(),
          ]);
          setItems(tags);
          setAlbums(albumList);
        } catch {
          showAlert({
            title: "Error",
            message: "No se pudo cargar las etiquetas",
          });
        } finally {
          setLoading(false);
        }
      };

      loadContent();
    }, [isReady]),
  );

  return {
    items,
    albums,
    loading,
  };
};
