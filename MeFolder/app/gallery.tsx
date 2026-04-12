import { useGalleryContent, useStyles } from "@/hooks";
import { MultiActionButton, ImageViewer, VideoPlayer } from "@/components";
import { FileModel } from "@/models/file";
import { useLocalSearchParams, router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { MediaSource } from "@/types/media/viewers";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatVideoDuration } from "@/utils/format/date";

export default function GalleryScreen() {
  const { tagId, albumName } = useLocalSearchParams();
  const styles = useGalleryStyles();
  const insets = useSafeAreaInsets();

  const { items, loadMore } = useGalleryContent({
    tagId: tagId as string,
    pageSize: 100,
  });

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerSource, setViewerSource] = useState<MediaSource | null>(null);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [videoPlayerSource, setVideoPlayerSource] =
    useState<MediaSource | null>(null);

  const handleOpenItem = useCallback((file: FileModel) => {
    if (!file.storageUrl) return;

    switch (file.category) {
      case "image":
        setViewerSource({
          uri: file.storageUrl,
          fileId: file.id,
          ...(file.metadata.mimeType && { mimeType: file.metadata.mimeType }),
          displayName: file.name,
        });
        setViewerVisible(true);
        break;

      case "video":
        setVideoPlayerSource({
          uri: file.storageUrl,
          fileId: file.id,
          ...(file.metadata.mimeType && { mimeType: file.metadata.mimeType }),
          displayName: file.name,
        });
        setVideoPlayerVisible(true);
        break;
      default:
        break;
    }
  }, []);

  const renderItem = useCallback(
    (file: FileModel) => (
      <Pressable
        onPress={() => handleOpenItem(file)}
        style={styles.thumbContainer}
      >
        {file.thumbnailUrl && (
          <Image
            source={{ uri: file.thumbnailUrl }}
            recyclingKey={file.id}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
          />
        )}

        {file.category === "video" && (
          <View style={styles.videoInfo}>
            <MaterialCommunityIcons
              name="play-circle"
              size={16}
              color={"#FFFFFF"}
            />

            <Text style={styles.videoDurationText}>
              {formatVideoDuration(file.metadata.videoMetadata?.duration)}
            </Text>
          </View>
        )}
      </Pressable>
    ),
    [handleOpenItem, styles],
  );

  return (
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
      </View>

      <FlashList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.7}
        onEndReached={loadMore}
        numColumns={4}
        contentContainerStyle={{ padding: 8 }}
      />

      {viewerSource && (
        <ImageViewer
          source={viewerSource}
          visible={viewerVisible}
          onClose={() => {
            setViewerVisible(false);
            setViewerSource(null);
          }}
        />
      )}

      {videoPlayerSource && (
        <VideoPlayer
          source={videoPlayerSource}
          visible={videoPlayerVisible}
          onClose={() => {
            setVideoPlayerVisible(false);
            setVideoPlayerSource(null);
          }}
        />
      )}
    </View>
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
      gap: 30,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerTitle: {
      alignItems: "center",
    },
    headerTitleText: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    iconColor: {
      color: theme.colors.textPrimary,
    },
    thumbContainer: {
      flex: 1,
      margin: 2,
    },
    thumb: {
      width: "100%",
      aspectRatio: 1,
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
