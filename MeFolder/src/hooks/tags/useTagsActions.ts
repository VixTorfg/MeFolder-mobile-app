import { useState } from "react";
import { NewTag } from "@/components/TagCreator";
import { useAlert, useServices } from "@/providers";
import { getDocumentAsync } from "expo-document-picker";
import type { ArchiveProgress } from "@/types";
import { CreateTagInput } from "@/types/entities/tag";
import type { MediaImportProgress } from "@/types/media";
import { useTagsStore } from "@/stores/useTagsStore";
import { TagModel } from "@/models";

export const useTagsActions = () => {
  const { services } = useServices();
  const tagService = services?.tagService;
  const { showAlert } = useAlert();
  const { addItem, addAlbum } = useTagsStore();
  const [zipImportProgress, setZipImportProgress] =
    useState<MediaImportProgress | null>(null);

  const mapArchiveProgress = (
    progress: ArchiveProgress,
  ): MediaImportProgress => ({
    completed: progress.processedEntries,
    total: Math.max(progress.totalEntries, 1),
    ...(progress.currentEntryName
      ? { currentFileName: progress.currentEntryName }
      : {}),
  });

  const handleImportZipAlbum = async (): Promise<TagModel | null> => {
    if (!tagService) return null;

    try {
      const selection = await getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["application/zip", "application/x-zip-compressed"],
      });

      if (selection.canceled) {
        return null;
      }

      const selectedArchive = selection.assets[0];
      if (!selectedArchive?.uri) {
        showAlert({
          title: "ZIP no válido",
          message: "No se pudo acceder al archivo ZIP seleccionado.",
        });
        return null;
      }

      setZipImportProgress({
        completed: 0,
        total: 1,
        currentFileName: selectedArchive.name || "Preparando importación...",
      });

      const importResult =
        await services.albumArchiveService.importAlbumArchive({
          archiveFile: {
            name: selectedArchive.name || `album_${Date.now()}.zip`,
            uri: selectedArchive.uri,
            ...(selectedArchive.mimeType
              ? { mimeType: selectedArchive.mimeType }
              : {}),
          },
          onProgress: (progress: ArchiveProgress) => {
            setZipImportProgress(mapArchiveProgress(progress));
          },
        });

      if (!importResult.success || !importResult.data) {
        showAlert({
          title: "Error al importar álbum",
          message:
            importResult.error?.message ??
            "No se pudo importar el álbum desde el ZIP seleccionado.",
        });
        return null;
      }

      const importedAlbum = await tagService.getTag(importResult.data.albumId);
      addAlbum(importedAlbum);
      return importedAlbum;
    } catch (error) {
      console.warn("Error al importar álbum ZIP:", error);
      showAlert({
        title: "Error al importar álbum",
        message: "No se pudo importar el álbum desde el ZIP seleccionado.",
      });
      return null;
    } finally {
      setZipImportProgress(null);
    }
  };

  const handleSaveTag = async (data: NewTag): Promise<TagModel | null> => {
    if (!tagService) return null;

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

        return result;
      } else {
        const result = await tagService.createTag(input);
        addItem(result);
        return result;
      }
    } catch (error) {
      console.warn(`Error al guardar la etiqueta ${name}:`, error);
      showAlert({
        title: "Error al guardar etiqueta",
        message: `No se pudieron guardar la etiqueta. Inténtalo de nuevo.`,
      });
      return null;
    }
  };

  return {
    handleImportZipAlbum,
    handleSaveTag,
    zipImportProgress,
  };
};
