import React, { useMemo } from "react";
import { Modal, StatusBar, useWindowDimensions } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { MediaHostItem, MediaHostProps } from "@/types/media/viewers";
import MediaCarousel from "./MediaCarousel";
import { MediaViewer, type MediaViewerSharedProps } from "./MediaViewer";
import { useCarrusel } from "./useCarrusel";

const isCarouselItem = (item: MediaHostItem) =>
  item.category === "image" || item.category === "video";

export default function MediaHost({
  items,
  onClose,
  autoPlay = false,
  initialFileId,
  imageWidth,
  imageHeight,
}: MediaHostProps) {
  const { width: screenWidth } = useWindowDimensions();

  const initialSelectedItem = useMemo(() => {
    if (!items || items.length === 0) return null;
    if (!initialFileId) return items[0] ?? null;
    return (
      items.find((item) => item.fileId === initialFileId) ?? items[0] ?? null
    );
  }, [items, initialFileId]);

  const activeItems = useMemo(() => {
    if (!items || items.length === 0 || !initialSelectedItem) return [];
    if (!isCarouselItem(initialSelectedItem)) return [initialSelectedItem];
    return items.filter(isCarouselItem);
  }, [items, initialSelectedItem]);

  const {
    currentItem,
    previousItem,
    nextItem,
    isEnabled: isCarouselEnabled,
    gesture: carouselGesture,
    translateX: carouselTranslateX,
    isDragging: carouselIsDragging,
    slideGap,
    setSwipeEnabled,
  } = useCarrusel({
    items: activeItems,
    initialFileId,
    screenWidth,
  });

  // useMemo debe estar antes del early return (Rules of Hooks)
  const sharedViewerProps = useMemo<MediaViewerSharedProps>(
    () => ({
      onClose,
      autoPlay,
      onSwipeAvailabilityChange: setSwipeEnabled,
      isDragging: carouselIsDragging,
      ...(imageWidth !== undefined ? { imageWidth } : {}),
      ...(imageHeight !== undefined ? { imageHeight } : {}),
    }),
    [
      onClose,
      autoPlay,
      setSwipeEnabled,
      carouselIsDragging,
      imageWidth,
      imageHeight,
    ],
  );

  if (!currentItem) return null;

  const modalAnimation = currentItem.category === "audio" ? "slide" : "fade";
  const statusBarBackgroundColor =
    currentItem.category === "audio" ? "#121212" : "#000000";

  const content = isCarouselEnabled ? (
    <MediaCarousel
      previousItem={previousItem}
      currentItem={currentItem}
      nextItem={nextItem}
      screenWidth={screenWidth}
      slideGap={slideGap}
      gesture={carouselGesture}
      translateX={carouselTranslateX}
      sharedViewerProps={sharedViewerProps}
    />
  ) : (
    <MediaViewer item={currentItem} isActive {...sharedViewerProps} />
  );

  return (
    <Modal
      visible
      animationType={modalAnimation}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={statusBarBackgroundColor}
      />
      {/* Sin key: no desmontar el árbol de gestos al cambiar de item */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        {content}
      </GestureHandlerRootView>
    </Modal>
  );
}
