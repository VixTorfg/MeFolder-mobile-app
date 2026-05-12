import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  AlbumCard,
  AlbumEmptyState,
  FavoriteTagChip,
  PriorityTagCard,
} from "@/components";
import { useAlbumDailyCovers, useTagsContent } from "@/hooks/tags";
import { useHomeStyles } from "@/screenStyles";
import type { TagModel } from "@/models/tag";
import { useDeviceOrientation, useTheme } from "@/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "@/providers";
import type { FileStorageUsageSummary } from "@/services/FileService";
import { formatFileSize } from "@/utils/format";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type BentoSpan = 1 | 2;

type BentoAlbumItem = {
  album: TagModel;
  colSpan: BentoSpan;
  rowSpan: BentoSpan;
};

type PositionedBentoAlbumItem = BentoAlbumItem & {
  column: number;
  row: number;
};

type BentoLayout = {
  items: PositionedBentoAlbumItem[];
  rows: number;
};

type BentoConfig = {
  columns: number;
  rows: number;
  maxAlbums: number;
  maxLargeTiles: number;
  maxGridHeight: number;
  preferredRowHeightRatio: number;
};

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

const LARGE_TILE = { colSpan: 2, rowSpan: 2 } as const;
const SMALL_TILE = { colSpan: 1, rowSpan: 1 } as const;

const getBentoConfig = (isTablet: boolean): BentoConfig => {
  if (isTablet) {
    return {
      columns: 4,
      rows: 4,
      maxAlbums: 8,
      maxLargeTiles: 3,
      maxGridHeight: 468,
      preferredRowHeightRatio: 0.72,
    };
  }

  return {
    columns: 4,
    rows: 3,
    maxAlbums: 6,
    maxLargeTiles: 2,
    maxGridHeight: 360,
    preferredRowHeightRatio: 1.12,
  };
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

const buildTilePriority = (
  albums: TagModel[],
  config: BentoConfig,
): BentoAlbumItem[] => {
  const totalCells = config.columns * config.rows;
  const extraCellsAvailable = Math.max(totalCells - albums.length, 0);
  const allowedLargeTiles = Math.min(
    config.maxLargeTiles,
    Math.floor(extraCellsAvailable / 3),
  );
  let usedLargeTiles = 0;

  return albums.slice(0, config.maxAlbums).map((album, index) => {
    if (
      album.usageCount >= 10 &&
      usedLargeTiles < allowedLargeTiles &&
      index < allowedLargeTiles + 2
    ) {
      usedLargeTiles += 1;
      return {
        album,
        ...LARGE_TILE,
      };
    }

    return {
      album,
      ...SMALL_TILE,
    };
  });
};

const canPlaceTile = (
  occupiedCells: boolean[][],
  row: number,
  column: number,
  colSpan: BentoSpan,
  rowSpan: BentoSpan,
  config: Pick<BentoConfig, "columns" | "rows">,
): boolean => {
  if (column + colSpan > config.columns || row + rowSpan > config.rows) {
    return false;
  }

  for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
      if (occupiedCells[row + rowOffset]?.[column + columnOffset]) {
        return false;
      }
    }
  }

  return true;
};

const markTileCells = (
  occupiedCells: boolean[][],
  row: number,
  column: number,
  colSpan: BentoSpan,
  rowSpan: BentoSpan,
  config: Pick<BentoConfig, "columns">,
) => {
  for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
    const nextRow = row + rowOffset;
    if (!occupiedCells[nextRow]) {
      occupiedCells[nextRow] = Array(config.columns).fill(false);
    }

    for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
      occupiedCells[nextRow][column + columnOffset] = true;
    }
  }
};

