import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { ImageViewer } from "../ImageViewer";
import { VideoPlayer } from "../VideoPlayer";
import { AudioPlayer } from "../AudioPlayer";
import type { MediaHostItem } from "@/types/media/viewers";
import type { SharedValue } from "react-native-reanimated";

/**
 * Placeholder ligero para los slides prev/next del carrusel.
 * Evita montar instancias nativas de VideoPlayer en slots inactivos,
 * que es la principal causa de crash al deslizar.
 */
function InactiveSlide({ item }: { item: MediaHostItem }) {
  if (item.category === "image") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <Image
          source={{ uri: item.uri }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          transition={0}
        />
      </View>
    );
  }

  if (item.category === "video" && item.thumbnailUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          transition={0}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={30} color="#fff" />
          </View>
        </View>
      </View>
    );
  }

  // video sin thumbnail u otro: placeholder estático sin player nativo
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <Ionicons
        name="play-circle-outline"
        size={56}
        color="rgba(255,255,255,0.5)"
      />
      {item.displayName ? (
        <Text
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
          numberOfLines={2}
        >
          {item.displayName}
        </Text>
      ) : null}
    </View>
  );
}

export interface MediaViewerSharedProps {
  onClose: () => void;
  autoPlay?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  onSwipeAvailabilityChange?: (enabled: boolean) => void;
  isDragging?: SharedValue<boolean>;
}

interface MediaViewerProps {
  item: MediaHostItem;
  isActive: boolean;
  onClose: () => void;
  onSwipeAvailabilityChange?: (enabled: boolean) => void;
  autoPlay?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  isDragging?: SharedValue<boolean>;
}

export const MediaViewer = React.memo(function MediaViewer({
  item,
  isActive,
  onClose,
  onSwipeAvailabilityChange,
  autoPlay = false,
  imageWidth,
  imageHeight,
  isDragging,
}: MediaViewerProps) {
  // Slides inactivos usan InactiveSlide: evita múltiples players nativos simultáneos
  if (!isActive) {
    return <InactiveSlide item={item} />;
  }

  const itemKey = item.fileId ?? `${item.category}:${item.uri}`;

  switch (item.category) {
    case "image":
      return (
        <ImageViewer
          key={itemKey}
          source={item}
          onClose={onClose}
          {...(imageWidth !== undefined ? { imageWidth } : {})}
          {...(imageHeight !== undefined ? { imageHeight } : {})}
          {...(onSwipeAvailabilityChange ? { onSwipeAvailabilityChange } : {})}
          {...(isDragging !== undefined ? { isDragging } : {})}
        />
      );
    case "video":
      return (
        <VideoPlayer
          key={itemKey}
          source={item}
          onClose={onClose}
          autoPlay={autoPlay}
          {...(onSwipeAvailabilityChange ? { onSwipeAvailabilityChange } : {})}
          {...(isDragging !== undefined ? { isDragging } : {})}
        />
      );
    case "audio":
      return (
        <AudioPlayer
          key={itemKey}
          source={item}
          onClose={onClose}
          autoPlay={autoPlay}
        />
      );
    default:
      return null;
  }
});
