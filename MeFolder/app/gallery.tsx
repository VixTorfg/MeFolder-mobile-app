import {
  useGalleryContent,
  useStyles,
  usePinchColumns,
  useSelection,
  usePressScaleAnimation,
} from "@/hooks";
import { MultiActionButton, MediaHost } from "@/components";
import { FileModel } from "@/models/file";
import type { MediaHostItem } from "@/types/media/viewers";
import { useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatVideoDuration } from "@/utils/format/date";
import EmptyFolder from "@/components/svgIcons/emptyFolder";
import { cardShadow } from "@/constants/styles/shadows";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { LinearTransition, FadeIn } from "react-native-reanimated";

const SPACING_HORIZONTAL_SM = 10;

interface GalleryTileProps {
  item: FileModel;
  itemSize: number;
  isSelected: boolean;
  selectionMode: boolean;
  onOpenItem: (item: FileModel) => void;
  onToggleSelection: (item: FileModel) => void;
  styles: ReturnType<typeof useGalleryStyles>;
}

function GalleryTile({
  item,
  itemSize,
  isSelected,
  selectionMode,
  onOpenItem,
  onToggleSelection,
  styles,
}: GalleryTileProps) {
  const { animatedStyle, handlePressIn, handlePressOut } =
    usePressScaleAnimation();

  return (
    <Animated.View
      style={{
        width: itemSize,
        height: itemSize,
        padding: 1,
        overflow: "hidden",
      }}
      layout={LinearTransition.duration(300)}
      entering={FadeIn.duration(250)}
    >
      <RNAnimated.View style={[styles.thumbAnimatedWrapper, animatedStyle]}>
        <Pressable
          onPress={() => {
            if (selectionMode) {
              onToggleSelection(item);
              return;
            }

            onOpenItem(item);
          }}
          onLongPress={() => onToggleSelection(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.thumbPressable,
            isSelected && styles.thumbPressableSelected,
          ]}
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
          {isSelected ? (
            <View style={styles.selectionBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
          ) : null}
          {item.category === "video" ? (
            <View style={styles.videoInfo}>
              <MaterialCommunityIcons
                name="play-circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.videoDurationText}>
                {formatVideoDuration(item.metadata.videoMetadata?.duration)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </RNAnimated.View>
    </Animated.View>
  );
}

export default function GalleryScreen() {
  const { tagId, albumName } = useLocalSearchParams();
  const styles = useGalleryStyles();
  const insets = useSafeAreaInsets();

  const { items, loadMore, isLoading } = useGalleryContent({
    tagId: tagId as string,
    pageSize: 100,
  });
  const { itemsSelected, selectionMode, toggleSelection, clearSelection } =
    useSelection(items, tagId as string, "tag");

  const { columns, pinchGesture } = usePinchColumns({
    initialColumns: 4,
    minColumns: 2,
    maxColumns: 6,
  });

  const { width: screenWidth } = useWindowDimensions();
  const itemSize = Math.trunc(
    (screenWidth - 2 * SPACING_HORIZONTAL_SM) / columns,
  );

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

  const handleBackPress = useCallback(() => {
    clearSelection();
    router.back();
  }, [clearSelection]);

  const selectionActionBarOffset = insets.bottom + 12;
  const scrollBottomPadding = selectionMode
    ? selectionActionBarOffset + 92
    : 16;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MultiActionButton
            icon="chevron-back"
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={handleBackPress}
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

        {isLoading && items.length === 0 ? (
          <View style={styles.emptyAlbumContainer}>
            <ActivityIndicator size="large" color={styles.primaryColor.color} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyAlbumContainer}>
            <View style={styles.emptyFolderIconContainer}>
              <EmptyFolder
                strokeWidth={0.35}
                width={120}
                height={120}
                folderColor={styles.iconColor.color}
                crossColor={styles.primaryColor.color}
              />
              <Text style={styles.emptyFolderText}>El álbum está vacío</Text>
            </View>
            <TouchableOpacity
              style={styles.volverButton}
              onPress={() => router.back()}
            >
              <Text style={styles.volverText}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GestureDetector gesture={pinchGesture}>
            <Animated.ScrollView
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={[
                styles.gridContainer,
                { paddingBottom: scrollBottomPadding },
              ]}
            >
              {items.map((item) => (
                <GalleryTile
                  key={item.id}
                  item={item}
                  itemSize={itemSize}
                  isSelected={itemsSelected.some(
                    (selectedItem) => selectedItem.id === item.id,
                  )}
                  selectionMode={selectionMode}
                  onOpenItem={handleOpenItem}
                  onToggleSelection={toggleSelection}
                  styles={styles}
                />
              ))}
            </Animated.ScrollView>
          </GestureDetector>
        )}

        {selectionMode ? (
          <View
            style={[
              styles.selectionActionBar,
              { bottom: selectionActionBarOffset },
            ]}
          >
            <TouchableOpacity
              style={styles.selectionActionButton}
              activeOpacity={0.85}
              onPress={() => {}}
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={24}
                color={styles.primaryColor.color}
              />
              <Text style={styles.selectionActionLabel}>Compartir</Text>
            </TouchableOpacity>

            <View style={styles.selectionActionDivider} />

            <TouchableOpacity
              style={styles.selectionActionButton}
              activeOpacity={0.85}
              onPress={() => {}}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={24}
                color={styles.primaryColor.color}
              />
              <Text style={styles.selectionActionLabel}>Borrar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
      paddingHorizontal: SPACING_HORIZONTAL_SM,
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
      borderRadius: theme.effects.radius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.subCard,
      borderWidth: 2,
      borderColor: "transparent",
    },
    thumbPressableSelected: {
      borderColor: theme.colors.primary,
    },
    thumbAnimatedWrapper: {
      flex: 1,
    },
    thumb: {
      flex: 1,
      borderRadius: 4,
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
      zIndex: 2,
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
    emptyAlbumContainer: {
      flex: 1,
      alignItems: "center",
    },
    emptyFolderIconContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xxl,
    },
    emptyFolderText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 16,
    },
    volverButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      alignSelf: "center",
      justifyContent: "flex-end",
      paddingVertical: theme.spacing.md,
      marginBottom: 126,
      width: "80%",
    },
    volverText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    primaryColor: {
      color: theme.colors.primary,
    },
    selectionActionBar: {
      ...cardShadow(theme),
      position: "absolute",
      left: theme.spacing.md,
      right: theme.spacing.md,
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.lg,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      overflow: "hidden",
    },
    selectionActionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
    },
    selectionActionLabel: {
      fontFamily: theme.typography.fontFamily.primary.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    selectionActionDivider: {
      width: theme.effects.borderWidth.xs,
      backgroundColor: theme.colors.borderSoft,
    },
  }));
};
