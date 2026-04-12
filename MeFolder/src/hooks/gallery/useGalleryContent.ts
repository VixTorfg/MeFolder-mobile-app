import { FileModel } from "@/models";
import { useAlert, useServices } from "@/providers";
import { useEffect, useState } from "react";

interface GalleryContentProps {
  tagId: string;
  page: number;
  pageSize: number;
}

export const useGalleryContent = ({
  tagId,
  page,
  pageSize,
}: GalleryContentProps) => {
  const [items, setItems] = useState<FileModel[]>([]);
  const { showAlert } = useAlert();
  const { services } = useServices();
  const tagService = services?.tagService;

  useEffect(() => {
    const loadGalleryContent = async () => {
      try {
        const files = await tagService.getFilesInTagPaginated(
          tagId,
          page,
          pageSize,
        );
        setItems(files);
      } catch (error) {
        console.error("Error loading gallery content:", error);
        showAlert({
          title: "Error",
          message: "No se pudo cargar el contenido de la galería.",
        });
      }
    };
    loadGalleryContent();
  }, [tagId, page, pageSize]);

  return items;
};
