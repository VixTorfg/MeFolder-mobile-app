import React, { useCallback, useMemo, useState } from "react";
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
function MediaPreview({ item }: { item: MediaHostItem }) {
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
  onItemSettled?: (itemKey: string) => void;
}

function ActiveMediaPreview({ item }: { item: MediaHostItem }) {
  if (item.category === "image") {
    return <MediaPreview item={item} />;
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
      </View>
    );
  }

  return <MediaPreview item={item} />;
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
  onItemSettled,
}: MediaViewerProps) {
  const itemKey = item.fileId ?? `${item.category}:${item.uri}`;
  const isPreviewable = item.category === "image" || item.category === "video";
  const [settledItemKey, setSettledItemKey] = useState<string | null>(null);

  const showActivePreview =
    isActive && isPreviewable && settledItemKey !== itemKey;

  const handleInitialRenderSettled = useCallback(() => {
    setSettledItemKey(itemKey);
    onItemSettled?.(itemKey);
  }, [itemKey, onItemSettled]);

  const activePreview = useMemo(() => {
    if (!showActivePreview) return null;

    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        <ActiveMediaPreview item={item} />
      </View>
    );
  }, [item, showActivePreview]);

  // Slides inactivos usan MediaPreview: evita múltiples players nativos simultáneos
  if (!isActive) {
    return <MediaPreview item={item} />;
  }

  switch (item.category) {
    case "image":
      return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <ImageViewer
            key={itemKey}
            source={item}
            onClose={onClose}
            onInitialRenderSettled={handleInitialRenderSettled}
            {...(imageWidth !== undefined ? { imageWidth } : {})}
            {...(imageHeight !== undefined ? { imageHeight } : {})}
            {...(onSwipeAvailabilityChange
              ? { onSwipeAvailabilityChange }
              : {})}
            {...(isDragging !== undefined ? { isDragging } : {})}
          />
          {activePreview}
        </View>
      );
    case "video":
      return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <VideoPlayer
            key={itemKey}
            source={item}
            onClose={onClose}
            onInitialRenderSettled={handleInitialRenderSettled}
            autoPlay={autoPlay}
            {...(onSwipeAvailabilityChange
              ? { onSwipeAvailabilityChange }
              : {})}
            {...(isDragging !== undefined ? { isDragging } : {})}
          />
          {activePreview}
        </View>
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
