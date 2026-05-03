import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import type { MediaHostItem } from "@/types/media/viewers";
import { scheduleOnRN } from "react-native-worklets";

const CAROUSEL_SWIPE_THRESHOLD = 140;
const CAROUSEL_VERTICAL_TOLERANCE = 80;
const CAROUSEL_RESET_DURATION = 180;
const CAROUSEL_CHANGE_DURATION = 220;
const CAROUSEL_VELOCITY_THRESHOLD = 500;
const SLIDE_GAP = 12;
const CAROUSEL_THRESHOLD_RATIO = 0.5;
const CAROUSEL_MIN_SWIPE_THRESHOLD = 72;

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
  isEnabled: boolean;
  gesture: ReturnType<typeof Gesture.Pan>;
  translateX: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  slideGap: number;
  setSwipeEnabled: (enabled: boolean) => void;
}

const clamp = (value: number, min: number, max: number): number => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

export function useCarrusel({
  items,
  initialFileId,
  screenWidth,
  screenHeight,
}: UseCarruselParams): UseCarruselResult {
  const slideWidth = screenWidth + SLIDE_GAP;

  const initialIndex = useMemo(() => {
    if (items.length === 0) return 0;
    if (!initialFileId) return 0;
    const index = items.findIndex((item) => item.fileId === initialFileId);
    return index >= 0 ? index : 0;
  }, [items, initialFileId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [pendingResetIndex, setPendingResetIndex] = useState<number | null>(
    null,
  );

  const translateX = useSharedValue(-slideWidth);
  const isDragging = useSharedValue(false);
  const currentIndexSV = useSharedValue(initialIndex);
  const isSwipeEnabledSV = useSharedValue(true);
  const itemsLengthSV = useSharedValue(items.length);
  const slideWidthSV = useSharedValue(slideWidth);
  const swipeThresholdSV = useSharedValue(CAROUSEL_SWIPE_THRESHOLD);
  const isEnabledSV = useSharedValue(items.length > 1);

  const safeIndex = Math.min(currentIndex, Math.max(items.length - 1, 0));
  const currentItem = items[safeIndex] ?? null;
  const previousItem =
    currentIndex > 0 ? (items[currentIndex - 1] ?? null) : null;
  const nextItem =
    currentIndex < items.length - 1 ? (items[currentIndex + 1] ?? null) : null;
  const isEnabled = currentItem != null && items.length > 1;

  const currentSwipeThreshold = useMemo(() => {
    if (!currentItem) {
      return CAROUSEL_SWIPE_THRESHOLD;
    }

    if (
      currentItem.mediaWidth == null ||
      currentItem.mediaHeight == null ||
      currentItem.mediaWidth <= 0 ||
      currentItem.mediaHeight <= 0
    ) {
      return CAROUSEL_SWIPE_THRESHOLD;
    }

    const scale = Math.min(
      screenWidth / currentItem.mediaWidth,
      screenHeight / currentItem.mediaHeight,
    );
    const visibleWidth = Math.min(screenWidth, currentItem.mediaWidth * scale);

    return clamp(
      visibleWidth * CAROUSEL_THRESHOLD_RATIO,
      CAROUSEL_MIN_SWIPE_THRESHOLD,
      CAROUSEL_SWIPE_THRESHOLD,
    );
  }, [currentItem, screenHeight, screenWidth]);

  useEffect(() => {
    currentIndexSV.value = safeIndex;
  }, [safeIndex]);

  useEffect(() => {
    itemsLengthSV.value = items.length;
    isEnabledSV.value = items.length > 1;
  }, [items.length]);

  useEffect(() => {
    slideWidthSV.value = slideWidth;
  }, [slideWidth]);

  useEffect(() => {
    swipeThresholdSV.value = currentSwipeThreshold;
  }, [currentSwipeThreshold, swipeThresholdSV]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setPendingResetIndex(null);
    currentIndexSV.value = initialIndex;
    isSwipeEnabledSV.value = true;
    translateX.value = -slideWidth;
  }, [initialIndex, slideWidth]);

  useEffect(() => {
    translateX.value = isEnabled ? -slideWidth : 0;
  }, [isEnabled, slideWidth]);

  useLayoutEffect(() => {
    if (pendingResetIndex === null || currentIndex !== pendingResetIndex) {
      return;
    }

    translateX.value = -slideWidth;
    isSwipeEnabledSV.value = true;
    setPendingResetIndex(null);
  }, [
    currentIndex,
    pendingResetIndex,
    translateX,
    isSwipeEnabledSV,
    slideWidth,
  ]);

  const commitSwipe = useCallback(
    (direction: -1 | 1) => {
      const nextIndex = clamp(
        currentIndexSV.value + direction,
        0,
        itemsLengthSV.value - 1,
      );

      currentIndexSV.value = nextIndex;
      setCurrentIndex(nextIndex);
      setPendingResetIndex(nextIndex);
    },
    [currentIndexSV, itemsLengthSV],
  );

  const setSwipeEnabled = useCallback(
    (enabled: boolean) => {
      isSwipeEnabledSV.value = enabled;
    },
    [isSwipeEnabledSV],
  );

  const gesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .activeOffsetX([-16, 16])
    .onBegin(() => {
      isDragging.value = true;
    })
    .onFinalize(() => {
      isDragging.value = false;
    })
    .onUpdate((event) => {
      if (!isEnabledSV.value || !isSwipeEnabledSV.value) return;
      if (Math.abs(event.translationY) > CAROUSEL_VERTICAL_TOLERANCE) return;

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
        Math.abs(event.translationY) > CAROUSEL_VERTICAL_TOLERANCE
      ) {
        translateX.value = withTiming(-slideWidthSV.value, {
          duration: CAROUSEL_RESET_DURATION,
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
          event.velocityX <= -CAROUSEL_VELOCITY_THRESHOLD);
      const shouldGoPrevious =
        hasPrevious &&
        (event.translationX >= swipeThreshold ||
          event.velocityX >= CAROUSEL_VELOCITY_THRESHOLD);

      if (shouldGoNext) {
        isSwipeEnabledSV.value = false;
        translateX.value = withTiming(
          -2 * sw,
          { duration: CAROUSEL_CHANGE_DURATION },
          (finished) => {
            if (finished) scheduleOnRN(commitSwipe, 1);
          },
        );
        return;
      }

      if (shouldGoPrevious) {
        isSwipeEnabledSV.value = false;
        translateX.value = withTiming(
          0,
          { duration: CAROUSEL_CHANGE_DURATION },
          (finished) => {
            if (finished) scheduleOnRN(commitSwipe, -1);
          },
        );
        return;
      }

      translateX.value = withTiming(-sw, {
        duration: CAROUSEL_RESET_DURATION,
      });
    });

  return {
    currentItem,
    previousItem,
    nextItem,
    isEnabled,
    gesture,
    translateX,
    isDragging,
    slideGap: SLIDE_GAP,
    setSwipeEnabled,
  };
}
