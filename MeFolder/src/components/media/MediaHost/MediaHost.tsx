import React, { useCallback, useMemo } from "react";
import { Modal, StatusBar, useWindowDimensions } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { MediaHostProps } from "@/types/media/viewers";
import MediaCarousel from "./MediaCarousel";
import { MediaViewer, type MediaViewerSharedProps } from "./MediaViewer";
import {
  buildSharedViewerProps,
  getMediaHostItemKey,
  getMediaHostPresentation,
  resolveActiveCarouselItems,
  resolveInitialSelectedItem,
} from "./mediaHostModel";
import { useCarrusel } from "./useCarrusel";

export default function MediaHost({
  items,
  onClose,
  autoPlay = false,
  initialFileId,
  imageWidth,
  imageHeight,
}: MediaHostProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const initialSelectedItem = useMemo(() => {
    return resolveInitialSelectedItem(items, initialFileId);
  }, [items, initialFileId]);

  const activeItems = useMemo(() => {
    return resolveActiveCarouselItems(items, initialSelectedItem);
  }, [items, initialSelectedItem]);

  const {
    currentItem,
    previousItem,
    nextItem,
    transitionItem,
    transitionDirection,
    isEnabled: isCarouselEnabled,
    gesture: carouselGesture,
    translateX: carouselTranslateX,
    transitionOverlayOpacity,
    isDragging: carouselIsDragging,
    slideGap,
    setSwipeEnabled,
    clearTransition,
  } = useCarrusel({
    items: activeItems,
    initialFileId,
    screenWidth,
    screenHeight,
  });

  // useMemo debe estar antes del early return (Rules of Hooks)
  const sharedViewerProps = useMemo<MediaViewerSharedProps>(
    () =>
      buildSharedViewerProps({
        onClose,
        autoPlay,
        viewportWidth: screenWidth,
        viewportHeight: screenHeight,
        onSwipeAvailabilityChange: setSwipeEnabled,
        isDragging: carouselIsDragging,
        ...(imageWidth !== undefined ? { imageWidth } : {}),
        ...(imageHeight !== undefined ? { imageHeight } : {}),
      }),
    [
      onClose,
      autoPlay,
      screenWidth,
      screenHeight,
      setSwipeEnabled,
      carouselIsDragging,
      imageWidth,
      imageHeight,
    ],
  );

  if (!currentItem) return null;

  const transitionItemKey = getMediaHostItemKey(transitionItem);

  const handleCurrentItemSettled = useCallback(
    (itemKey: string) => {
      if (transitionItemKey && itemKey === transitionItemKey) {
        clearTransition();
      }
    },
    [clearTransition, transitionItemKey],
  );

  const { modalAnimation, statusBarBackgroundColor } = getMediaHostPresentation(
    currentItem.category,
  );

  const content = isCarouselEnabled ? (
    <MediaCarousel
      slides={{ previousItem, currentItem, nextItem }}
      motion={{
        screenWidth,
        slideGap,
        gesture: carouselGesture,
        translateX: carouselTranslateX,
      }}
      transition={{
        transitionItem,
        transitionDirection,
        transitionOverlayOpacity,
      }}
      sharedViewerProps={sharedViewerProps}
      onCurrentItemSettled={handleCurrentItemSettled}
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
