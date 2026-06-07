import { useAlert, useServices } from "@/providers";
import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useTagContentStore } from "@/stores/useTagContentStore";

// Fixed page size independent of column count or screen height.
// Virtualisation (FlashList) handles memory; we just need enough items to
// fill a couple of screens at the densest layout (6 cols on a tall phone ≈ 72).
const GALLERY_PAGE_SIZE = 72;

export const useGalleryContent = ({ tagId }: { tagId: string }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Ref used as the guard inside async callbacks to avoid stale-closure issues
  // and to prevent loadPage from being recreated on every loading-state change.
  const isLoadingRef = useRef(false);
  const hasMore = useRef(true);
  const currentPage = useRef(1);
  const { showAlert } = useAlert();
  const { services } = useServices();
  const tagService = services?.tagService;
  const { items, setItems } = useTagContentStore();

  const loadPage = useCallback(
    async (page: number) => {
      if (isLoadingRef.current || !hasMore.current) return;
      isLoadingRef.current = true;
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const files = await tagService.getFilesInTagPaginated(
          tagId,
          page,
          GALLERY_PAGE_SIZE,
        );

        if (files.length < GALLERY_PAGE_SIZE) {
          hasMore.current = false;
        }

        if (page === 1) {
          setItems(files);
        } else {
          // Deduplicate by id in case backend pages overlap.
          const prev = useTagContentStore.getState().items;
          const byId = new Map(prev.map((f) => [f.id, f]));
          for (const f of files) byId.set(f.id, f);
          setItems(Array.from(byId.values()));
        }
        currentPage.current = page;
      } catch (error) {
        console.error("Error loading gallery content:", error);
        showAlert({
          title: "Error",
          message: "No se pudo cargar el contenido de la galería.",
        });
      } finally {
        isLoadingRef.current = false;
        if (page === 1) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [tagId, setItems, showAlert, tagService],
  );

  const refresh = useCallback(() => {
    hasMore.current = true;
    currentPage.current = 1;
    useTagContentStore.getState().setItems([]);
    void loadPage(1);
  }, [loadPage]);

  // Stable ref so the useFocusEffect callback never changes identity — changing
  // it while the screen is focused would trigger an unwanted full reload.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useFocusEffect(
    useCallback(() => {
      refreshRef.current();
      return () => {
        useTagContentStore.getState().setItems([]);
      };
    }, []),
  );

  const loadMore = useCallback(() => {
    if (!isLoadingRef.current && hasMore.current) {
      void loadPage(currentPage.current + 1);
    }
  }, [loadPage]);

  return {
    items,
    loadMore,
    isLoading,
    isLoadingMore,
    hasMore: hasMore.current,
  };
};
