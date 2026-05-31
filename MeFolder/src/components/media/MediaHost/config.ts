import type { MediaHostItem } from "@/types/media/viewers";

export const CAROUSEL_CONFIG = {
  swipeThreshold: 140,
  verticalTolerance: 64,
  resetDuration: 150,
  changeDuration: 180,
  velocityThreshold: 420,
  activeOffsetX: 10,
  slideGap: 12,
  thresholdRatio: 0.5,
  minSwipeThreshold: 72,
} as const;

export const clamp = (value: number, min: number, max: number): number => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

export const getCarouselSwipeThreshold = ({
  item,
  screenWidth,
  screenHeight,
}: {
  item: MediaHostItem | null;
  screenWidth: number;
  screenHeight: number;
}): number => {
  if (!item) {
    return CAROUSEL_CONFIG.swipeThreshold;
  }

  if (
    item.mediaWidth == null ||
    item.mediaHeight == null ||
    item.mediaWidth <= 0 ||
    item.mediaHeight <= 0
  ) {
    return CAROUSEL_CONFIG.swipeThreshold;
  }

  const scale = Math.min(
    screenWidth / item.mediaWidth,
    screenHeight / item.mediaHeight,
  );
  const visibleWidth = Math.min(screenWidth, item.mediaWidth * scale);

  return clamp(
    visibleWidth * CAROUSEL_CONFIG.thresholdRatio,
    CAROUSEL_CONFIG.minSwipeThreshold,
    CAROUSEL_CONFIG.swipeThreshold,
  );
};
