import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  View,
} from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { router, useFocusEffect } from "expo-router";
import {
  AlbumCard,
  AlbumEmptyState,
  FavoriteTagChip,
  PriorityTagCard,
  TutorialPopup,
} from "@/components";
import { useAlbumDailyCovers, useTagsContent } from "@/hooks/tags";
import { useHomeStyles } from "@/screenStyles";
import type { TagModel } from "@/models/tag";
import {
  useDailyBentoPattern,
  useDeviceOrientation,
  useSinglePress,
  useTheme,
  useTutorial,
} from "@/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "@/providers";
import type { FileStorageUsageSummary } from "@/services/FileService";
import { formatFileSize } from "@/utils/format";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SYSTEM_ALBUM_TAG_ID } from "@/database/seeds/systemTags";

const EMPTY_STORAGE_USAGE: FileStorageUsageSummary = {
  totalAppBytes: 0,
  sizeByGroup: {
    image: 0,
    video: 0,
    audio: 0,
    documents: 0,
    other: 0,
  },
};

const sortAlbumsByUsage = (albums: TagModel[]): TagModel[] => {
  return [...albums].sort((left, right) => {
    if (right.usageCount !== left.usageCount) {
      return right.usageCount - left.usageCount;
    }

    return left.name.localeCompare(right.name, "es", {
      sensitivity: "base",
    });
  });
};

const buildPatternItems = (
  albums: TagModel[],
  patternSlots: {
    index: number;
    column: number;
    row: number;
    colSpan: 1 | 2;
    rowSpan: 1 | 2;
  }[],
) => {
  const sortedSlots = [...patternSlots].sort(
    (left, right) => left.index - right.index,
  );

  return sortedSlots.flatMap((slot, slotIndex) => {
    const album = albums[slotIndex];
    if (!album) {
      return [];
    }

    return [{ album, slot }];
  });
};

