import { useGalleryContent, useStyles } from "@/hooks";
import { MultiActionButton, ImageViewer, VideoPlayer } from "@/components";
import { FileModel } from "@/models/file";
import { useLocalSearchParams, router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { MediaSource } from "@/types/media/viewers";

export default function GalleryScreen() {
  const { tagId, albumName } = useLocalSearchParams();
  const styles = useGalleryStyles();

  const items = useGalleryContent({
    tagId: tagId as string,
    page: 1,
    pageSize: 100,
  });

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerSource, setViewerSource] = useState<MediaSource | null>(null);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [videoPlayerSource, setVideoPlayerSource] =
    useState<MediaSource | null>(null);

  const handleOpenImage = useCallback((file: FileModel) => {
    if (!file.storageUrl) return;

    setViewerSource({
      uri: file.storageUrl,
      fileId: file.id,
      ...(file.metadata.mimeType && { mimeType: file.metadata.mimeType }),
      displayName: file.name,
    });
    setViewerVisible(true);
  }, []);

  const renderItem = useCallback(
    (file: FileModel) => (
      <Pressable
        onPress={() => handleOpenImage(file)}
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

        {file.category === "video" && <View style={styles.videoIcon} />}
      </Pressable>
    ),
    [handleOpenImage, styles],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MultiActionButton
            icon="chevron-back"
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => router.back()}
          />
        </View>
      </View>

      <View style={styles.headerTitle}>
        <Text style={styles.headerTitleText}>
          {(albumName as string) ?? "Galería"}
        </Text>
      </View>

      <FlashList
        data={items}
        renderItem={({ item }) => renderItem(item)}
        keyExtractor={(item) => item.id}
        numColumns={3}
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
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: 8,
      paddingVertical: 24,
    },
    headerLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      flex: 1,
    },
    headerTitle: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    headerTitleText: {
      fontSize: 34,
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
      width: "100%" as const,
      aspectRatio: 1,
      borderRadius: 4,
    },
    videoIcon: {
      position: "absolute" as const,
      top: 8,
      right: 8,
    },
  }));
};
