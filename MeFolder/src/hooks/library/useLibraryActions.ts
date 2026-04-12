import { FileModel, FolderModel } from "@/models";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useClipboardStore, useNavigationStore } from "@/stores";
import { useAlert } from "@/providers";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useMedia } from "@/hooks/useMedia";
import * as Sharing from "expo-sharing";
import mime from "mime";
import type {
  CreateFileInput,
  FileCategory,
  FileMetadata,
  FSFileInfo,
} from "@/types";
import { FILE_CATEGORY_MAP } from "@/types/common/file-extensions";
import type { FileExtension } from "@/types/common/file-extensions";
import type { NewFile } from "@/components/ItemCreator/FileCreator";
import type { NewFolder } from "@/components/ItemCreator/FolderCreator";

/**
 * Casos donde la librería `mime` devuelve una extensión que no corresponde
 * a la categoría real del tipo MIME (p.ej. audio/mp4 → "mp4" es vídeo).
 */
const MIME_EXT_OVERRIDES: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
};

/**
 * Resuelve la extensión correcta para un archivo dado su mimeType y nombre.
 * Prioridad:
 *  1. Override manual (para casos que mime.js resuelve mal)
 *  2. mime.getExtension si la categoría del resultado coincide con la del MIME
 *  3. Extensión original del nombre del archivo
 */
function resolveExtension(
  mimeType: string | undefined,
  fileName: string,
): string {
  const nameExt =
    fileName.lastIndexOf(".") > 0
      ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
      : "";

  if (!mimeType) return nameExt;

  const mimeNorm = mimeType.toLowerCase();

  // 1. Override manual
  if (MIME_EXT_OVERRIDES[mimeNorm]) return MIME_EXT_OVERRIDES[mimeNorm];

  // 2. mime.getExtension — verificar que su categoría coincida con el prefijo del MIME
  const extFromMime = mime.getExtension(mimeType) ?? "";
  if (extFromMime) {
    const catFromMime = FILE_CATEGORY_MAP[extFromMime as FileExtension];
    const mimePrefix = mimeNorm.split("/")[0] + "/";
    const expectedCat: Record<string, FileCategory> = {
      "image/": "image",
      "video/": "video",
      "audio/": "audio",
    };
    const expected = expectedCat[mimePrefix];
    // Si la categoría concuerda (o no hay prefijo conocido), usar la extensión del mime
    if (!expected || catFromMime === expected) return extFromMime;
  }

  // 3. Fallback: extensión original del nombre
  return nameExt;
}

interface UseLibraryActionsParams {
  folderService: any;
  fileService: any;
  clickedItem: FileModel | FolderModel | null;
  itemsSelected: (FileModel | FolderModel)[];
  clearSelection: () => void;
  setIsRenaming: (value: boolean) => void;
}

