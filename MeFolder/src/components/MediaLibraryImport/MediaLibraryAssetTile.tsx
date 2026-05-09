import React from "react";
import { Animated, View, TouchableOpacity } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { usePressScaleAnimation, useStyles } from "@/hooks";
import { useMediaLibraryVideoThumbnail } from "@/hooks/mediaLibrary";

interface MediaLibraryAssetTileProps {
  asset: MediaLibrary.Asset;
  isSelected: boolean;
  onPress: () => void;
}

export function MediaLibraryAssetTile({
  asset,
  isSelected,
  onPress,
}: MediaLibraryAssetTileProps) {
  const styles = useMediaLibraryAssetTileStyles();
  const { animatedStyle, handlePressIn, handlePressOut } =
    usePressScaleAnimation();
  const isVideo = asset.mediaType === MediaLibrary.MediaType.video;
  const videoThumbnailUri = useMediaLibraryVideoThumbnail(asset);
  const previewUri = isVideo ? videoThumbnailUri : asset.uri;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.container, isSelected && styles.containerSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.82}
      >
        {!previewUri ? (
          <View style={styles.videoPlaceholder}>
            <MaterialCommunityIcons
              name="play-circle"
              size={22}
              color="#FFFFFF"
            />
          </View>
        ) : (
          <Image
            source={{ uri: previewUri }}
            style={styles.image}
            contentFit="cover"
            recyclingKey={asset.id}
          />
        )}

        {isVideo ? (
          <View style={styles.videoInfo}>
            <MaterialCommunityIcons
              name="play-circle"
              size={16}
              color="#FFFFFF"
            />
          </View>
        ) : null}

        {isSelected ? (
          <View style={styles.selectionBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const useMediaLibraryAssetTileStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      aspectRatio: 1,
      margin: 4,
      borderRadius: theme.effects.radius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.subCard,
      borderWidth: 2,
      borderColor: "transparent",
    },
    containerSelected: {
      borderColor: theme.colors.primary,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    videoPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#111111",
    },
    selectionBadge: {
      position: "absolute",
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    videoInfo: {
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      bottom: 6,
      left: 8,
    },
  }));
};
