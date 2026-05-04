import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { MediaHostItem } from "@/types/media/viewers";
import { clamp } from "./config";

interface UseCarruselStateParams {
  items: MediaHostItem[];
  initialIndex: number;
  slideWidth: number;
  currentIndexSV: SharedValue<number>;
  isSwipeEnabledSV: SharedValue<boolean>;
  translateX: SharedValue<number>;
  transitionOverlayOpacity: SharedValue<number>;
}

interface UseCarruselStateResult {
  currentItem: MediaHostItem | null;
  previousItem: MediaHostItem | null;
  nextItem: MediaHostItem | null;
  transitionItem: MediaHostItem | null;
  transitionDirection: -1 | 0 | 1;
  isEnabled: boolean;
  commitSwipe: (direction: -1 | 1) => void;
  beginTransition: (direction: -1 | 1) => void;
  clearTransition: () => void;
}

export function resolveInitialCarruselIndex(
  items: MediaHostItem[],
  initialFileId?: MediaHostItem["fileId"],
): number {
  if (items.length === 0 || !initialFileId) {
    return 0;
  }

  const index = items.findIndex((item) => item.fileId === initialFileId);
  return index >= 0 ? index : 0;
}

export function useCarruselState({
  items,
  initialIndex,
  slideWidth,
  currentIndexSV,
  isSwipeEnabledSV,
  translateX,
  transitionOverlayOpacity,
}: UseCarruselStateParams): UseCarruselStateResult {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pendingResetIndex, setPendingResetIndex] = useState<number | null>(
    null,
  );
  const [transitionTargetIndex, setTransitionTargetIndex] = useState<
    number | null
  >(null);
  const [transitionDirection, setTransitionDirection] = useState<-1 | 0 | 1>(0);

  const safeIndex = Math.min(currentIndex, Math.max(items.length - 1, 0));
  const currentItem = items[safeIndex] ?? null;
  const previousItem =
    currentIndex > 0 ? (items[currentIndex - 1] ?? null) : null;
  const nextItem =
    currentIndex < items.length - 1 ? (items[currentIndex + 1] ?? null) : null;
  const transitionItem =
    transitionTargetIndex !== null
      ? (items[transitionTargetIndex] ?? null)
      : null;
  const isEnabled = currentItem != null && items.length > 1;

  useEffect(() => {
    currentIndexSV.value = safeIndex;
  }, [currentIndexSV, safeIndex]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setPendingResetIndex(null);
    setTransitionTargetIndex(null);
    setTransitionDirection(0);
    currentIndexSV.value = initialIndex;
    isSwipeEnabledSV.value = true;
    translateX.value = -slideWidth;
    transitionOverlayOpacity.value = 0;
  }, [
    currentIndexSV,
    initialIndex,
    isSwipeEnabledSV,
    slideWidth,
    transitionOverlayOpacity,
    translateX,
  ]);

  useEffect(() => {
    translateX.value = isEnabled ? -slideWidth : 0;
  }, [isEnabled, slideWidth, translateX]);

  // El cambio de índice se confirma tras la animación; luego recentramos el trío.
  useLayoutEffect(() => {
    if (pendingResetIndex === null) {
      return;
    }

    currentIndexSV.value = pendingResetIndex;
    translateX.value = -slideWidth;
    setCurrentIndex(pendingResetIndex);
    isSwipeEnabledSV.value = true;
    setPendingResetIndex(null);
  }, [
    currentIndexSV,
    isSwipeEnabledSV,
    pendingResetIndex,
    slideWidth,
    translateX,
  ]);

  const commitSwipe = useCallback(
    (direction: -1 | 1) => {
      const nextIndex = clamp(
        currentIndexSV.value + direction,
        0,
        Math.max(items.length - 1, 0),
      );

      setPendingResetIndex(nextIndex);
    },
    [currentIndexSV, items.length],
  );

  const beginTransition = useCallback(
    (direction: -1 | 1) => {
      const targetIndex = Math.min(
        Math.max(currentIndex + direction, 0),
        Math.max(items.length - 1, 0),
      );

      if (targetIndex === currentIndex) {
        setTransitionTargetIndex(null);
        setTransitionDirection(0);
        return;
      }

      setTransitionTargetIndex(targetIndex);
      setTransitionDirection(direction);
    },
    [currentIndex, items.length],
  );

  const clearTransition = useCallback(() => {
    setTransitionTargetIndex(null);
    setTransitionDirection(0);
    transitionOverlayOpacity.value = 0;
  }, [transitionOverlayOpacity]);

  return {
    currentItem,
    previousItem,
    nextItem,
    transitionItem,
    transitionDirection,
    isEnabled,
    commitSwipe,
    beginTransition,
    clearTransition,
  };
}
