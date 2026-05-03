import React from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import type { MediaHostItem } from "@/types/media/viewers";
import { MediaViewer, type MediaViewerSharedProps } from "./MediaViewer";

interface MediaCarouselProps {
  previousItem: MediaHostItem | null;
  currentItem: MediaHostItem;
  nextItem: MediaHostItem | null;
  transitionItem: MediaHostItem | null;
  transitionDirection: -1 | 0 | 1;
  screenWidth: number;
  slideGap: number;
  gesture: ReturnType<typeof Gesture.Pan>;
  translateX: SharedValue<number>;
  transitionOverlayOpacity: SharedValue<number>;
  sharedViewerProps: MediaViewerSharedProps;
  onCurrentItemSettled?: (itemKey: string) => void;
}

export default function MediaCarousel({
  previousItem,
  currentItem,
  nextItem,
  transitionItem,
  transitionDirection,
  screenWidth,
  slideGap,
  gesture,
  translateX,
  transitionOverlayOpacity,
  sharedViewerProps,
  onCurrentItemSettled,
}: MediaCarouselProps) {
  const slideWidth = screenWidth + slideGap;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const transitionViewerStyle = useAnimatedStyle(() => ({
    opacity: transitionOverlayOpacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ flex: 1, overflow: "hidden", backgroundColor: "#000" }}>
        <Animated.View
          style={[
            { flex: 1, flexDirection: "row", width: slideWidth * 3 },
            animatedStyle,
          ]}
        >
          <View style={{ width: slideWidth, flex: 1, backgroundColor: "#000" }}>
            {previousItem && (
              <View style={{ flex: 1, width: screenWidth }}>
                <MediaViewer
                  item={previousItem}
                  isActive={false}
                  {...sharedViewerProps}
                />
              </View>
            )}
          </View>
          <View style={{ width: slideWidth, flex: 1, backgroundColor: "#000" }}>
            <View style={{ flex: 1, width: screenWidth }}>
              <MediaViewer
                item={currentItem}
                isActive
                {...sharedViewerProps}
                {...(onCurrentItemSettled
                  ? { onItemSettled: onCurrentItemSettled }
                  : {})}
              />
            </View>
          </View>
          <View style={{ width: slideWidth, flex: 1, backgroundColor: "#000" }}>
            {nextItem && (
              <View style={{ flex: 1, width: screenWidth }}>
                <MediaViewer
                  item={nextItem}
                  isActive={false}
                  {...sharedViewerProps}
                />
              </View>
            )}
          </View>
        </Animated.View>
        {transitionItem && transitionDirection !== 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: screenWidth,
              },
              transitionViewerStyle,
            ]}
          >
            <MediaViewer
              item={transitionItem}
              isActive
              autoPlay={false}
              {...sharedViewerProps}
            />
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}