export const useLibraryActions = ({
  folderService,
  fileService,
  clickedItem,
  itemsSelected,
  clearSelection,
  setIsRenaming,
}: UseLibraryActionsParams) => {
  const items = useLibraryStore((state) => state.items);
  const { setItems, addItem, updateItem } = useLibraryStore();
  const { currentFolderId } = useNavigationStore();
  const { copy, cut, paste, hasItems } = useClipboardStore();
  const { showAlert } = useAlert();
  const fs = useFileSystem();
  const media = useMedia();

  const buildFileMetadata = async (
    category: FileCategory,
    uri: string,
    fsInfo: FSFileInfo | null,
    fileMimeType?: string,
  ): Promise<FileMetadata> => {
    const mimeType = fileMimeType || fsInfo?.mimeType || "";
    const base: FileMetadata = {
      size: fsInfo?.size ?? 0,
      ...(mimeType && { mimeType }),
      ...(fsInfo?.md5 && { checksum: fsInfo.md5 }),
    };

    switch (category) {
      case "video": {
        const videoMeta = await media.getVideoMetadata(uri);
        if (videoMeta) return { ...base, videoMetadata: videoMeta };
        return base;
      }
      case "audio": {
        const audioMeta = await media.getAudioMetadata(uri);
        if (audioMeta) return { ...base, audioMetadata: audioMeta };
        return base;
      }
      case "image": {
        const imageMeta = await media.getImageMetadata(uri);
        if (imageMeta) return { ...base, imageMetadata: imageMeta };
        return base;
      }
      default:
        return base;
    }
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

  const handleDeleteElements = (
    itemsToDelete?: (FileModel | FolderModel)[],
  ) => {
    const targetItems = itemsToDelete ?? itemsSelected;

    showAlert({
      title: "Confirmar eliminación",
      message: `¿Estás seguro de que deseas eliminar ${targetItems.length} elemento(s)?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const folderIdsToDelete = targetItems
              .filter((i) => i instanceof FolderModel)
              .map((f) => f.id);
            const fileIdsToDelete = targetItems
              .filter((i) => i instanceof FileModel)
              .map((f) => f.id);

            try {
              const successFolders = await Promise.all(
                folderIdsToDelete.map((folderId) =>
                  folderService.deleteFolder(folderId, true),
                ),
              );
              const successFiles = await Promise.all(
                fileIdsToDelete.map((fileId) => fileService.deleteFile(fileId)),
              );

              if (
                successFolders.every((s) => s) &&
                successFiles.every((s) => s)
              ) {
                const newItems = items.filter(
                  (i) => !targetItems.some((s) => s.id === i.id),
                );
                setItems(newItems);
                clearSelection();
              } else {
                showAlert({
                  title: "Error",
                  message:
                    "No se pudieron eliminar todos los elementos seleccionados",
                });
              }
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

  const handleSaveFile = async (data: NewFile): Promise<void> => {
    const { files, tags, folderId } = data;
    const resolvedFolderId = folderId ?? currentFolderId;
    const targetPath = await fileService.resolveStoragePath(resolvedFolderId);
    const failed: { name: string; error: string }[] = [];

    for (const file of files) {
      let copiedUri: string | null = null;

      try {
        const resolvedExt = resolveExtension(file.mimeType, file.name);
        const dotIndex = file.name.lastIndexOf(".");
        const baseName =
          dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name;
        const fileNameWithExt = resolvedExt
          ? `${baseName}.${resolvedExt}`
          : file.name;

        const targetDirUri = fs.resolveUri(targetPath);
        fs.ensureDirectory(targetDirUri);

        const destinationUri = fs.resolveUri(
          `${targetPath}/${fileNameWithExt}`,
        );
        const copyResult = fs.copyFile(file.uri, destinationUri);

        if (!copyResult.success || !copyResult.toUri) {
          failed.push({
            name: file.name,
            error: copyResult.error ?? "Error al copiar el archivo",
          });
          continue;
        }

        copiedUri = copyResult.toUri;
        const metadata = fs.getFileInfo(copiedUri);

        if (!metadata) {
          throw new Error("No se pudo obtener información del archivo");
        }

        const fileMetadata = await buildFileMetadata(
          file.type,
          copiedUri,
          metadata,
          file.mimeType,
        );

        // Generar thumbnail para imágenes y videos
        let thumbnailUrl: string | undefined;
        if (file.type === "image" || file.type === "video") {
          const thumbId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const thumbUri = await media.generateThumbnail(
            copiedUri,
            thumbId,
            file.type,
          );
          if (thumbUri) {
            thumbnailUrl = thumbUri;
          }
        }

        const fileResult = await fileService?.createFile({
          name: file.name,
          originalName: file.originalName,
          extension: (resolvedExt ||
            metadata.extension ||
            "") as CreateFileInput["extension"],
          folderId: resolvedFolderId,
          visibility: "public",
          metadata: fileMetadata,
          tagIds: tags,
          storageUrl: copiedUri,
          ...(thumbnailUrl && { thumbnailUrl }),
        } as CreateFileInput);

        addItem(fileResult);
      } catch (error) {
        console.warn(`Error al guardar el archivo ${file.name}:`, error);
        if (copiedUri) {
          try {
            fs.deleteFile(copiedUri);
          } catch (cleanupError) {
            console.warn(`Rollback fallido para ${file.name}:`, cleanupError);
          }
        }
        failed.push({ name: file.name, error: String(error) });
      }
    }

    if (failed.length > 0) {
      showAlert({
        title: "Error al guardar archivos",
        message: `No se pudieron guardar los siguientes archivos:\n${failed.map((f) => `${f.name}: ${f.error}`).join("\n")}`,
      });
    }
  };

  const handleSaveFolder = async (data: NewFolder): Promise<void> => {
    const { name, description, color, icon, parentId } = data;
    const resolvedParentId = parentId ?? currentFolderId;

    try {
      const folderResult = await folderService.createFolder({
        name,
        ...(description && { description }),
        ...(color && { color }),
        ...(icon && { icon }),
        visibility: "public",
        ...(resolvedParentId && { parentId: resolvedParentId }),
      });

      const destinationUri = fs.resolveUri(folderResult.path);
      const success = fs.makeDirectory(destinationUri, { intermediates: true });

      if (!success) {
        await folderService.deleteFolder(folderResult.id, true);
        showAlert({
          title: "Error",
          message: "No se pudo crear la carpeta en el sistema de archivos",
        });
        return;
      }
      addItem(folderResult);
    } catch {
      showAlert({ title: "Error", message: "No se pudo crear la carpeta" });
    }
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
            } catch {
              showAlert({
                title: "Error",
                message: "No se pudo renombrar el elemento",
              });
            }
          },
        },
      ],
    });
  };

  const handleCopy = (copyItems: (FileModel | FolderModel)[]) => {
    copy(copyItems);
  };

  const handleCut = (cutItems: (FileModel | FolderModel)[]) => {
    cut(cutItems);
  };

  const handlePaste = async () => {
    if (!hasItems()) {
      showAlert({
        title: "Portapapeles vacío",
        message: "No hay elementos para pegar.",
      });
      return;
    }
    try {
      const { createdFolders, createdFiles } = await paste(currentFolderId);

      const newItems = [
        ...items.filter((i) => i instanceof FolderModel),
        ...createdFolders,
        ...items.filter((i) => i instanceof FileModel),
        ...createdFiles,
      ];
      setItems(newItems);
    } catch {
      showAlert({
        title: "Error",
        message: "No se pudieron pegar los elementos",
      });
    }
  };

  return {
    handleShare,
    handleDeleteElements,
    handleSaveFile,
    handleSaveFolder,
    handleRename,
    handleCopy,
    handleCut,
    handlePaste,
  };
};