export default function HomeScreen() {
  const styles = useHomeStyles();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, windowHeight, windowWidth } = useDeviceOrientation();
  const { services } = useServices();
  const { items, albums, loading } = useTagsContent();
  const { albumDailyCovers } = useAlbumDailyCovers(albums);
  const tutorial = useTutorial({ autoShowIfUnseen: true });
  const {
    config: bentoConfig,
    pattern: dailyBentoPattern,
    isLoading: isBentoPatternLoading,
  } = useDailyBentoPattern(isTablet);
  const [storageUsage, setStorageUsage] =
    useState<FileStorageUsageSummary>(EMPTY_STORAGE_USAGE);
  const [deletedItemsCount, setDeletedItemsCount] = useState(0);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const { isLocked: isNavigationLocked, run: runSingleNavigation } =
    useSinglePress();

  const favoriteTags = useMemo(
    () => items.filter((tag) => tag.isFavorite).slice(0, 8),
    [items],
  );
  const highPriorityTags = useMemo(
    () =>
      items
        .filter((tag) => tag.priority === "high" || tag.priority === "critical")
        .sort((left, right) => right.usageCount - left.usageCount)
        .slice(0, 3),
    [items],
  );

  const homeAlbums = useMemo(() => {
    const albumsWithFiles = albums.filter(
      (album) => album.id !== SYSTEM_ALBUM_TAG_ID && album.usageCount > 0,
    );
    return sortAlbumsByUsage(albumsWithFiles).slice(
      0,
      Math.min(bentoConfig.maxAlbums, dailyBentoPattern.slots.length),
    );
  }, [albums, bentoConfig.maxAlbums, dailyBentoPattern.slots.length]);
  const bentoPatternItems = useMemo(
    () => buildPatternItems(homeAlbums, dailyBentoPattern.slots),
    [dailyBentoPattern.slots, homeAlbums],
  );
  const gridGap = theme.spacing.sm;
  const horizontalPadding = theme.spacing.md;
  const usableGridWidth = Math.max(
    windowWidth - insets.left - insets.right - horizontalPadding * 2,
    1,
  );
  const columnWidth =
    (usableGridWidth - gridGap * (bentoConfig.columns - 1)) /
    bentoConfig.columns;
  const maxBaseRowHeight =
    (bentoConfig.maxGridHeight - gridGap * (bentoConfig.rows - 1)) /
    bentoConfig.rows;
  const baseRowHeight = Math.min(
    Math.min(
      Math.max(columnWidth * bentoConfig.preferredRowHeightRatio, 84),
      maxBaseRowHeight,
    ),
    windowHeight * (isTablet ? 0.24 : 0.2),
  );
  const gridHeight =
    bentoConfig.rows * baseRowHeight + gridGap * (bentoConfig.rows - 1);

  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      const loadQuickSummary = async () => {
        setIsSummaryLoading(true);

        try {
          const [storageSummary, deletedFiles, deletedFolders] =
            await Promise.all([
              services.fileService.getStorageUsageSummary(),
              services.fileService.getDeletedFiles(),
              services.folderService.getDeletedFolders(),
            ]);

          if (isCancelled) {
            return;
          }

          setStorageUsage(storageSummary);
          setDeletedItemsCount(deletedFiles.length + deletedFolders.length);
        } catch {
          if (isCancelled) {
            return;
          }

          setStorageUsage(EMPTY_STORAGE_USAGE);
          setDeletedItemsCount(0);
        } finally {
          if (!isCancelled) {
            setIsSummaryLoading(false);
          }
        }
      };

      void loadQuickSummary();

      return () => {
        isCancelled = true;
      };
    }, [services.fileService, services.folderService]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inicio</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Álbumes</Text>
          <TouchableOpacity
            onPress={() =>
              void runSingleNavigation(() => router.push("/albums-list"))
            }
            disabled={isNavigationLocked}
          >
            <Text style={styles.sectionAction}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loading || isBentoPatternLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={styles.primaryColor.color} />
            <Text style={styles.helperText}>Cargando álbumes&hellip;</Text>
          </View>
        ) : homeAlbums.length === 0 ? (
          <AlbumEmptyState />
        ) : (
          <View style={styles.bentoGrid}>
            <View style={[styles.bentoCanvas, { height: gridHeight }]}>
              {bentoPatternItems.map(({ album, slot }) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  coverUri={albumDailyCovers[album.id]?.coverUri}
                  style={[
                    styles.bentoCard,
                    {
                      width:
                        columnWidth * slot.colSpan +
                        gridGap * (slot.colSpan - 1),
                      height:
                        baseRowHeight * slot.rowSpan +
                        gridGap * (slot.rowSpan - 1),
                      left: slot.column * (columnWidth + gridGap),
                      top: slot.row * (baseRowHeight + gridGap),
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {favoriteTags.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Favoritos</Text>
              <TouchableOpacity
                onPress={() =>
                  void runSingleNavigation(() => router.push("/tags"))
                }
                disabled={isNavigationLocked}
              >
                <Text style={styles.sectionAction}>Abrir tags</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={favoriteTags}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <FavoriteTagChip tag={item} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoriteScrollContent}
              style={styles.favoriteSection}
            />
          </>
        )}

        {highPriorityTags.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prioridad alta</Text>
              <TouchableOpacity
                onPress={() =>
                  void runSingleNavigation(() => router.push("/tags"))
                }
                disabled={isNavigationLocked}
              >
                <Text style={styles.sectionAction}>Ver etiquetas</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.prioritySection}>
              {highPriorityTags.map((tag) => (
                <PriorityTagCard key={tag.id} tag={tag} />
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen rápido</Text>
        </View>
        <View style={styles.quickStatsGrid}>
          <TouchableOpacity
            style={styles.quickStatCard}
            activeOpacity={0.8}
            onPress={() =>
              void runSingleNavigation(() => router.push("/settings"))
            }
            disabled={isNavigationLocked}
          >
            <View style={styles.quickStatHeader}>
              <MaterialCommunityIcons
                name="harddisk"
                size={20}
                color={styles.iconColor.primaryColor}
              />
              <Text style={styles.quickStatTitle}>Almacenamiento</Text>
            </View>
            {isSummaryLoading ? (
              <Text style={styles.quickStatValue}>Cargando&hellip;</Text>
            ) : (
              <Text style={styles.quickStatValue}>
                {formatFileSize(storageUsage.totalAppBytes)}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStatCard}
            activeOpacity={0.8}
            onPress={() =>
              void runSingleNavigation(() => router.push("/trash"))
            }
            disabled={isNavigationLocked}
          >
            <View style={styles.quickStatHeader}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={styles.iconColor.primaryColor}
              />
              <Text style={styles.quickStatTitle}>Papelera</Text>
            </View>
            {isSummaryLoading ? (
              <Text style={styles.quickStatValue}>Cargando&hellip;</Text>
            ) : (
              <Text style={styles.quickStatValue}>
                {deletedItemsCount} elementos
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TutorialPopup visible={tutorial.visible} onClose={tutorial.close} />
    </View>
  );
}
