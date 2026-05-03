import { useGalleryContent, useStyles, usePinchColumns } from "@/hooks";
import { MultiActionButton, MediaHost } from "@/components";
import { FileModel } from "@/models/file";
import type { MediaHostItem } from "@/types/media/viewers";
import { useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatVideoDuration } from "@/utils/format/date";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { LinearTransition, FadeIn } from "react-native-reanimated";

export default function GalleryScreen() {
  const { tagId, albumName } = useLocalSearchParams();
  const styles = useGalleryStyles();
  const insets = useSafeAreaInsets();

  const { items, loadMore } = useGalleryContent({
    tagId: tagId as string,
    pageSize: 100,
  });

  const { columns, pinchGesture } = usePinchColumns({
    initialColumns: 4,
    minColumns: 2,
    maxColumns: 6,
  });

  const { width: screenWidth } = useWindowDimensions();
  const itemSize = Math.trunc(screenWidth / columns);

  const [selectedMediaId, setSelectedMediaId] = useState<
    FileModel["id"] | null
  >(null);

  const mediaItems = useMemo<MediaHostItem[]>(
    () =>
      items.flatMap((item) => {
        if (!item.storageUrl) return [];
        if (item.category !== "image" && item.category !== "video") {
          return [];
        }

        return [
          {
            uri: item.storageUrl,
            fileId: item.id,
            ...(item.metadata.mimeType != null && {
              mimeType: item.metadata.mimeType,
            }),
            ...(item.thumbnailUrl != null && {
              thumbnailUrl: item.thumbnailUrl,
            }),
            ...(item.metadata.imageMetadata != null && {
              mediaWidth: item.metadata.imageMetadata.width,
              mediaHeight: item.metadata.imageMetadata.height,
            }),
            ...(item.metadata.videoMetadata != null && {
              mediaWidth: item.metadata.videoMetadata.width,
              mediaHeight: item.metadata.videoMetadata.height,
            }),
            displayName: item.name,
            category: item.category,
          },
        ];
      }),
    [items],
  );

  const handleOpenItem = useCallback((file: FileModel) => {
    if (!file.storageUrl) return;
    if (file.category !== "image" && file.category !== "video") return;

    setSelectedMediaId(file.id);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromEnd =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromEnd < 200) {
        loadMore();
      }
    },
    [loadMore],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MultiActionButton
            icon="chevron-back"
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => router.back()}
          />
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>
              {(albumName as string) ?? "Galería"}
            </Text>
          </View>
          <MultiActionButton
            icon="add"
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() =>
              router.push({
                pathname: "/album-adder",
                params: {
                  albumId: tagId as string,
                  albumName: (albumName as string) ?? "",
                },
              })
            }
          />
        </View>

        <GestureDetector gesture={pinchGesture}>
          <Animated.ScrollView
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.gridContainer}
          >
            {items.map((item) => (
              <Animated.View
                key={item.id}
                style={{
                  width: itemSize,
                  height: itemSize,
                  padding: 1,
                  overflow: "hidden",
                }}
                layout={LinearTransition.duration(300)}
                entering={FadeIn.duration(250)}
              >
                <Pressable
                  onPress={() => handleOpenItem(item)}
                  style={styles.thumbPressable}
                >
                  {item.thumbnailUrl && (
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      recyclingKey={item.id}
                      style={styles.thumb}
                      contentFit="cover"
                      transition={200}
                    />
                  )}
                  {item.category === "video" && (
                    <View style={styles.videoInfo}>
                      <MaterialCommunityIcons
                        name="play-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.videoDurationText}>
                        {formatVideoDuration(
                          item.metadata.videoMetadata?.duration,
                        )}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </Animated.ScrollView>
        </GestureDetector>

        {selectedMediaId && (
          <MediaHost
            items={mediaItems}
            initialFileId={selectedMediaId}
            onClose={() => setSelectedMediaId(null)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const useGalleryStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerTitle: {
      flex: 1,
      alignItems: "center",
    },
    headerTitleText: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    iconColor: {
      color: theme.colors.textPrimary,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    thumbPressable: {
      flex: 1,
      padding: 1,
    },
    thumb: {
      flex: 1,
      borderRadius: 4,
    },
    videoInfo: {
      position: "absolute",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      bottom: 4,
      left: 8,
    },
    videoDurationText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: theme.typography.fontSize.sm,
      color: "#FFFFFF",
    },
  }));
};
