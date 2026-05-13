import { FileModel, FolderModel } from "@/models";
import { useServices } from "@/providers/AppBootstrap";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useCallback, useRef, useState } from "react";

export const useSearch = (query: string) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchResults, setSearchResults] = useState<
    (FileModel | FolderModel)[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const setItems = useLibraryStore((state) => state.setItems);
  const originalItemsRef = useRef<(FileModel | FolderModel)[]>([]);
  const isSearchActiveRef = useRef(false);

  const { services } = useServices();
  const fileService = services?.fileService;
  const folderService = services?.folderService;

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);

    if (isSearchActiveRef.current) {
      setItems(originalItemsRef.current);
      isSearchActiveRef.current = false;
      setIsSearchActive(false);
    }
  }, [setItems]);

  const handleSearch = useCallback(
    async (newQuery: string): Promise<(FileModel | FolderModel)[]> => {
      const trimmedQuery = newQuery.trim();
      setSearchQuery(newQuery);

      if (!trimmedQuery) {
        clearSearch();
        return [];
      }

      setIsSearching(true);

      if (!fileService || !folderService) {
        setIsSearching(false);
        return [];
      }

      try {
        if (!isSearchActiveRef.current) {
          originalItemsRef.current = useLibraryStore.getState().items;
          isSearchActiveRef.current = true;
          setIsSearchActive(true);
        }

        const [fileResults, folderResults] = await Promise.all([
          fileService.searchFiles(trimmedQuery),
          folderService.searchFolders(trimmedQuery),
        ]);

        const combinedResults = [...folderResults, ...fileResults];

        setSearchResults(combinedResults);
        setItems(combinedResults);

        return combinedResults;
      } catch (error) {
        console.error("Error during search:", error);
        if (isSearchActiveRef.current && searchResults.length === 0) {
          isSearchActiveRef.current = false;
          setIsSearchActive(false);
        }
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [clearSearch, fileService, folderService, setItems, searchResults.length],
  );

  return {
    searchQuery,
    searchResults,
    handleSearch,
    clearSearch,
    isSearching,
    isSearchActive,
  };
};