const buildBentoLayout = (
  albums: BentoAlbumItem[],
  config: Pick<BentoConfig, "columns" | "rows" | "maxAlbums">,
): BentoLayout => {
  const occupiedCells: boolean[][] = [];
  const items: PositionedBentoAlbumItem[] = [];

  for (const item of albums) {
    const candidates: Array<Omit<BentoAlbumItem, "album">> = [
      {
        colSpan: item.colSpan,
        rowSpan: item.rowSpan,
      },
    ];

    if (item.colSpan !== 1 || item.rowSpan !== 1) {
      candidates.push(SMALL_TILE);
    }

    let wasPlaced = false;

    for (let row = 0; row < config.rows; row += 1) {
      for (let column = 0; column < config.columns; column += 1) {
        const fittingCandidate = candidates.find((candidate) =>
          canPlaceTile(
            occupiedCells,
            row,
            column,
            candidate.colSpan,
            candidate.rowSpan,
            config,
          ),
        );

        if (!fittingCandidate) {
          continue;
        }

        markTileCells(
          occupiedCells,
          row,
          column,
          fittingCandidate.colSpan,
          fittingCandidate.rowSpan,
          config,
        );
        items.push({
          album: item.album,
          column,
          row,
          colSpan: fittingCandidate.colSpan,
          rowSpan: fittingCandidate.rowSpan,
        });
        wasPlaced = true;
        break;
      }

      if (wasPlaced) {
        break;
      }
    }
  }

  const rows = occupiedCells.length;

  return {
    items,
    rows,
  };
};

export default function HomeScreen() {
  const styles = useHomeStyles();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, windowHeight, windowWidth } = useDeviceOrientation();
  const { services } = useServices();
  const { items, albums, loading } = useTagsContent();
  const { albumDailyCovers } = useAlbumDailyCovers(albums);
  const bentoConfig = useMemo(() => getBentoConfig(isTablet), [isTablet]);
  const [storageUsage, setStorageUsage] =
    useState<FileStorageUsageSummary>(EMPTY_STORAGE_USAGE);
  const [deletedItemsCount, setDeletedItemsCount] = useState(0);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);

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

  const homeAlbums = useMemo(
    () => sortAlbumsByUsage(albums).slice(0, bentoConfig.maxAlbums),
    [albums, bentoConfig.maxAlbums],
  );
  const prioritizedAlbums = useMemo(
    () => buildTilePriority(homeAlbums, bentoConfig),
    [bentoConfig, homeAlbums],
  );
  const bentoLayout = useMemo(
    () => buildBentoLayout(prioritizedAlbums, bentoConfig),
    [bentoConfig, prioritizedAlbums],
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
    bentoLayout.rows > 0
      ? bentoLayout.rows * baseRowHeight + gridGap * (bentoLayout.rows - 1)
      : 0;

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
          <TouchableOpacity onPress={() => router.push("/albums-list")}>
            <Text style={styles.sectionAction}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={styles.primaryColor.color} />
            <Text style={styles.helperText}>Cargando álbumes...</Text>
          </View>
        ) : homeAlbums.length === 0 ? (
          <AlbumEmptyState />
        ) : (
          <View style={styles.bentoGrid}>
            <View style={[styles.bentoCanvas, { height: gridHeight }]}>
              {bentoLayout.items.map((item) => (
                <AlbumCard
                  key={item.album.id}
                  album={item.album}
                  coverUri={albumDailyCovers[item.album.id]?.coverUri}
                  style={[
                    styles.bentoCard,
                    {
                      width:
                        columnWidth * item.colSpan +
                        gridGap * (item.colSpan - 1),
                      height:
                        baseRowHeight * item.rowSpan +
                        gridGap * (item.rowSpan - 1),
                      left: item.column * (columnWidth + gridGap),
                      top: item.row * (baseRowHeight + gridGap),
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
              <TouchableOpacity onPress={() => router.push("/tags")}>
                <Text style={styles.sectionAction}>Abrir tags</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoriteScrollContent}
              style={styles.favoriteSection}
            >
              {favoriteTags.map((tag) => (
                <FavoriteTagChip key={tag.id} tag={tag} />
              ))}
            </ScrollView>
          </>
        )}

        {highPriorityTags.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prioridad alta</Text>
              <TouchableOpacity onPress={() => router.push("/tags")}>
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
            onPress={() => router.push("/settings")}
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
              <Text style={styles.quickStatValue}>Cargando...</Text>
            ) : (
              <Text style={styles.quickStatValue}>
                {formatFileSize(storageUsage.totalAppBytes)}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStatCard}
            activeOpacity={0.8}
            onPress={() => router.push("/trash")}
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
              <Text style={styles.quickStatValue}>Cargando...</Text>
            ) : (
              <Text style={styles.quickStatValue}>
                {deletedItemsCount} elementos
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
