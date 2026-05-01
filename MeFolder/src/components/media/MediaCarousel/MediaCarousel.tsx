import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FileModel } from "@/models/file";
import { MediaHostItem } from "@/types/media/viewers";
import { MediaHost } from "../MediaHost";

interface MediaCarouselProps {
  items: FileModel[];
  visible: boolean;
  initialFileId?: FileModel["id"];
  onClose: () => void;
}

type CarouselMediaItem = FileModel & {
  storageUrl: string;
  category: "image" | "video";
};

const isSupportedMediaItem = (item: FileModel): item is CarouselMediaItem => {
  if (!item.storageUrl) return false;
  return item.category === "image" || item.category === "video";
};

const toMediaHostItem = (item: CarouselMediaItem): MediaHostItem => ({
  uri: item.storageUrl ?? "",
  fileId: item.id,
  ...(item.metadata.mimeType && { mimeType: item.metadata.mimeType }),
  displayName: item.name,
  category: item.category,
});

export default function MediaCarousel({
  items,
  visible,
  initialFileId,
  onClose,
}: MediaCarouselProps) {
  const mediaItems = useMemo(() => items.filter(isSupportedMediaItem), [items]);

  const initialIndex = useMemo(() => {
    if (!initialFileId) return 0;
    const index = mediaItems.findIndex((item) => item.id === initialFileId);
    return index >= 0 ? index : 0;
  }, [mediaItems, initialFileId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  useEffect(() => {
    if (currentIndex <= mediaItems.length - 1) return;
    setCurrentIndex(Math.max(mediaItems.length - 1, 0));
  }, [currentIndex, mediaItems.length]);

  const handleSwipeNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, mediaItems.length - 1));
  }, [mediaItems.length]);

  const handleSwipePrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  if (!visible || mediaItems.length === 0) {
    return null;
  }

  const currentItem = mediaItems[currentIndex];
  if (!currentItem) {
    return null;
  }

  const item = toMediaHostItem(currentItem);

  return (
    <MediaHost
      key={currentItem.id}
      item={item}
      onClose={onClose}
      onSwipeNext={handleSwipeNext}
      onSwipePrevious={handleSwipePrevious}
    />
  );
}
