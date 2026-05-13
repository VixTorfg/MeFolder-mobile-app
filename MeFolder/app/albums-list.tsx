import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlbumCard, MultiActionButton } from "@/components";
import { useAlbumDailyCovers } from "@/hooks/tags/useAlbumDailyCovers";
import { useStyles } from "@/hooks";
import { useServices } from "@/providers";
import type { TagModel } from "@/models/tag";

export default function AlbumsListScreen() {
  const insets = useSafeAreaInsets();
  const styles = useAlbumsListStyles();
  const { services } = useServices();

  const [albums, setAlbums] = useState<TagModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { albumDailyCovers } = useAlbumDailyCovers(albums);

  const loadAlbums = useCallback(async () => {
    setIsLoading(true);

    try {
      const allAlbums = await services.tagService.getAllAlbums();
      const sortedAlbums = allAlbums.toSorted((left, right) =>
        left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
      );
      setAlbums(sortedAlbums);
    } finally {
      setIsLoading(false);
    }
  }, [services.tagService]);

  useFocusEffect(
    useCallback(() => {
      void loadAlbums();
    }, [loadAlbums]),
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={styles.primaryColor.color} />
          <Text style={styles.helperText}>Cargando álbumes&hellip;</Text>
        </View>
      );
    }

    if (albums.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.helperText}>No hay álbumes disponibles.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={albums}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AlbumCard
            album={item}
            coverUri={albumDailyCovers[item.id]?.coverUri}
            style={styles.albumCard}
          />
        )}
      />
    );
  };

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
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Listado de Albumes</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {renderContent()}
    </View>
  );
}

const useAlbumsListStyles = () => {
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
      gap: theme.spacing.sm,
    },
    headerTitleWrapper: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    headerSpacer: {
      width: 42,
    },
    listContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    albumCard: {
      flex: 0,
      width: "100%",
      minHeight: 104,
      height: 104,
      marginBottom: theme.spacing.sm,
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    helperText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    iconColor: {
      color: theme.colors.textPrimary,
    },
    primaryColor: {
      color: theme.colors.primary,
    },
  }));
};
