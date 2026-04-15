import { FileModel } from "@/models";
import { useAlert, useServices } from "@/providers";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

interface GalleryContentProps {
  tagId: string;
  pageSize?: number;
}

export const useGalleryContent = ({
  tagId,
  pageSize = 100,
}: GalleryContentProps) => {
  const [items, setItems] = useState<FileModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasMore = useRef(true);
  const currentPage = useRef(1);
  const { showAlert } = useAlert();
  const { services } = useServices();
  const tagService = services?.tagService;

  const loadPage = useCallback(
    async (page: number) => {
      if (isLoading || !hasMore.current) return;
      setIsLoading(true);
      try {
        const files = await tagService.getFilesInTagPaginated(
          tagId,
          page,
          pageSize,
        );

        if (files.length < pageSize) {
          hasMore.current = false;
        }

        const maxItems = pageSize * 2;
        setItems((prev) => {
          if (page === 1) return files;
          const merged = [...prev, ...files];
          if (merged.length <= maxItems) return merged;
          return merged.slice(merged.length - maxItems);
        });
        currentPage.current = page;
      } catch (error) {
        console.error("Error loading gallery content:", error);
        showAlert({
          title: "Error",
          message: "No se pudo cargar el contenido de la galería.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [tagId, pageSize, isLoading],
  );

  const refresh = useCallback(() => {
    hasMore.current = true;
    currentPage.current = 1;
    setItems([]);
    loadPage(1);
  }, [tagId, pageSize]);

  useEffect(() => {
    refresh();
  }, [tagId, pageSize]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore.current) {
      loadPage(currentPage.current + 1);
    }
  }, [isLoading, loadPage]);

  return { items, loadMore, isLoading, hasMore: hasMore.current };
};
