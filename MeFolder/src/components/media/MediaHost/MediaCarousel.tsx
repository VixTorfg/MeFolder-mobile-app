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
  screenWidth: number;
  slideGap: number;
  gesture: ReturnType<typeof Gesture.Pan>;
  translateX: SharedValue<number>;
  sharedViewerProps: MediaViewerSharedProps;
}

export default function MediaCarousel({
  previousItem,
  currentItem,
  nextItem,
  screenWidth,
  slideGap,
  gesture,
  translateX,
  sharedViewerProps,
}: MediaCarouselProps) {
  const slideWidth = screenWidth + slideGap;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
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
              <MediaViewer item={currentItem} isActive {...sharedViewerProps} />
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
      </View>
    </GestureDetector>
  );
}
