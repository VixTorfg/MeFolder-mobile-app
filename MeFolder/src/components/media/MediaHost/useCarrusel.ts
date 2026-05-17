import { useCallback, useEffect, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { MediaHostItem } from "@/types/media/viewers";
import { scheduleOnRN } from "react-native-worklets";
import { CAROUSEL_CONFIG, clamp, getCarouselSwipeThreshold } from "./config";
import {
  resolveInitialCarruselIndex,
  useCarruselState,
} from "./useCarruselState";

interface UseCarruselParams {
  items: MediaHostItem[];
  initialFileId?: MediaHostItem["fileId"];
  screenWidth: number;
  screenHeight: number;
}

interface UseCarruselResult {
  currentItem: MediaHostItem | null;
  previousItem: MediaHostItem | null;
  nextItem: MediaHostItem | null;
  transitionItem: MediaHostItem | null;
  transitionDirection: -1 | 0 | 1;
  isEnabled: boolean;
  gesture: ReturnType<typeof Gesture.Pan>;
  translateX: SharedValue<number>;
  transitionOverlayOpacity: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  slideGap: number;
  setSwipeEnabled: (enabled: boolean) => void;
  clearTransition: () => void;
}

export function useCarrusel({
  items,
  initialFileId,
  screenWidth,
  screenHeight,
}: UseCarruselParams): UseCarruselResult {
  const slideWidth = screenWidth + CAROUSEL_CONFIG.slideGap;

  const initialIndex = useMemo(() => {
    return resolveInitialCarruselIndex(items, initialFileId);
  }, [items, initialFileId]);

  const translateX = useSharedValue(-slideWidth);
  const transitionOverlayOpacity = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const currentIndexSV = useSharedValue(initialIndex);
  const isSwipeEnabledSV = useSharedValue(true);
  const itemsLengthSV = useSharedValue(items.length);
  const slideWidthSV = useSharedValue(slideWidth);
  const swipeThresholdSV = useSharedValue<number>(
    CAROUSEL_CONFIG.swipeThreshold,
  );
  const isEnabledSV = useSharedValue(items.length > 1);

  const {
    currentItem,
    previousItem,
    nextItem,
    transitionItem,
    transitionDirection,
    isEnabled,
    commitSwipe,
    beginTransition,
    clearTransition,
  } = useCarruselState({
    items,
    initialIndex,
    slideWidth,
    currentIndexSV,
    isSwipeEnabledSV,
    translateX,
    transitionOverlayOpacity,
  });

  const currentSwipeThreshold = useMemo(() => {
    return getCarouselSwipeThreshold({
      item: currentItem,
      screenWidth,
      screenHeight,
    });
  }, [currentItem, screenHeight, screenWidth]);

  useEffect(() => {
    itemsLengthSV.value = items.length;
    isEnabledSV.value = items.length > 1;
  }, [isEnabledSV, items.length, itemsLengthSV]);

  useEffect(() => {
    slideWidthSV.value = slideWidth;
  }, [slideWidth, slideWidthSV]);

  useEffect(() => {
    swipeThresholdSV.value = currentSwipeThreshold;
  }, [currentSwipeThreshold, swipeThresholdSV]);

  const setSwipeEnabled = useCallback(
    (enabled: boolean) => {
      isSwipeEnabledSV.value = enabled;
    },
    [isSwipeEnabledSV],
  );

  const gesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .activeOffsetX([
      -CAROUSEL_CONFIG.activeOffsetX,
      CAROUSEL_CONFIG.activeOffsetX,
    ])
    .onBegin(() => {
      isDragging.value = true;
    })
    .onFinalize(() => {
      isDragging.value = false;
    })
    .onUpdate((event) => {
      if (!isEnabledSV.value || !isSwipeEnabledSV.value) return;
      if (Math.abs(event.translationY) > CAROUSEL_CONFIG.verticalTolerance) {
        return;
      }

      const idx = currentIndexSV.value;
      const length = itemsLengthSV.value;
      const sw = slideWidthSV.value;
      const hasPrevious = idx > 0;
      const hasNext = idx < length - 1;
      const minX = hasNext ? -2 * sw : -sw;
      const maxX = hasPrevious ? 0 : -sw;

      translateX.value = clamp(-sw + event.translationX, minX, maxX);
    })
    .onEnd((event) => {
      if (
        !isEnabledSV.value ||
        !isSwipeEnabledSV.value ||
        Math.abs(event.translationY) > CAROUSEL_CONFIG.verticalTolerance
      ) {
        translateX.value = withTiming(-slideWidthSV.value, {
          duration: CAROUSEL_CONFIG.resetDuration,
        });
        return;
      }

      const idx = currentIndexSV.value;
      const length = itemsLengthSV.value;
      const sw = slideWidthSV.value;
      const swipeThreshold = swipeThresholdSV.value;
      const hasPrevious = idx > 0;
      const hasNext = idx < length - 1;
      const shouldGoNext =
        hasNext &&
        (event.translationX <= -swipeThreshold ||
          event.velocityX <= -CAROUSEL_CONFIG.velocityThreshold);
      const shouldGoPrevious =
        hasPrevious &&
        (event.translationX >= swipeThreshold ||
          event.velocityX >= CAROUSEL_CONFIG.velocityThreshold);

      if (shouldGoNext) {
        isSwipeEnabledSV.value = false;
        transitionOverlayOpacity.value = 0;
        scheduleOnRN(beginTransition, 1);
        translateX.value = withTiming(
          -2 * sw,
          { duration: CAROUSEL_CONFIG.changeDuration },
          (finished) => {
            if (finished) {
              transitionOverlayOpacity.value = 1;
              scheduleOnRN(commitSwipe, 1);
            }
          },
        );
        return;
      }

      if (shouldGoPrevious) {
        isSwipeEnabledSV.value = false;
        transitionOverlayOpacity.value = 0;
        scheduleOnRN(beginTransition, -1);
        translateX.value = withTiming(
          0,
          { duration: CAROUSEL_CONFIG.changeDuration },
          (finished) => {
            if (finished) {
              transitionOverlayOpacity.value = 1;
              scheduleOnRN(commitSwipe, -1);
            }
          },
        );
        return;
      }

      translateX.value = withTiming(-sw, {
        duration: CAROUSEL_CONFIG.resetDuration,
      });
    });

  return {
    currentItem,
    previousItem,
    nextItem,
    transitionItem,
    transitionDirection,
    isEnabled,
    gesture,
    translateX,
    transitionOverlayOpacity,
    isDragging,
    slideGap: CAROUSEL_CONFIG.slideGap,
    setSwipeEnabled,
    clearTransition,
  };
}
