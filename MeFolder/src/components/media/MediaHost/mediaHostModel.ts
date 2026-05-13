import type { MediaHostItem } from "@/types/media/viewers";
import type { MediaViewerSharedProps } from "./MediaViewer";

export const isCarouselItem = (item: MediaHostItem) =>
  item.category === "image" || item.category === "video";

export function resolveInitialSelectedItem(
  items: MediaHostItem[] | null,
  initialFileId?: MediaHostItem["fileId"],
): MediaHostItem | null {
  if (!items || items.length === 0) {
    return null;
  }

  if (!initialFileId) {
    return items[0] ?? null;
  }

  return (
    items.find((item) => item.fileId === initialFileId) ?? items[0] ?? null
  );
}

export function resolveActiveCarouselItems(
  items: MediaHostItem[] | null,
  selectedItem: MediaHostItem | null,
): MediaHostItem[] {
  if (!items || items.length === 0 || !selectedItem) {
    return [];
  }

  if (!isCarouselItem(selectedItem)) {
    return [selectedItem];
  }

  return items.filter(isCarouselItem);
}

export function buildSharedViewerProps({
  onClose,
  autoPlay,
  viewportWidth,
  viewportHeight,
  onSwipeAvailabilityChange,
  isDragging,
  imageWidth,
  imageHeight,
}: {
  onClose: () => void;
  autoPlay: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onSwipeAvailabilityChange?: MediaViewerSharedProps["onSwipeAvailabilityChange"];
  isDragging?: MediaViewerSharedProps["isDragging"];
  imageWidth?: number;
  imageHeight?: number;
}): MediaViewerSharedProps {
  return {
    onClose,
    autoPlay,
    viewportWidth,
    viewportHeight,
    ...(onSwipeAvailabilityChange ? { onSwipeAvailabilityChange } : {}),
    ...(isDragging !== undefined ? { isDragging } : {}),
    ...(imageWidth !== undefined ? { imageWidth } : {}),
    ...(imageHeight !== undefined ? { imageHeight } : {}),
  };
}

export function getMediaHostItemKey(item: MediaHostItem | null): string | null {
  if (!item) {
    return null;
  }

  return item.fileId ?? `${item.category}:${item.uri}`;
}

export function getMediaHostPresentation(category: MediaHostItem["category"]): {
  modalAnimation: "fade" | "slide";
  statusBarBackgroundColor: string;
} {
  if (category === "audio") {
    return {
      modalAnimation: "slide",
      statusBarBackgroundColor: "#121212",
    };
  }

  return {
    modalAnimation: "fade",
    statusBarBackgroundColor: "#000000",
  };
}
